import { assertEquals } from "https://deno.land/std@0.133.0/testing/asserts.ts";
import { default as Encoding } from "https://cdn.skypack.dev/encoding-japanese@2.0.0/";
import { tryDecode } from "./fileencoding.ts";

function encode(text: string, encoding: string): Uint8Array {
  return new Uint8Array(
    Encoding.convert(Encoding.stringToCode(text), encoding, "UNICODE"),
  );
}

Deno.test("tryDecode", async (t) => {
  const es = ["utf-8", "euc-jp", "sjis"];
  await t.step("decodes utf-8 properly", () => {
    assertEquals(
      tryDecode(encode("こんにちわ\n世界", "utf-8"), es),
      ["utf-8", "こんにちわ\n世界"],
    );
  });
  await t.step("decodes euc-jp properly", () => {
    assertEquals(
      tryDecode(encode("こんにちわ\n世界", "euc-jp"), es),
      ["euc-jp", "こんにちわ\n世界"],
    );
  });
  await t.step("decodes sjis properly", () => {
    assertEquals(
      tryDecode(encode("こんにちわ\n世界", "sjis"), es),
      ["sjis", "こんにちわ\n世界"],
    );
  });
});
