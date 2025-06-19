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
  name: "findWorktree() returns a root path for worktree inside .git directory",
  fn: async () => {
    await using sbox = await prepare();
    // Create a worktree inside .git/workspaces/ directory
    await Deno.mkdir(join(".git", "workspaces"), { recursive: true });
    await $`git worktree add -b workspace-test .git/workspaces/test main`;

    // Change to a subdirectory within the worktree
    await Deno.mkdir(join(".git", "workspaces", "test", "subdir"), {
      recursive: true,
    });
    Deno.chdir(join(".git", "workspaces", "test", "subdir"));

    // findWorktree should return the worktree root, not the main repository root
    assertEquals(
      await findWorktree("."),
      join(sbox.path, ".git", "workspaces", "test"),
    );
    // An internal cache will be used for the following call
    assertEquals(
      await findWorktree("."),
      join(sbox.path, ".git", "workspaces", "test"),
    );
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

Deno.test({
  name: "findGitdir() returns a gitdir path for worktree inside .git directory",
  fn: async () => {
    await using sbox = await prepare();
    // Create a worktree inside .git/workspaces/ directory
    await Deno.mkdir(join(".git", "workspaces"), { recursive: true });
    await $`git worktree add -b workspace-test2 .git/workspaces/test2 main`;

    // Change to the worktree
    Deno.chdir(join(".git", "workspaces", "test2"));

    // findGitdir should return the correct gitdir for this worktree
    assertEquals(
      await findGitdir("."),
      join(sbox.path, ".git", "worktrees", "test2"),
    );
    // An internal cache will be used for the following call
    assertEquals(
      await findGitdir("."),
      join(sbox.path, ".git", "worktrees", "test2"),
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
