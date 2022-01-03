import { assertEquals } from "../deps_test.ts";
import { toArgs } from "./arg.ts";

Deno.test("toArgs returns `[]` when the `value` is undefined", () => {
  assertEquals(toArgs("--test", undefined), []);
});
Deno.test("toArgs returns `[{flag}]` when the `value` is `true`", () => {
  assertEquals(toArgs("--test", true), ["--test"]);
});
Deno.test("toArgs returns `[]` when the `value` is `false`", () => {
  assertEquals(toArgs("--test", false), []);
});
Deno.test("toArgs returns `[{flagForFalse}]` when the `value` is `false` and `flagForFalse` option is specified", () => {
  assertEquals(
    toArgs("--test", false, {
      flagForFalse: "--no-test",
    }),
    ["--no-test"],
  );
});
Deno.test("toArgs returns `[{flag}, {value}]` when the `value` is String", () => {
  assertEquals(toArgs("--test", "test"), ["--test", "test"]);
});
Deno.test("toArgs returns `[{flag}, {value}]` when the `value` is String and empty", () => {
  assertEquals(toArgs("--test", ""), ["--test", ""]);
});
Deno.test("toArgs returns `[{flag}, {value}, {flag}, {value}, ...]` when the `value` is Array", () => {
  assertEquals(
    toArgs("--test", ["test1", "test2", "test3"]),
    ["--test", "test1", "--test", "test2", "--test", "test3"],
  );
});
