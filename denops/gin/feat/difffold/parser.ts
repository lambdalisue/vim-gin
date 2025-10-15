/**
 * Represents a file section in a unified diff
 */
export type FileSection = {
  /** Starting line number (1-based) */
  start: number;
  /** Ending line number (1-based) */
  end: number;
  /** Old file path */
  oldPath: string;
  /** New file path */
  newPath: string;
};

const patternOld = /^\-\-\- (.*?)(?:\t.*)?$/;
const patternNew = /^\+\+\+ (.*?)(?:\t.*)?$/;

/**
 * Parse unified diff content and extract file sections
 *
 * @param content - diff content as array of lines
 * @returns Array of file sections for folding
 *
 * @example
 * ```typescript
 * const content = [
 *   "--- a/file1.txt",
 *   "+++ b/file1.txt",
 *   "@@ -1,3 +1,4 @@",
 *   " line1",
 *   "--- a/file2.txt",
 *   "+++ b/file2.txt",
 *   "@@ -1,2 +1,2 @@",
 *   " line2",
 * ];
 * const sections = parse(content);
 * // sections[0] = { start: 1, end: 4, oldPath: "a/file1.txt", newPath: "b/file1.txt" }
 * // sections[1] = { start: 5, end: 8, oldPath: "a/file2.txt", newPath: "b/file2.txt" }
 * ```
 */
export function parse(content: string[]): FileSection[] {
  const sections: FileSection[] = [];
  let currentSection: Partial<FileSection> | null = null;

  for (let i = 0; i < content.length; i++) {
    const line = content[i];
    const lnum = i + 1; // 1-based line number

    // Start of a new file section
    const oldMatch = line.match(patternOld);
    if (oldMatch) {
      // Save previous section if exists
      if (currentSection?.start !== undefined) {
        sections.push({
          start: currentSection.start,
          end: i, // Previous line (0-based i = 1-based i)
          oldPath: currentSection.oldPath!,
          newPath: currentSection.newPath!,
        });
      }

      // Start new section
      currentSection = {
        start: lnum,
        oldPath: oldMatch[1],
      };
      continue;
    }

    // New file path (should immediately follow old file path)
    const newMatch = line.match(patternNew);
    if (newMatch && currentSection) {
      currentSection.newPath = newMatch[1];
      continue;
    }
  }

  // Save the last section
  if (currentSection?.start !== undefined) {
    sections.push({
      start: currentSection.start,
      end: content.length,
      oldPath: currentSection.oldPath!,
      newPath: currentSection.newPath!,
    });
  }

  return sections;
}
