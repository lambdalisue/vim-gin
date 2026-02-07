import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import { define, GatherCandidates, Range } from "./core.ts";

export type Candidate = { commit: string };

export async function init(
  denops: Denops,
  bufnr: number,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  await batch.batch(denops, async (denops) => {
    await define(
      denops,
      bufnr,
      "pop",
      (denops, bufnr, range) =>
        doStashPop(denops, bufnr, range, [], gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "pop:index",
      (denops, bufnr, range) =>
        doStashPop(denops, bufnr, range, ["--index"], gatherCandidates),
    );
  });
}

async function doStashPop(
  denops: Denops,
  bufnr: number,
  range: Range,
  extraArgs: string[],
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  // Process only the first candidate since stash pop takes a single ref
  const xs = await gatherCandidates(denops, bufnr, range);
  const x = xs.at(0);
  if (!x) {
    return;
  }
  await denops.dispatch("gin", "command", "", [
    "stash",
    "pop",
    ...extraArgs,
    x.commit,
  ]);
}
