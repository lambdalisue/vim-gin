import { assertEquals } from "../deps_test.ts";
import { toBooleanArgs, toStringArgs } from "./arg.ts";

Deno.test("toStringArgs returns `[]` when the `test` is undefined", () => {
  assertEquals(toStringArgs({ test: undefined }, "test"), []);
});
Deno.test("toStringArgs returns `[]` when the `test` is []", () => {
  assertEquals(toStringArgs({ test: [] }, "test"), []);
});
Deno.test("toStringArgs returns `['--test', '']` when the `test` is ''", () => {
  assertEquals(toStringArgs({ test: "" }, "test"), ["--test", ""]);
});
Deno.test("toStringArgs returns `['--test=foo']` when the `test` is 'foo'", () => {
  assertEquals(toStringArgs({ test: "foo" }, "test"), [
    "--test=foo",
  ]);
});
Deno.test("toStringArgs returns `['--test', 'foo']` when the `test` is 'foo' and `noEqual` is specified", () => {
  assertEquals(toStringArgs({ test: "foo" }, "test", { noEqual: true }), ["--test", "foo"]);
});
Deno.test("toStringArgs returns `['--test-test', 'foo']` when the `test` is 'foo' and `flag` is '--test-test'", () => {
  assertEquals(toStringArgs({ test: "foo" }, "test", { flag: "--test-test" }), [
    "--test-test",
    "foo",
  ]);
});
Deno.test("toStringArgs returns `['--test', 'foo', '--test', 'bar']` when the `test` is ['foo', 'bar']", () => {
  assertEquals(toStringArgs({ test: ["foo", "bar"] }, "test"), [
    "--test",
    "foo",
    "--test",
    "bar",
  ]);
});

Deno.test("toBooleanArgs returns `[]` when the `test` is undefined", () => {
  assertEquals(toBooleanArgs({ test: undefined }, "test"), []);
});
Deno.test("toBooleanArgs returns `[]` when the `test` is []", () => {
  assertEquals(toBooleanArgs({ test: [] }, "test"), []);
});
Deno.test("toBooleanArgs returns `[]` when the `test` is ''", () => {
  assertEquals(toBooleanArgs({ test: "" }, "test"), []);
});
Deno.test("toBooleanArgs returns `['--test']` when the `test` is 'foo'", () => {
  assertEquals(toBooleanArgs({ test: "foo" }, "test"), ["--test"]);
});
Deno.test("toBooleanArgs returns `['--test-test']` when the `test` is 'foo' and `flag` is '--test-test'", () => {
  assertEquals(
    toBooleanArgs({ test: "foo" }, "test", { flag: "--test-test" }),
    ["--test-test"],
  );
});
Deno.test("toBooleanArgs returns `['--test', '--test']` when the `test` is ['foo', 'bar']", () => {
  assertEquals(toBooleanArgs({ test: ["foo", "bar"] }, "test"), [
    "--test",
    "--test",
  ]);
});
