import { assertEquals, assertRejects } from "jsr:@std/assert@^1.0.0";
import { sandbox } from "jsr:@lambdalisue/sandbox@^2.0.0";
import $ from "jsr:@david/dax@^0.42.0";
import { join } from "jsr:@std/path@^1.0.0";
import { findGitdir, findWorktree } from "./finder.ts";
import { ExecuteError } from "./process.ts";

Deno.test({
  name: "findWorktree() returns a root path of a git working directory",
  fn: async () => {
    await using sbox = await prepare();
    Deno.chdir(join("a", "b", "c"));
    assertEquals(await findWorktree("."), sbox.path);
    // An internal cache will be used for the following call
    assertEquals(await findWorktree("."), sbox.path);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name:
    "findWorktree() throws an error if the path is not in a git working directory",
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

Deno.test({
  name: "findGitdir() returns a root path of a git working directory",
  fn: async () => {
    await using sbox = await prepare();
    Deno.chdir(join("a", "b", "c"));
    assertEquals(await findGitdir("."), join(sbox.path, ".git"));
    // An internal cache will be used for the following call
    assertEquals(await findGitdir("."), join(sbox.path, ".git"));
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "findGitdir() returns a worktree path of a git working directory",
  fn: async () => {
    await using sbox = await prepare();
    await $`git worktree add -b test test main`;
    Deno.chdir("test");
    assertEquals(
      await findGitdir("."),
      join(sbox.path, ".git", "worktrees", "test"),
    );
    // An internal cache will be used for the following call
    assertEquals(
      await findGitdir("."),
      join(sbox.path, ".git", "worktrees", "test"),
    );
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name:
    "findGitdir() throws an error if the path is not in a git working directory",
  fn: async () => {
    await assertRejects(async () => {
      await findGitdir("/");
    }, ExecuteError);
    // An internal cache will be used for the following call
    await assertRejects(async () => {
      await findGitdir("/");
    }, ExecuteError);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

async function prepare(): ReturnType<typeof sandbox> {
  const sbox = await sandbox();
  await $`git init`;
  await $`git commit --allow-empty -m 'Initial commit' --no-gpg-sign`;
  await $`git switch -c main`;
  await Deno.mkdir(join("a", "b", "c"), { recursive: true });
  return sbox;
}
