import { assertEquals } from "./deps_test.ts";
import { decodeUtf8, encodeUtf8, NUL, partition } from "./text.ts";

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

Deno.test("partition", () => {
  const b = new Uint8Array([
    1,
    2,
    3,
    4,
    5,
    NUL,
    5,
    4,
    3,
    2,
    1,
    NUL,
    1,
    NUL,
    2,
    2,
    NUL,
    3,
    3,
    3,
  ]);
  const result = [...partition(b)];
  assertEquals(result, [
    new Uint8Array([1, 2, 3, 4, 5]),
    new Uint8Array([5, 4, 3, 2, 1]),
    new Uint8Array([1]),
    new Uint8Array([2, 2]),
    new Uint8Array([3, 3, 3]),
  ]);
});
Deno.test("partition (NUL start)", () => {
  const b = new Uint8Array([
    NUL,
    1,
    2,
    3,
    4,
    5,
    NUL,
    5,
    4,
    3,
    2,
    1,
    NUL,
    1,
    NUL,
    2,
    2,
    NUL,
    3,
    3,
    3,
  ]);
  const result = [...partition(b)];
  assertEquals(result, [
    new Uint8Array([]),
    new Uint8Array([1, 2, 3, 4, 5]),
    new Uint8Array([5, 4, 3, 2, 1]),
    new Uint8Array([1]),
    new Uint8Array([2, 2]),
    new Uint8Array([3, 3, 3]),
  ]);
});
Deno.test("partition (NUL end)", () => {
  const b = new Uint8Array([
    1,
    2,
    3,
    4,
    5,
    NUL,
    5,
    4,
    3,
    2,
    1,
    NUL,
    1,
    NUL,
    2,
    2,
    NUL,
    3,
    3,
    3,
    NUL,
  ]);
  const result = [...partition(b)];
  assertEquals(result, [
    new Uint8Array([1, 2, 3, 4, 5]),
    new Uint8Array([5, 4, 3, 2, 1]),
    new Uint8Array([1]),
    new Uint8Array([2, 2]),
    new Uint8Array([3, 3, 3]),
    new Uint8Array([]),
  ]);
});
Deno.test("partition (NUL start/end)", () => {
  const b = new Uint8Array([
    NUL,
    1,
    2,
    3,
    4,
    5,
    NUL,
    5,
    4,
    3,
    2,
    1,
    NUL,
    1,
    NUL,
    2,
    2,
    NUL,
    3,
    3,
    3,
    NUL,
  ]);
  const result = [...partition(b)];
  assertEquals(result, [
    new Uint8Array([]),
    new Uint8Array([1, 2, 3, 4, 5]),
    new Uint8Array([5, 4, 3, 2, 1]),
    new Uint8Array([1]),
    new Uint8Array([2, 2]),
    new Uint8Array([3, 3, 3]),
    new Uint8Array([]),
  ]);
});
