import { path } from "../deps.ts";
import { assertEquals, assertRejects } from "../deps_test.ts";
import { find } from "./finder.ts";
import { ExecuteError } from "./process.ts";

Deno.test("find() returns a root path of a git working directory", async () => {
  const exp = path.resolve(
    path.fromFileUrl(import.meta.url),
    "../../../../",
  );
  assertEquals(await find("."), exp);
  // An internal cache will be used for the following call
  assertEquals(await find("."), exp);
});

Deno.test("find() throws an error if the path is not in a git working directory", async () => {
  await assertRejects(async () => {
    await find("/");
  }, ExecuteError);
  // An internal cache will be used for the following call
  await assertRejects(async () => {
    await find("/");
  }, ExecuteError);
});
