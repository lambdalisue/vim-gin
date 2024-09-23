import { assertEquals, assertRejects } from "jsr:@std/assert@^1.0.0";
import * as path from "jsr:@std/path@^1.0.0";
import { findWorktree } from "./finder.ts";
import { ExecuteError } from "./process.ts";

Deno.test({
  name: "find() returns a root path of a git working directory",
  fn: async () => {
    const exp = path.resolve(
      path.fromFileUrl(import.meta.url),
      "../../../../",
    );
    assertEquals(await findWorktree("."), exp);
    // An internal cache will be used for the following call
    assertEquals(await findWorktree("."), exp);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "find() throws an error if the path is not in a git working directory",
  fn: async () => {
    await assertRejects(async () => {
      await findWorktree("/");
    }, ExecuteError);
    // An internal cache will be used for the following call
    await assertRejects(async () => {
      await findWorktree("/");
    }, ExecuteError);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
