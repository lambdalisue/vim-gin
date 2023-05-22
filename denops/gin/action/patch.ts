import type { Denops } from "https://deno.land/x/denops_std@v5.0.0/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v5.0.0/batch/mod.ts";
import { alias, define, GatherCandidates, Range } from "./core.ts";
import {
  exec as execPatch,
  ExecOptions as ExecPatchOptions,
} from "../command/patch/command.ts";

export type Candidate = { path: string };

export async function init(
  denops: Denops,
  bufnr: number,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  await batch.batch(denops, async (denops) => {
    await define(
      denops,
      bufnr,
      "patch:both",
      (denops, bufnr, range) =>
        doPatch(denops, bufnr, range, {}, gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "patch:head",
      (denops, bufnr, range) =>
        doPatch(denops, bufnr, range, { noWorktree: true }, gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "patch:worktree",
      (denops, bufnr, range) =>
        doPatch(denops, bufnr, range, { noHead: true }, gatherCandidates),
    );
    await alias(
      denops,
      bufnr,
      "patch",
      "patch:both",
    );
  });
}

async function doPatch(
  denops: Denops,
  bufnr: number,
  range: Range,
  options: ExecPatchOptions,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  for (const x of xs) {
    await execPatch(denops, x.path, {
      opener: "tabedit",
      ...options,
    });
  }
}
