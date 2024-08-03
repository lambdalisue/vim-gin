import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import { alias, define, GatherCandidates, Range } from "./core.ts";

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
      "chaperon:both",
      (denops, bufnr, range) =>
        doChaperon(denops, bufnr, range, [], gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "chaperon:theirs",
      (denops, bufnr, range) =>
        doChaperon(denops, bufnr, range, ["++no-ours"], gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "chaperon:ours",
      (denops, bufnr, range) =>
        doChaperon(denops, bufnr, range, ["++no-theirs"], gatherCandidates),
    );
    await alias(
      denops,
      bufnr,
      "chaperon",
      "chaperon:both",
    );
  });
}

async function doChaperon(
  denops: Denops,
  bufnr: number,
  range: Range,
  extraArgs: string[],
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  for (const x of xs) {
    await denops.dispatch("gin", "chaperon:command", "", "", [
      "++opener=tabedit",
      ...extraArgs,
      x.path,
    ]);
  }
}
