import { decodeUtf8, partition } from "../../util/text.ts";

export class GitStatusParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GitStatusParseError";
  }
}

export interface GitStatusResult {
  branch: BranchHeaders;
  entries: Entry[];
}

export function parse(
  bytes: Uint8Array,
): GitStatusResult {
  const it = partition(bytes);
  const entries: Entry[] = [];
  let branch: Partial<BranchHeaders> = {};
  while (true) {
    const ret = it.next();
    if (ret.done) {
      break;
    }
    const record = decodeUtf8(ret.value);
    if (!record) {
      continue;
    }
    switch (record.substring(0, 1)) {
      case "#": {
        branch = {
          ...branch,
          ...parseBranchHeaders(record),
        };
        break;
      }
      case "1": {
        entries.push(parseChangedEntry(record));
        break;
      }
      case "2": {
        const ret2 = it.next();
        if (ret2.done) {
          throw new GitStatusParseError(
            "No 'origPath' exists for renamed entry of 'Changed Tracked Entries'",
          );
        }
        const origPath = decodeUtf8(ret2.value);
        entries.push(parseRenamedEntry(record, origPath));
        break;
      }
      case "u": {
        entries.push(parseUnmergedEntry(record));
        break;
      }
      case "?": {
        entries.push(parseUntrackedEntry(record));
        break;
      }
      case "!": {
        entries.push(parseIgnoredEntry(record));
        break;
      }
      default: {
        throw new GitStatusParseError(
          `Unexpected record is detected: ${record}`,
        );
      }
    }
  }
  assertBranchHeaders(branch);
  return {
    branch,
    entries,
  };
}

export interface BranchHeaders {
  oid: string;
  head: string;
  upstream?: string;
  ahead?: number;
  behind?: number;
}

function assertBranchHeaders(
  branch: Partial<BranchHeaders>,
): asserts branch is BranchHeaders {
  if (!branch.oid || !branch.head) {
    throw new GitStatusParseError(`Not enough header`);
  }
}

export function parseBranchHeaders(
  record: string,
): Partial<BranchHeaders> {
  const columns = record.split(" ");
  if (columns[0] === "#" || columns.length >= 3) {
    const v = columns.slice(2).join(" ");
    switch (columns[1]) {
      case "branch.oid": {
        return {
          oid: v,
        };
      }
      case "branch.head": {
        return {
          head: v,
        };
      }
      case "branch.upstream": {
        return {
          upstream: v,
        };
      }
      case "branch.ab": {
        const [ahead, behind] = v.split(" ", 2);
        return {
          ahead: parseInt(ahead.substring(1), 10),
          behind: parseInt(behind.substring(1), 10),
        };
      }
    }
  }
  throw new GitStatusParseError(
    `Invalid 'Branch Headers' is specified: ${record}`,
  );
}

export interface ChangedEntry {
  kind: "changed";
  // The staged and unstaged XY values.
  XY: string;
  // The submodule state.
  sub: string;
  // The octal file mode in HEAD.
  mH: string;
  // The octal file mode in the index.
  mI: string;
  // The octal file mode in the worktree.
  mW: string;
  // The object name in HEAD.
  hH: string;
  // The object name in the index.
  hI: string;
  // The pathname.
  path: string;
}

export function parseChangedEntry(
  record: string,
): ChangedEntry {
  const columns = record.split(" ");
  if (columns[0] === "1" || columns.length >= 8) {
    return {
      kind: "changed",
      XY: columns[1],
      sub: columns[2],
      mH: columns[3],
      mI: columns[4],
      mW: columns[5],
      hH: columns[6],
      hI: columns[7],
      path: columns.slice(8).join(" "),
    };
  }
  throw new GitStatusParseError(
    `Invalid 'Changed Tracked Entries' is specified: ${record}`,
  );
}

export interface RenamedEntry {
  kind: "renamed";
  // The staged and unstaged XY values.
  XY: string;
  // The submodule state.
  sub: string;
  // The octal file mode in HEAD.
  mH: string;
  // The octal file mode in the index.
  mI: string;
  // The octal file mode in the worktree.
  mW: string;
  // The object name in HEAD.
  hH: string;
  // The object name in the index.
  hI: string;
  // The rename or copy score.
  Xscore: string;
  // The pathname.
  path: string;
  // The pathname in the commit at HEAD or in the index.
  origPath: string;
}

export function parseRenamedEntry(
  record: string,
  origPath: string,
): RenamedEntry {
  const columns = record.split(" ");
  if (columns[0] === "2" || columns.length >= 9) {
    return {
      kind: "renamed",
      XY: columns[1],
      sub: columns[2],
      mH: columns[3],
      mI: columns[4],
      mW: columns[5],
      hH: columns[6],
      hI: columns[7],
      Xscore: columns[8],
      path: columns.slice(9).join(" "),
      origPath,
    };
  }
  throw new GitStatusParseError(
    `Invalid 'Changed Tracked Entries' is specified: ${record}`,
  );
}

export interface UnmergedEntry {
  kind: "unmerged";
  // The conflict type.
  XY: string;
  // The submodule state.
  sub: string;
  // The octal file mode in stage 1.
  m1: string;
  // The octal file mode in stage 2.
  m2: string;
  // The octal file mode in stage 3.
  m3: string;
  // The octal file mode in the worktree.
  mW: string;
  // The object name in stage 1.
  h1: string;
  // The object name in stage 2.
  h2: string;
  // The object name in stage 3.
  h3: string;
  // The pathname.
  path: string;
}

export function parseUnmergedEntry(
  record: string,
): UnmergedEntry {
  const columns = record.split(" ");
  if (columns[0] === "u" || columns.length >= 10) {
    return {
      kind: "unmerged",
      XY: columns[1],
      sub: columns[2],
      m1: columns[3],
      m2: columns[4],
      m3: columns[5],
      mW: columns[6],
      h1: columns[7],
      h2: columns[8],
      h3: columns[9],
      path: columns.slice(10).join(" "),
    };
  }
  throw new GitStatusParseError(
    `Invalid 'Changed Tracked Entries' is specified: ${record}`,
  );
}

export interface UntrackedEntry {
  kind: "untracked";
  // The conflict type.
  XY: string;
  // The pathname.
  path: string;
}

export function parseUntrackedEntry(
  record: string,
): UntrackedEntry {
  const columns = record.split(" ");
  if (columns[0] === "?" || columns.length >= 2) {
    return {
      kind: "untracked",
      XY: "??",
      path: columns.slice(1).join(" "),
    };
  }
  throw new GitStatusParseError(
    `Invalid 'Other Items' is specified: ${record}`,
  );
}

export interface IgnoredEntry {
  kind: "ignored";
  // The conflict type.
  XY: string;
  // The pathname.
  path: string;
}

export function parseIgnoredEntry(
  record: string,
): IgnoredEntry {
  const columns = record.split(" ");
  if (columns[0] === "?" || columns.length >= 2) {
    return {
      kind: "ignored",
      XY: "!!",
      path: columns.slice(1).join(" "),
    };
  }
  throw new GitStatusParseError(
    `Invalid 'Other Items' is specified: ${record}`,
  );
}

export type Entry =
  | ChangedEntry
  | RenamedEntry
  | UnmergedEntry
  | UntrackedEntry
  | IgnoredEntry;
