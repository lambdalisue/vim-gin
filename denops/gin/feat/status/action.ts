import type { Denops } from "https://deno.land/x/denops_std@v3.9.0/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v0.2.0/mod.ts";
import * as path from "https://deno.land/std@0.160.0/path/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v3.9.0/batch/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.9.0/buffer/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.9.0/function/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v3.9.0/helper/mod.ts";
import { findWorktreeFromDenops } from "../../util/worktree.ts";
import { define, Range } from "../../core/action/action.ts";
import { command as commandEdit } from "../edit/command.ts";
import { command as commandDiff } from "../diff/command.ts";
import { command as commandChaperon } from "../chaperon/command.ts";
import { command as commandPatch } from "../patch/command.ts";
import { command as commandBare } from "../../core/bare/command.ts";
import { Entry, parse as parseStatus } from "./parser.ts";

export async function init(denops: Denops, bufnr: number): Promise<void> {
  const openers = [
    "edit",
    "split",
    "vsplit",
    "tabedit",
  ];
  await batch.batch(denops, async (denops) => {
    await define(denops, bufnr, "echo", doEcho);
    for (const opener of openers) {
      await define(
        denops,
        bufnr,
        `edit:local:${opener}`,
        (denops, bufnr, range) => doEditLocal(denops, bufnr, range, opener),
      );
      await define(
        denops,
        bufnr,
        `edit:cached:${opener}`,
        (denops, bufnr, range) => doEdit(denops, bufnr, range, opener, [""]),
      );
      await define(
        denops,
        bufnr,
        `edit:HEAD:${opener}`,
        (denops, bufnr, range) =>
          doEdit(denops, bufnr, range, opener, ["HEAD"]),
      );
      await define(
        denops,
        bufnr,
        `diff:local:${opener}`,
        (denops, bufnr, range) => doDiff(denops, bufnr, range, opener, []),
      );
      await define(
        denops,
        bufnr,
        `diff:cached:${opener}`,
        (denops, bufnr, range) =>
          doDiff(denops, bufnr, range, opener, ["--cached"]),
      );
      await define(
        denops,
        bufnr,
        `diff:HEAD:${opener}`,
        (denops, bufnr, range) =>
          doDiff(denops, bufnr, range, opener, ["HEAD"]),
      );
      await define(
        denops,
        bufnr,
        `diff:smart:${opener}`,
        (denops, bufnr, range) => doDiffSmart(denops, bufnr, range, opener),
      );
    }
    await define(
      denops,
      bufnr,
      "chaperon:both",
      (denops, bufnr, range) => doChaperon(denops, bufnr, range, []),
    );
    await define(
      denops,
      bufnr,
      "chaperon:theirs",
      (denops, bufnr, range) => doChaperon(denops, bufnr, range, ["++no-ours"]),
    );
    await define(
      denops,
      bufnr,
      "chaperon:ours",
      (denops, bufnr, range) =>
        doChaperon(denops, bufnr, range, ["++no-theirs"]),
    );
    await define(
      denops,
      bufnr,
      "patch:both",
      (denops, bufnr, range) => doPatch(denops, bufnr, range, []),
    );
    await define(
      denops,
      bufnr,
      "patch:head",
      (denops, bufnr, range) =>
        doPatch(denops, bufnr, range, ["++no-worktree"]),
    );
    await define(
      denops,
      bufnr,
      "patch:worktree",
      (denops, bufnr, range) => doPatch(denops, bufnr, range, ["++no-head"]),
    );
    await define(
      denops,
      bufnr,
      "add",
      (denops, bufnr, range) => doAdd(denops, bufnr, range, []),
    );
    await define(
      denops,
      bufnr,
      "add:intent-to-add",
      (denops, bufnr, range) =>
        doAdd(denops, bufnr, range, ["--intent-to-add"]),
    );
    await define(
      denops,
      bufnr,
      "rm",
      (denops, bufnr, range) => doRm(denops, bufnr, range, []),
    );
    await define(
      denops,
      bufnr,
      "rm:force",
      (denops, bufnr, range) => doRm(denops, bufnr, range, ["--force"]),
    );
    await define(denops, bufnr, "reset", doReset);
    await define(
      denops,
      bufnr,
      "restore",
      (denops, bufnr, range) =>
        doRestore(denops, bufnr, range, ["--ignore-unmerged"]),
    );
    await define(
      denops,
      bufnr,
      "restore:staged",
      (denops, bufnr, range) =>
        doRestore(denops, bufnr, range, ["--ignore-unmerged", "--staged"]),
    );
    await define(
      denops,
      bufnr,
      "restore:ours",
      (denops, bufnr, range) =>
        doRestore(denops, bufnr, range, ["--ignore-unmerged", "--ours"]),
    );
    await define(
      denops,
      bufnr,
      "restore:theirs",
      (denops, bufnr, range) =>
        doRestore(denops, bufnr, range, ["--ignore-unmerged", "--theirs"]),
    );
    await define(
      denops,
      bufnr,
      "restore:conflict:merge",
      (denops, bufnr, range) =>
        doRestore(denops, bufnr, range, ["--conflict=merge"]),
    );
    await define(
      denops,
      bufnr,
      "restore:conflict:diff3",
      (denops, bufnr, range) =>
        doRestore(denops, bufnr, range, ["--conflict=diff3"]),
    );
    await define(denops, bufnr, "stage", doStage);
    await define(denops, bufnr, "stage:intent-to-add", doStageIntentToAdd);
    await define(denops, bufnr, "unstage", doReset);
    await define(denops, bufnr, "unstage", doUnstageIntentToAdd);
    await define(
      denops,
      bufnr,
      "stash",
      (denops, bufnr, range) => doStash(denops, bufnr, range, []),
    );
    await define(
      denops,
      bufnr,
      "stash:keep-index",
      (denops, bufnr, range) => doStash(denops, bufnr, range, ["--keep-index"]),
    );
  });
}

async function doEcho(
  denops: Denops,
  bufnr: number,
  range: Range,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  await helper.echo(denops, JSON.stringify(xs, null, 2));
}

async function doEditLocal(
  denops: Denops,
  bufnr: number,
  range: Range,
  opener: string,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  for (const x of xs) {
    await buffer.open(denops, x.path, {
      opener: opener,
    });
  }
}

async function doEdit(
  denops: Denops,
  bufnr: number,
  range: Range,
  opener: string,
  extraArgs: string[],
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  for (const x of xs) {
    await commandEdit(denops, "", [
      `++opener=${opener}`,
      ...extraArgs,
      x.path,
    ]);
  }
}

async function doDiff(
  denops: Denops,
  bufnr: number,
  range: Range,
  opener: string,
  extraArgs: string[],
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  for (const x of xs) {
    await commandDiff(denops, "", [
      `++opener=${opener}`,
      ...extraArgs,
      "--",
      x.path,
    ]);
  }
}

async function doDiffSmart(
  denops: Denops,
  bufnr: number,
  range: Range,
  opener: string,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  for (const x of xs) {
    if (x.XY.startsWith(".")) {
      await commandDiff(denops, "", [
        `++opener=${opener}`,
        "--",
        x.path,
      ]);
    } else {
      await commandDiff(denops, "", [
        `++opener=${opener}`,
        "--cached",
        "--",
        x.path,
      ]);
    }
  }
}

async function doChaperon(
  denops: Denops,
  bufnr: number,
  range: Range,
  extraArgs: string[],
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  for (const x of xs) {
    await commandChaperon(denops, "", [
      "++opener=tabedit",
      ...extraArgs,
      x.path,
    ]);
  }
}

async function doPatch(
  denops: Denops,
  bufnr: number,
  range: Range,
  extraArgs: string[],
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  for (const x of xs) {
    await commandPatch(denops, "", [
      "++opener=tabedit",
      ...extraArgs,
      x.path,
    ]);
  }
}

async function doAdd(
  denops: Denops,
  bufnr: number,
  range: Range,
  extraArgs: string[],
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  await commandBare(denops, [
    "add",
    "--ignore-errors",
    "--force",
    ...extraArgs,
    "--",
    ...xs.map((x) => x.path),
  ]);
}

async function doRm(
  denops: Denops,
  bufnr: number,
  range: Range,
  extraArgs: string[],
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  await commandBare(denops, [
    "rm",
    "--quiet",
    "--ignore-unmatch",
    "--cached",
    ...extraArgs,
    "--",
    ...xs.map((x) => x.path),
  ]);
}

async function doReset(
  denops: Denops,
  bufnr: number,
  range: Range,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  await commandBare(denops, [
    "reset",
    "--quiet",
    "--",
    ...xs.map((x) => x.path),
  ]);
}

async function doRestore(
  denops: Denops,
  bufnr: number,
  range: Range,
  extraArgs: string[],
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  await commandBare(denops, [
    "restore",
    "--quiet",
    ...extraArgs,
    "--",
    ...xs.map((x) => x.path),
  ]);
}

async function doStage(
  denops: Denops,
  bufnr: number,
  range: Range,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  const xsRemoved = xs.filter((x) => x.XY.endsWith("D"));
  const xsOthers = xs.filter((x) => !x.XY.endsWith(".") && !x.XY.endsWith("D"));
  if (xsRemoved.length) {
    await commandBare(denops, [
      "rm",
      "--quiet",
      "--ignore-unmatch",
      "--cached",
      "--",
      ...xsRemoved.map((x) => x.path),
    ]);
  }
  if (xsOthers.length) {
    await commandBare(denops, [
      "add",
      "--ignore-errors",
      "--force",
      "--",
      ...xsOthers.map((x) => x.path),
    ]);
  }
}

async function doStageIntentToAdd(
  denops: Denops,
  bufnr: number,
  range: Range,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  const xsUnknown = xs.filter((x) => x.XY === "??");
  const xsRemoved = xs.filter((x) => x.XY.endsWith("D"));
  const xsOthers = xs.filter((x) => x.XY !== "??" && !x.XY.endsWith("D"));
  if (xsUnknown.length) {
    await commandBare(denops, [
      "add",
      "--ignore-errors",
      "--force",
      "--intent-to-add",
      "--",
      ...xsUnknown.map((x) => x.path),
    ]);
  }
  if (xsRemoved.length) {
    await commandBare(denops, [
      "rm",
      "--quiet",
      "--ignore-unmatch",
      "--cached",
      "--",
      ...xsRemoved.map((x) => x.path),
    ]);
  }
  if (xsOthers.length) {
    await commandBare(denops, [
      "add",
      "--ignore-errors",
      "--force",
      "--",
      ...xsOthers.map((x) => x.path),
    ]);
  }
}

async function doUnstageIntentToAdd(
  denops: Denops,
  bufnr: number,
  range: Range,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  const xsAdded = xs.filter((x) => x.XY === "A.");
  const xsOthers = xs.filter((x) => x.XY !== "A.");
  if (xsAdded.length) {
    await commandBare(denops, [
      "reset",
      "--quiet",
      "--",
      ...xsAdded.map((x) => x.path),
    ]);
    await commandBare(denops, [
      "add",
      "--ignore-errors",
      "--force",
      "--intent-to-add",
      "--",
      ...xsAdded.map((x) => x.path),
    ]);
  }
  if (xsOthers.length) {
    await commandBare(denops, [
      "reset",
      "--quiet",
      "--",
      ...xsOthers.map((x) => x.path),
    ]);
  }
}

async function doStash(
  denops: Denops,
  bufnr: number,
  range: Range,
  extraArgs: string[],
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  await commandBare(denops, [
    "stash",
    "push",
    "--all",
    ...extraArgs,
    "--",
    ...xs.map((x) => x.path),
  ]);
}

async function gatherCandidates(
  denops: Denops,
  bufnr: number,
  [start, end]: Range,
): Promise<Entry[]> {
  const worktree = await findWorktreeFromDenops(denops);
  const content = await fn.getbufline(
    denops,
    bufnr,
    Math.max(start, 1),
    Math.max(end, 1),
  );
  const result = parseStatus(content);
  return result.entries.map((ent) => ({
    ...ent,
    path: path.join(worktree, ent.path),
    origPath: unnullish(ent.origPath, (v) => path.join(worktree, v)),
  }));
}
