/**
 * Represents a location in a file within a diff
 */
export type DiffLocation = {
  path: string;
  lnum: number;
};

/**
 * Represents the result of parsing a diff line for jump information
 */
export type Jump =
  | { type: "old"; old: DiffLocation }
  | { type: "new"; new: DiffLocation }
  | { type: "both"; old: DiffLocation; new: DiffLocation };

// Pattern for special lines (headers)
const patternSpc = /^(?:@@|\-\-\-|\+\+\+) /;
// Pattern for hunk header: @@ -oldStart,oldCount +newStart,newCount @@
const patternRng = /^@@ \-(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@.*$/;
// Pattern for old file header: --- a/path/to/file
const patternOld = /^\-\-\- (.*?)(?:\t.*)?$/;
// Pattern for new file header: +++ b/path/to/file
const patternNew = /^\+\+\+ (.*?)(?:\t.*)?$/;

/**
 * Parse jump target from diff content for a specific side
 */
function parseTarget(
  index: number,
  content: string[],
  side: "old" | "new",
): DiffLocation | undefined {
  const isOld = side === "old";
  const rangeIndex = isOld ? 1 : 2; // m1[1] for old, m1[2] for new
  const pathPattern = isOld ? patternOld : patternNew;
  const excludePrefix = isOld ? "+" : "-";
  const errorSide = isOld ? "old" : "new";

  let path = "";
  let lnum = -1;
  let offset = 0;

  for (let i = index; i >= 0; i--) {
    const line = content[i];
    if (lnum === -1) {
      const m1 = line.match(patternRng);
      if (m1) {
        lnum = Number(m1[rangeIndex]);
        continue;
      }
      // Count lines that exist in this side (exclude the opposite side's changes)
      if (!line.startsWith(excludePrefix)) {
        offset += 1;
      }
    }
    const m2 = line.match(pathPattern);
    if (m2) {
      path = m2[1];
      break;
    }
  }

  if (lnum === -1) {
    throw new Error(`No range pattern found in diff content`);
  }
  if (path === "") {
    throw new Error(
      `No ${errorSide} file header pattern found in diff content`,
    );
  }

  lnum += isOld ? offset - 1 : Math.max(offset - 1, 0);
  return { path, lnum };
}

/**
 * Parse diff content and find jump target at the specified line
 *
 * @param index - 0-based line index (e.g., lnum - 1 where lnum is from fn.line())
 * @param content - diff content as array of lines
 * @returns Jump information, or undefined if not jumpable (e.g., on header lines)
 *
 * @example
 * ```typescript,ignore
 * // With Vim line number
 * const lnum = await fn.line(denops, ".");
 * const content = await fn.getline(denops, 1, "$");
 * const jump = parse(lnum - 1, content);
 *
 * // Direct array index usage
 * const content = [
 *   "--- a/old.txt",
 *   "+++ b/new.txt",
 *   "@@ -1,3 +1,3 @@",
 *   " context line",
 *   "-removed line",
 *   "+added line",
 * ];
 * parse(3, content); // { type: "both", old: {...}, new: {...} }
 * parse(4, content); // { type: "old", old: {...} }
 * parse(5, content); // { type: "new", new: {...} }
 * parse(0, content); // undefined (header line)
 * ```
 */
export function parse(index: number, content: string[]): Jump | undefined {
  const line = content[index];

  // Cannot jump from special lines (headers)
  if (patternSpc.test(line)) {
    return undefined;
  }

  if (line.startsWith("-")) {
    // Deleted line: only exists in old file
    const oldTarget = parseTarget(index, content, "old");
    return oldTarget ? { type: "old", old: oldTarget } : undefined;
  } else if (line.startsWith("+")) {
    // Added line: only exists in new file
    const newTarget = parseTarget(index, content, "new");
    return newTarget ? { type: "new", new: newTarget } : undefined;
  } else {
    // Context line: exists in both files
    const oldTarget = parseTarget(index, content, "old");
    const newTarget = parseTarget(index, content, "new");
    if (oldTarget && newTarget) {
      return { type: "both", old: oldTarget, new: newTarget };
    }
    return undefined;
  }
}
