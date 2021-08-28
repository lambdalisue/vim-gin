import { batch, Denops, fn, mapping } from "../deps.ts";
import * as action from "../core/action.ts";
import * as buffer from "../core/buffer.ts";
import { command as nativeCommand } from "../feature/native/command.ts";
import type { Aggregator } from "./types.ts";

type Item = {
  path: string;
  XY: string;
};

export async function initActions(
  denops: Denops,
  aggregator: Aggregator<Item>,
): Promise<void> {
  await batch.batch(denops, async (denops) => {
    await action.register(denops, {
      add: (denops, range) => actionAdd(denops, range, aggregator, {}),
      "add:force": (denops, range) =>
        actionAdd(denops, range, aggregator, { force: true }),
      "add:intent-to-add": (denops, range) =>
        actionAdd(denops, range, aggregator, { intentToAdd: true }),
      rm: (denops, range) => actionRm(denops, range, aggregator, {}),
      "rm:force": (denops, range) =>
        actionRm(denops, range, aggregator, { force: true }),
      "rm:cached": (denops, range) =>
        actionRm(denops, range, aggregator, { cached: true }),
      reset: (denops, range) => actionReset(denops, range, aggregator, {}),
      stage: (denops, range) => actionStage(denops, range, aggregator, {}),
      "stage:force": (denops, range) =>
        actionStage(denops, range, aggregator, { force: true }),
      restore: (denops, range) => actionRestore(denops, range, aggregator, {}),
      "restore:staged": (denops, range) =>
        actionRestore(denops, range, aggregator, { staged: true }),
      "restore:ours": (denops, range) =>
        actionRestore(denops, range, aggregator, { ours: true }),
      "restore:theirs": (denops, range) =>
        actionRestore(denops, range, aggregator, { theirs: true }),
    });
    await mapping.map(
      denops,
      "<Plug>(gin-action-unstage)",
      "<Plug>(gin-action-reset)",
      {
        mode: ["n", "x"],
      },
    );
  });
}

async function actionAdd(
  denops: Denops,
  range: action.Range,
  aggregator: Aggregator<{ path: string }>,
  options: {
    force?: boolean;
    intentToAdd?: boolean;
    noEdit?: boolean;
  },
): Promise<void> {
  const vs = await aggregator(denops, range);
  const ps = vs.map((c) => c.path);
  if (!ps.length) {
    return;
  }
  const args = [
    "add",
    "--ignore-errors",
    ...(options.force ? ["--force"] : []),
    ...(options.intentToAdd ? ["--intent-to-add"] : []),
    ...ps,
  ];
  await nativeCommand(denops, ...args);
  if (!options.noEdit) {
    await buffer.reload(denops, await fn.bufnr(denops, "%"));
  }
}

async function actionRm(
  denops: Denops,
  range: action.Range,
  aggregator: Aggregator<{ path: string }>,
  options: {
    force?: boolean;
    cached?: boolean;
    noEdit?: boolean;
  },
): Promise<void> {
  const vs = await aggregator(denops, range);
  const ps = vs.map((c) => c.path);
  if (!ps.length) {
    return;
  }
  const args = [
    "rm",
    "--quiet",
    "--ignore-unmatch",
    ...(options.force ? ["--force"] : []),
    ...(options.cached ? ["--cached"] : []),
    ...ps,
  ];
  await nativeCommand(denops, ...args);
  if (!options.noEdit) {
    await buffer.reload(denops, await fn.bufnr(denops, "%"));
  }
}

async function actionReset(
  denops: Denops,
  range: action.Range,
  aggregator: Aggregator<{ path: string }>,
  options: {
    noEdit?: boolean;
  },
): Promise<void> {
  const vs = await aggregator(denops, range);
  const ps = vs.map((c) => c.path);
  if (!ps.length) {
    return;
  }
  const args = [
    "reset",
    "--quiet",
    "--",
    ...ps,
  ];
  await nativeCommand(denops, ...args);
  if (!options.noEdit) {
    await buffer.reload(denops, await fn.bufnr(denops, "%"));
  }
}

async function actionStage(
  denops: Denops,
  range: action.Range,
  aggregator: Aggregator<{ path: string; XY: string }>,
  options: {
    force?: boolean;
    noEdit?: boolean;
  },
): Promise<void> {
  const vs = await aggregator(denops, range);
  const addVs = vs.filter((v) => !v.XY.endsWith(" "));
  const rmVs = vs.filter((v) => v.XY.endsWith("D"));
  await Promise.all([
    actionAdd(denops, range, () => Promise.resolve(addVs), {
      force: options.force,
      noEdit: true,
    }),
    actionRm(denops, range, () => Promise.resolve(rmVs), {
      force: options.force,
      noEdit: true,
    }),
  ]);
  if (!options.noEdit) {
    await buffer.reload(denops, await fn.bufnr(denops, "%"));
  }
}

async function actionRestore(
  denops: Denops,
  range: action.Range,
  aggregator: Aggregator<{ path: string; XY: string }>,
  options: {
    staged?: boolean;
    ours?: boolean;
    theirs?: boolean;
    noEdit?: boolean;
  },
): Promise<void> {
  const vs = await aggregator(denops, range);
  const ps = vs.map((c) => c.path);
  if (!ps.length) {
    return;
  }
  const args = [
    "restore",
    "--ignore_unmerged",
    "--quiet",
    ...(options.staged ? ["--staged"] : []),
    ...(options.ours ? ["--ours"] : []),
    ...(options.theirs ? ["--theirs"] : []),
    ...ps,
  ];
  await nativeCommand(denops, ...args);
  if (!options.noEdit) {
    await buffer.reload(denops, await fn.bufnr(denops, "%"));
  }
}
