import * as path from "jsr:@std/path@^1.0.0";
import { findGitdir } from "./finder.ts";

export type RebaseState = {
  /** "merge" for rebase -i / rebase --merge, "apply" for rebase --apply */
  type: "merge" | "apply";
  /** Current step number (1-based) */
  current: number;
  /** Total number of steps */
  total: number;
  /** Original branch name (e.g. "main", not "refs/heads/main") */
  headName: string;
  /** Whether this is an interactive rebase */
  interactive: boolean;
};

/**
 * Get the current rebase state by inspecting .git/rebase-merge/ or .git/rebase-apply/.
 * Returns undefined if no rebase is in progress.
 */
export async function getRebaseState(
  worktree: string,
): Promise<RebaseState | undefined> {
  const gitdir = await findGitdir(worktree);

  // Check rebase-merge (interactive rebase, rebase --merge)
  const rebaseMergeDir = path.join(gitdir, "rebase-merge");
  if (await exists(rebaseMergeDir)) {
    return await readRebaseMergeState(rebaseMergeDir);
  }

  // Check rebase-apply (non-interactive rebase, git am)
  const rebaseApplyDir = path.join(gitdir, "rebase-apply");
  if (await exists(rebaseApplyDir)) {
    return await readRebaseApplyState(rebaseApplyDir);
  }

  return undefined;
}

/**
 * Check if a rebase is in progress by inspecting the git directory.
 */
export async function isRebaseInProgress(
  worktree: string,
): Promise<boolean> {
  const gitdir = await findGitdir(worktree);
  return await exists(path.join(gitdir, "rebase-merge")) ||
    await exists(path.join(gitdir, "rebase-apply"));
}

async function readRebaseMergeState(dir: string): Promise<RebaseState> {
  const [msgnum, end, headName, interactive] = await Promise.all([
    readFileAsNumber(path.join(dir, "msgnum")),
    readFileAsNumber(path.join(dir, "end")),
    readFileAsString(path.join(dir, "head-name")),
    exists(path.join(dir, "interactive")),
  ]);
  return {
    type: "merge",
    current: msgnum,
    total: end,
    headName: headName.replace(/^refs\/heads\//, ""),
    interactive,
  };
}

async function readRebaseApplyState(dir: string): Promise<RebaseState> {
  const [next, last, headName] = await Promise.all([
    readFileAsNumber(path.join(dir, "next")),
    readFileAsNumber(path.join(dir, "last")),
    readFileAsString(path.join(dir, "head-name")),
  ]);
  return {
    type: "apply",
    current: next,
    total: last,
    headName: headName.replace(/^refs\/heads\//, ""),
    interactive: false,
  };
}

async function exists(filepath: string): Promise<boolean> {
  try {
    await Deno.stat(filepath);
    return true;
  } catch {
    return false;
  }
}

async function readFileAsString(filepath: string): Promise<string> {
  try {
    return (await Deno.readTextFile(filepath)).trim();
  } catch {
    return "";
  }
}

async function readFileAsNumber(filepath: string): Promise<number> {
  const s = await readFileAsString(filepath);
  return Number(s) || 0;
}
