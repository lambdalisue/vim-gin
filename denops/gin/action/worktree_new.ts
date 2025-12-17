import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import * as helper from "jsr:@denops/std@^7.0.0/helper";
import { join } from "jsr:@std/path@^1.0.0/join";
import { dirname } from "jsr:@std/path@^1.0.0/dirname";
import { define, GatherCandidates, Range } from "./core.ts";
import { revParse } from "../git/finder.ts";

export type Candidate = { target?: string };

export async function init(
  denops: Denops,
  bufnr: number,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  await batch.batch(denops, async (denops) => {
    await define(
      denops,
      bufnr,
      "worktree",
      (denops, bufnr, range) =>
        doNew(denops, bufnr, range, false, gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "worktree:force",
      (denops, bufnr, range) =>
        doNew(denops, bufnr, range, true, gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "worktree:orphan",
      (denops, bufnr, range) =>
        doNewOrphan(denops, bufnr, range, gatherCandidates),
    );
  });
}

async function doNew(
  denops: Denops,
  bufnr: number,
  range: Range,
  force: boolean,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const cwd = await fn.getcwd(denops);
  const root = await findRoot(cwd);
  const xs = await gatherCandidates(denops, bufnr, range);
  const x = xs.at(0);
  const from = x?.target ?? "HEAD";
  const branchName = await helper.input(denops, {
    prompt: `New branch (from ${from}): `,
    text: from,
  });
  if (!branchName) {
    await helper.echoerr(denops, "Cancelled");
    return;
  }
  const branchPath = branchName.replace(/[/\\]/g, "_");
  const worktreePath = await helper.input(denops, {
    prompt: `Worktree path (for ${branchName}): `,
    text: join(root, `.worktrees/${branchPath}`),
  });
  if (!worktreePath) {
    await helper.echoerr(denops, "Cancelled");
    return;
  }
  await denops.dispatch("gin", "command", "", [
    "worktree",
    "add",
    ...(force ? ["-f"] : []),
    ...(branchName === from ? [] : [branchName]),
    worktreePath,
    from,
  ]);
  // Change the current working directory to the new worktree
  await fn.chdir(denops, worktreePath);
}

async function doNewOrphan(
  denops: Denops,
  _bufnr: number,
  _range: Range,
  _gatherCandidates: GatherCandidates<unknown>,
): Promise<void> {
  const cwd = await fn.getcwd(denops);
  const root = await findRoot(cwd);
  const branchName = await helper.input(denops, {
    prompt: "New branch (orphan): ",
  });
  if (!branchName) {
    await helper.echoerr(denops, "Cancelled");
    return;
  }
  const worktreePath = await helper.input(denops, {
    prompt: `Worktree path (for ${branchName}): `,
    text: join(root, `.worktrees/${branchName}`),
  });
  if (!worktreePath) {
    await helper.echoerr(denops, "Cancelled");
    return;
  }
  await denops.dispatch("gin", "command", "", [
    "worktree",
    "add",
    "--orphan",
    "-b",
    branchName,
    worktreePath,
  ]);
  // Change the current working directory to the new worktree
  await fn.chdir(denops, worktreePath);
}

async function findRoot(
  cwd: string,
): Promise<string> {
  try {
    const gitdir = await revParse(cwd, ["--git-common-dir"]);
    return dirname(gitdir);
  } catch {
    return "";
  }
}
