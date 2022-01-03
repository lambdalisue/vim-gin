import { assertEquals } from "../deps_test.ts";
import { toBooleanArgs, toStringArgs } from "./arg.ts";

Deno.test("toStringArgs returns `[]` when the `value` is undefined/null", () => {
  assertEquals(toStringArgs("--test", undefined), []);
  assertEquals(toStringArgs("--test", null), []);
});
Deno.test("toStringArgs returns `['{flag}']` when the `value` is `true`", () => {
  assertEquals(toStringArgs("--test", true), ["--test"]);
});
Deno.test("toStringArgs returns `[]` when the `value` is `false`", () => {
  assertEquals(toStringArgs("--test", false), []);
});
Deno.test("toStringArgs returns `['{flag}', '{value}']` when the `value` is String", () => {
  assertEquals(toStringArgs("--test", "test"), ["--test", "test"]);
});
Deno.test("toStringArgs returns `['{flag}', '']` when the `value` is String and empty", () => {
  assertEquals(toStringArgs("--test", ""), ["--test", ""]);
});
Deno.test("toStringArgs returns `['{flag}={value}']` when the `value` is String with `useEqual` is specified", () => {
  assertEquals(toStringArgs("--test", "test", { useEqual: true }), [
    "--test=test",
  ]);
});
Deno.test("toStringArgs returns `['{flag}=']` when the `value` is String and empty", () => {
  assertEquals(toStringArgs("--test", "", { useEqual: true }), ["--test="]);
});

Deno.test("toBooleanArgs returns `[]` when the `value` is undefined/null", () => {
  assertEquals(toBooleanArgs("--test", undefined), []);
  assertEquals(toBooleanArgs("--test", null), []);
});
Deno.test("toBooleanArgs returns `['{flag}']` when the `value` is `true`", () => {
  assertEquals(toBooleanArgs("--test", true), ["--test"]);
});
Deno.test("toBooleanArgs returns `[]` when the `value` is `false`", () => {
  assertEquals(toBooleanArgs("--test", false), []);
});
Deno.test("toBooleanArgs returns `[]` when the `value` is `false` but `falseFlag` is specified", () => {
  assertEquals(toBooleanArgs("--test", false, { falseFlag: "--no-test" }), [
    "--no-test",
  ]);
});
Deno.test("toBooleanArgs returns `['{flag}']` when the `value` is String", () => {
  assertEquals(toBooleanArgs("--test", "test"), ["--test"]);
});
Deno.test("toBooleanArgs returns `[]` when the `value` is String and empty", () => {
  assertEquals(toBooleanArgs("--test", ""), []);
});
