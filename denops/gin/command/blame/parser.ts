/**
 * Author or committer information from git blame
 * Maps to author/committer fields in porcelain output
 */
export type GitPerson = {
  /** Person's name (from author/committer field) */
  name: string;
  /** Email address without angle brackets (from author-mail/committer-mail field) */
  email: string;
  /** Date and Time in UTC (from author-time/committer-time field) */
  time: Date;
  /** Timezone offset like "+0900" or "-0800" (from author-tz/committer-tz field) */
  timezone: string;
};

/**
 * Complete commit information extracted from porcelain output
 * Each unique SHA1 appears once in the commits record
 */
export type GitCommit = {
  /** Author who originally wrote the code */
  author: GitPerson;
  /** Person who committed the change (may differ from author) */
  committer: GitPerson;
  /** First line of commit message (from summary field) */
  summary: string;
  /** True if this is a boundary commit (initial commit or import) */
  boundary: boolean;
  /** Filename at the time of this commit */
  filename: string;
  /**
   * Previous commit information if the line was moved/copied
   * Only present when porcelain output includes 'previous' field
   */
  previous?: {
    /** SHA1 of the previous commit */
    sha: string;
    /** Filename in the previous commit */
    filename: string;
  };
};

/**
 * Information for a single line in the blamed file
 * Corresponds to each content line in porcelain output
 */
export type GitBlameLine = {
  /** Current line number in the file (1-based) */
  lineNumber: number;
  /** Line number in the original commit (1-based, from porcelain header) */
  originalLineNumber: number;
  /** SHA1 of commit that last modified this line */
  commitSha: string;
  /** Actual content of the line (tab prefix removed) */
  content: string;
  /** Number of consecutive lines from the same commit (from porcelain header) */
  numLinesInGroup: number;
};

/**
 * Complete result of parsing git blame --porcelain output
 * Separates commit metadata from line-by-line data for efficiency
 */
export type GitBlameResult = {
  /**
   * Commit information keyed by SHA1
   * Avoids duplication since same commit can affect multiple lines
   */
  commits: Record<string, GitCommit>;
  /**
   * Line-by-line blame information in file order
   * Use commitSha to lookup full commit details in commits record
   */
  lines: GitBlameLine[];
};

// Constants for parsing
const SHA_REGEX = /^([0-9a-f]{40}) (\d+) (\d+)(?: (\d+))?$/;
const PREVIOUS_REGEX = /^previous ([0-9a-f]{40}) (.+)$/;
const EMAIL_BRACKETS_REGEX = /^<(.*)>$/;
const CONTENT_PREFIX = "\t";

// Field prefixes
const FIELD_PREFIX = {
  AUTHOR: "author ",
  AUTHOR_MAIL: "author-mail ",
  AUTHOR_TIME: "author-time ",
  AUTHOR_TZ: "author-tz ",
  COMMITTER: "committer ",
  COMMITTER_MAIL: "committer-mail ",
  COMMITTER_TIME: "committer-time ",
  COMMITTER_TZ: "committer-tz ",
  SUMMARY: "summary ",
  BOUNDARY: "boundary",
  FILENAME: "filename ",
  PREVIOUS: "previous ",
} as const;

// Helper function to remove email angle brackets
function normalizeEmail(email: string): string {
  return email.replace(EMAIL_BRACKETS_REGEX, "$1");
}

// Helper function to create an empty GitPerson
function createEmptyPerson(): GitPerson {
  return { name: "", email: "", time: new Date(0), timezone: "" };
}

// Helper function to create an empty GitCommit
function createEmptyCommit(): GitCommit {
  return {
    author: createEmptyPerson(),
    committer: createEmptyPerson(),
    summary: "",
    boundary: false,
    filename: "",
  };
}

// Helper function to parse commit metadata
function parseCommitMetadata(
  lines: string[],
  startIndex: number,
): { commit: GitCommit; nextIndex: number } {
  const commit = createEmptyCommit();
  let i = startIndex;

  while (i < lines.length && !lines[i].startsWith(CONTENT_PREFIX)) {
    const line = lines[i];

    if (line.startsWith(FIELD_PREFIX.AUTHOR)) {
      commit.author.name = line.substring(FIELD_PREFIX.AUTHOR.length);
    } else if (line.startsWith(FIELD_PREFIX.AUTHOR_MAIL)) {
      const email = line.substring(FIELD_PREFIX.AUTHOR_MAIL.length);
      commit.author.email = normalizeEmail(email);
    } else if (line.startsWith(FIELD_PREFIX.AUTHOR_TIME)) {
      const timestamp = parseInt(
        line.substring(FIELD_PREFIX.AUTHOR_TIME.length),
        10,
      );
      commit.author.time = new Date(timestamp * 1000);
    } else if (line.startsWith(FIELD_PREFIX.AUTHOR_TZ)) {
      commit.author.timezone = line.substring(FIELD_PREFIX.AUTHOR_TZ.length);
    } else if (line.startsWith(FIELD_PREFIX.COMMITTER)) {
      commit.committer.name = line.substring(FIELD_PREFIX.COMMITTER.length);
    } else if (line.startsWith(FIELD_PREFIX.COMMITTER_MAIL)) {
      const email = line.substring(FIELD_PREFIX.COMMITTER_MAIL.length);
      commit.committer.email = normalizeEmail(email);
    } else if (line.startsWith(FIELD_PREFIX.COMMITTER_TIME)) {
      const timestamp = parseInt(
        line.substring(FIELD_PREFIX.COMMITTER_TIME.length),
        10,
      );
      commit.committer.time = new Date(timestamp * 1000);
    } else if (line.startsWith(FIELD_PREFIX.COMMITTER_TZ)) {
      commit.committer.timezone = line.substring(
        FIELD_PREFIX.COMMITTER_TZ.length,
      );
    } else if (line.startsWith(FIELD_PREFIX.SUMMARY)) {
      commit.summary = line.substring(FIELD_PREFIX.SUMMARY.length);
    } else if (line === FIELD_PREFIX.BOUNDARY) {
      commit.boundary = true;
    } else if (line.startsWith(FIELD_PREFIX.FILENAME)) {
      commit.filename = line.substring(FIELD_PREFIX.FILENAME.length);
    } else if (line.startsWith(FIELD_PREFIX.PREVIOUS)) {
      const match = line.match(PREVIOUS_REGEX);
      if (match) {
        commit.previous = {
          sha: match[1],
          filename: match[2],
        };
      }
    }

    i++;
  }

  return { commit, nextIndex: i };
}

// Helper function to skip commit metadata for already-seen commits
function skipCommitMetadata(lines: string[], startIndex: number): number {
  let i = startIndex;
  while (i < lines.length && !lines[i].startsWith(CONTENT_PREFIX)) {
    i++;
  }
  return i;
}

/**
 * Parses the output of `git blame --porcelain` command into a structured format.
 *
 * The porcelain format provides machine-readable output with detailed commit
 * information for each line in a file. This parser extracts commit metadata
 * and line-by-line blame information.
 *
 * @param content - Array of lines from git blame --porcelain output
 * @returns GitBlameResult containing:
 *   - commits: A record of unique commits keyed by SHA1
 *   - lines: Array of blame information for each line in the file
 *
 * @example
 * ```typescript
 * const output = [
 *   "0123456789abcdef0123456789abcdef01234567 1 1 1",
 *   "author John Doe",
 *   "author-mail <john@example.com>",
 *   "author-time 1234567890",
 *   "author-tz +0900",
 *   "committer Jane Smith",
 *   "committer-mail <jane@example.com>",
 *   "committer-time 1234567891",
 *   "committer-tz -0800",
 *   "summary Initial commit",
 *   "filename test.txt",
 *   "\tHello world"
 * ];
 *
 * const result = parseGitBlamePorcelain(output);
 * // result.commits["0123456789abcdef0123456789abcdef01234567"] contains commit info
 * // result.lines[0] contains blame info for line 1
 * ```
 */
export function parseGitBlamePorcelain(content: string[]): GitBlameResult {
  const commits: Record<string, GitCommit> = {};
  const lines: GitBlameLine[] = [];

  if (content.length === 0 || (content.length === 1 && !content[0].trim())) {
    return { commits, lines };
  }

  // Track the group size for commits that span multiple lines
  const commitGroupSizes: Record<string, number> = {};
  let i = 0;

  while (i < content.length) {
    const line = content[i];

    // Skip empty lines
    if (!line) {
      i++;
      continue;
    }

    // Parse header line: SHA1 original_line final_line [num_lines]
    const headerMatch = line.match(SHA_REGEX);
    if (!headerMatch) {
      i++;
      continue;
    }

    const sha = headerMatch[1];
    const originalLineNumber = parseInt(headerMatch[2], 10);
    const finalLineNumber = parseInt(headerMatch[3], 10);
    const numLines = headerMatch[4] ? parseInt(headerMatch[4], 10) : 1;

    // Store the group size if this is the first line of a group
    if (headerMatch[4]) {
      commitGroupSizes[sha] = numLines;
    }

    // Move to next line after header
    i++;

    // Parse or skip commit metadata
    if (!commits[sha]) {
      const { commit, nextIndex } = parseCommitMetadata(content, i);
      commits[sha] = commit;
      i = nextIndex;
    } else {
      i = skipCommitMetadata(content, i);
    }

    // Parse content line
    if (i < content.length && content[i].startsWith(CONTENT_PREFIX)) {
      const contentLine = content[i].substring(CONTENT_PREFIX.length);
      const groupSize = commitGroupSizes[sha] || 1;

      lines.push({
        lineNumber: finalLineNumber,
        originalLineNumber: originalLineNumber,
        commitSha: sha,
        content: contentLine,
        numLinesInGroup: groupSize,
      });

      i++;
    }
  }

  return { commits, lines };
}
