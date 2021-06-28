import { assertEquals } from "./deps_test.ts";
import { decodeUtf8, encodeUtf8 } from "./text.ts";

Deno.test("encodeUtf8() encodes a string into an UTF8 Uint8Array", () => {
  const input = "Hello world!";
  const exp = new Uint8Array([
    72,
    101,
    108,
    108,
    111,
    32,
    119,
    111,
    114,
    108,
    100,
    33,
  ]);
  assertEquals(encodeUtf8(input), exp);
});

Deno.test("decodeUtf8() decodes an UTF8 Uint8Array into a string", () => {
  const input = new Uint8Array([
    72,
    101,
    108,
    108,
    111,
    32,
    119,
    111,
    114,
    108,
    100,
    33,
  ]);
  const exp = "Hello world!";
  assertEquals(decodeUtf8(input), exp);
});
