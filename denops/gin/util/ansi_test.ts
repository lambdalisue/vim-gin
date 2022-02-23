import { assertEquals } from "../deps_test.ts";
import { Annotation, parse } from "./ansi.ts";

Deno.test("parse", async (t) => {
  const testcases: [string, [string, Annotation[]]][] = [
    ["Hello world", ["Hello world", []]],
    ["\x1b[1mHello\x1b[m world", ["Hello world", [
      { offset: 0, value: "\x1b[1m" },
      { offset: 5, value: "\x1b[m" },
    ]]],
    ["\x1b[1mHe\x1b[30mll\x1b[31mo\x1b[m world", ["Hello world", [
      { offset: 0, value: "\x1b[1m" },
      { offset: 2, value: "\x1b[30m" },
      { offset: 4, value: "\x1b[31m" },
      { offset: 5, value: "\x1b[m" },
    ]]],
  ];
  for (const [expr, expected] of testcases) {
    await t.step(`properly handle "${expr}"`, () => {
      const actual = parse(expr);
      assertEquals(actual, expected);
    });
  }
});
