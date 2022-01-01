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
export function decodeUtf8(input: BufferSource): string {
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
