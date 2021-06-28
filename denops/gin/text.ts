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
