import * as unknownutil from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";

export type FileFormat = "unix" | "dos" | "mac";

const fileFormatDelimiters = {
  unix: "\n",
  dos: "\r\n",
  mac: "\r",
};

export function isFileFormat(v: unknown): v is FileFormat {
  return unknownutil.isString(v) && v in fileFormatDelimiters;
}

export function assertFileFormat(v: unknown): asserts v is FileFormat {
  if (!isFileFormat(v)) {
    throw new Error(`Unknown fileformat '${v}' is specified`);
  }
}

export function ensureFileFormat(v: unknown): FileFormat {
  assertFileFormat(v);
  return v;
}

export function maybeFileFormat(v: unknown): FileFormat | undefined {
  if (isFileFormat(v)) {
    return v;
  }
  return undefined;
}

/**
 * Split text as Text File in POSIX.
 */
export function splitText(text: string, fileformat: FileFormat): string[] {
  const delimiter = fileFormatDelimiters[fileformat];
  const items = text.split(delimiter);
  // NOTE:
  //
  // "Text File" in POSIX definition said that text file ends with newline thus we need to remove
  // the last empty item from `lines`.
  //
  // > 3.206 Line
  // > A sequence of zero or more non- <newline> characters plus a terminating <newline> character.
  // >
  // > 3.403 Text File
  // > A file that contains characters organized into zero or more lines. The lines do not contain NUL
  // > characters and none can exceed {LINE_MAX} bytes in length, including the <newline> character.
  // > Although POSIX.1-2017 does not distinguish between text files and binary files (see the ISO C
  // > standard), many utilities only produce predictable or meaningful output when operating on text
  // > files. The standard utilities that have such restrictions always specify "text files" in their
  // > STDIN or INPUT FILES sections.
  //
  // https://pubs.opengroup.org/onlinepubs/9699919799/
  return items.length && items.at(-1) === "" ? items.slice(0, -1) : items;
}

/**
 * Find proper fileformat from text
 */
export function findFileFormat(
  text: string,
  fileformats: FileFormat[],
): FileFormat | undefined {
  if (
    fileformats.includes("dos") && /\r\n/.test(text) && !/[^\r]\n/.test(text)
  ) {
    return "dos";
  }
  if (fileformats.includes("unix") && /\n/.test(text)) {
    return "unix";
  }
  if (fileformats.includes("mac") && /\r/.test(text)) {
    return "mac";
  }
  return fileformats.at(0);
}
