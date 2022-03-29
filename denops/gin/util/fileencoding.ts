/**
 * Decode content with specified fileencoding
 */
export function decode(
  content: Uint8Array,
  fileencoding: string,
  fatal?: boolean,
): string {
  const decoder = new TextDecoder(fileencoding, {
    fatal,
  });
  return decoder.decode(content);
}

/**
 * Try to decode with fileencodings specified.
 */
export function tryDecode(
  content: Uint8Array,
  fileencodings: string[],
): [string, string] {
  for (const enc of fileencodings) {
    try {
      return [enc, decode(content, enc, true)];
    } catch {
      // Continue
    }
  }
  return ["", decode(content, "utf-8")];
}
