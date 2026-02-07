import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import * as helper from "jsr:@denops/std@^7.0.0/helper";
import * as path from "jsr:@std/path@^1.0.0";
import { alias, define, GatherCandidates, Range } from "./core.ts";
import { execute } from "../git/process.ts";
import { findWorktreeFromDenops } from "../git/worktree.ts";
import { findGitdir } from "../git/finder.ts";
import { isRebaseInProgress } from "../git/rebase.ts";
import { decodeUtf8 } from "../util/text.ts";

const BACKUP_FILENAME = "GIN_SPLIT_ORIGINAL_TEMPLATE";
const SPLIT_MSG_FILENAME = "GIN_SPLIT_MSG";

export type Candidate = { commit: string };

/**
 * Clean up leftover commit.template override from a previous commit:split.
 * Safe to call at any time - no-op if no cleanup is needed.
 */
export async function tryCleanupSplitTemplate(
  worktree: string,
): Promise<void> {
  const gitdir = await findGitdir(worktree);
  const backupPath = path.join(gitdir, BACKUP_FILENAME);

  // Check if backup marker file exists
  try {
    await Deno.stat(backupPath);
  } catch {
    return;
  }

  // Only clean up when rebase is no longer in progress
  if (await isRebaseInProgress(worktree)) {
    return;
  }

  // Restore original commit.template
  try {
    const backup = (await Deno.readTextFile(backupPath)).trim();
    if (backup) {
      await execute(
        ["config", "--local", "commit.template", backup],
        { cwd: worktree },
      );
    } else {
      try {
        await execute(
          ["config", "--local", "--unset", "commit.template"],
          { cwd: worktree },
        );
      } catch {
        // Already unset, ignore
      }
    }
  } catch {
    try {
      await execute(
        ["config", "--local", "--unset", "commit.template"],
        { cwd: worktree },
      );
    } catch {
      // Already unset, ignore
    }
  }

  // Remove temporary files
  const splitMsgPath = path.join(gitdir, SPLIT_MSG_FILENAME);
  await Deno.remove(backupPath).catch(() => {});
  await Deno.remove(splitMsgPath).catch(() => {});
}

export async function init(
  denops: Denops,
  bufnr: number,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const openers = ["edit", "split", "vsplit", "tabedit"];
  await batch.batch(denops, async (denops) => {
    for (const opener of openers) {
      await define(
        denops,
        bufnr,
        `commit:split:${opener}`,
        (denops, bufnr, range) =>
          doCommitSplit(denops, bufnr, range, opener, gatherCandidates),
      );
    }
    await alias(denops, bufnr, "commit:split", "commit:split:edit");
  });
}

async function doCommitSplit(
  denops: Denops,
  bufnr: number,
  range: Range,
  opener: string,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  const x = xs.at(0);
  if (!x) return;
  const commit = x.commit;

  const worktree = await findWorktreeFromDenops(denops);
  const gitdir = await findGitdir(worktree);

  // Clean up any leftover state from a previous split
  await tryCleanupSplitTemplate(worktree);

  // Guard: check if rebase is already in progress
  if (await isRebaseInProgress(worktree)) {
    await helper.echoerr(
      denops,
      "A rebase is already in progress. Complete or abort it first.",
    );
    return;
  }

  // Get original commit message and comment each line for reference
  const origMsgRaw = decodeUtf8(
    await execute(["log", "-1", "--format=%B", commit], { cwd: worktree }),
  ).trimEnd();
  const commentedOrigMsg = origMsgRaw
    .split("\n")
    .map((line) => `# ${line}`)
    .join("\n");

  // Build composite template: empty first line + user template + commented original message
  const userTemplate = await getUserCommitTemplate(worktree);
  const splitMsgContent = [
    "",
    ...(userTemplate ? [userTemplate.trimEnd(), ""] : []),
    "# --- Original commit message (for reference) ---",
    commentedOrigMsg,
    "",
  ].join("\n");
  const splitMsgPath = path.join(gitdir, SPLIT_MSG_FILENAME);
  await Deno.writeTextFile(splitMsgPath, splitMsgContent);

  // Backup existing local commit.template before overriding
  const origLocalTemplate = await getLocalCommitTemplate(worktree);
  const backupPath = path.join(gitdir, BACKUP_FILENAME);
  await Deno.writeTextFile(backupPath, origLocalTemplate ?? "");

  // Set our split template as the local commit.template
  await execute(
    ["config", "--local", "commit.template", splitMsgPath],
    { cwd: worktree },
  );

  // Run rebase with sequence editor that marks the target commit as "edit"
  const seqEditorScript = path.fromFileUrl(
    new URL("../proxy/sequence_editor.ts", import.meta.url),
  );
  const env = await fn.environ(denops) as Record<string, string>;
  try {
    await execute(
      [
        "-c",
        `sequence.editor=${seqEditorScript}`,
        "rebase",
        "--interactive",
        "--autostash",
        "--keep-empty",
        `${commit}^`,
      ],
      {
        cwd: worktree,
        env: { ...env, GIN_SPLIT_TARGET: commit },
      },
    );
  } catch (e) {
    // Rebase failed, restore commit.template immediately
    await tryCleanupSplitTemplate(worktree);
    await helper.echoerr(denops, `Rebase failed: ${e}`);
    return;
  }

  // Decompose the commit: reset HEAD~ keeps changes in working tree
  await execute(["reset", "HEAD~"], { cwd: worktree, env });

  // Suppress false-positive detection of file changes
  await denops.cmd("silent checktime");

  // Open GinStatus for the user to stage and commit
  await denops.dispatch("gin", "status:command", "", "", [
    `++opener=${opener}`,
  ]);
}

/**
 * Get the effective commit.template content (from any config level).
 */
async function getUserCommitTemplate(
  worktree: string,
): Promise<string | undefined> {
  let templatePath: string;
  try {
    templatePath = decodeUtf8(
      await execute(["config", "--get", "commit.template"], { cwd: worktree }),
    ).trim();
  } catch {
    return undefined;
  }
  if (!templatePath) return undefined;

  // Resolve ~ and relative paths
  const resolvedPath = templatePath.startsWith("~")
    ? path.join(Deno.env.get("HOME") ?? "", templatePath.slice(1))
    : path.isAbsolute(templatePath)
    ? templatePath
    : path.join(worktree, templatePath);

  try {
    return await Deno.readTextFile(resolvedPath);
  } catch {
    return undefined;
  }
}

/**
 * Get the local (repo-level) commit.template value.
 */
async function getLocalCommitTemplate(
  worktree: string,
): Promise<string | undefined> {
  try {
    const value = decodeUtf8(
      await execute(
        ["config", "--local", "--get", "commit.template"],
        { cwd: worktree },
      ),
    ).trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}
