const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * Encode a string into an UTF8 Uint8Array
 */
export function encodeUtf8(input: string): Uint8Array {
  return textEncoder.encode(input);
}

/**
 * Decode an UTF8 Uint8Array into a string
 */
export function decodeUtf8(input: AllowSharedBufferSource): string {
  return textDecoder.decode(input);
}

export const NUL = 0x00;

/**
 * Partition NUL separated bytes into chunks.
 */
export function* partition(
  bytes: Uint8Array,
  start = 0,
): Generator<Uint8Array> {
  let index = bytes.indexOf(NUL, start);
  while (index !== -1) {
    yield bytes.subarray(start, index);
    start = index + 1;
    index = bytes.indexOf(NUL, start);
  }
  yield bytes.subarray(start);
}

/**
 * Count code points instead
 *
 * ref: https://coolaj86.com/articles/how-to-count-unicode-characters-in-javascript/
 */
export function countCodePoints(str: string): number {
  let len = 0;
  for (let index = 0; index < str.length;) {
    let point = str.codePointAt(index);
    if (point == undefined) {
      throw new Error("codePointAt returns undefined");
    }
    let width = 0;
    while (point) {
      width += 1;
      point = point >> 8;
    }
    index += Math.round(width / 2);
    len += 1;
  }
  return len;
}

/**
 * Count bytes of `str` in Vim
 */
export function countVimBytes(str: string): number {
  return encodeUtf8(str).length;
}
