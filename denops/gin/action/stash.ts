import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import { define, GatherCandidates, Range } from "./core.ts";

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
      "stash",
      (denops, bufnr, range) =>
        doStash(denops, bufnr, range, [], gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "stash:keep-index",
      (denops, bufnr, range) =>
        doStash(denops, bufnr, range, ["--keep-index"], gatherCandidates),
    );
  });
}

async function doStash(
  denops: Denops,
  bufnr: number,
  range: Range,
  extraArgs: string[],
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  await denops.dispatch("gin", "command", "", [
    "stash",
    "push",
    "--all",
    ...extraArgs,
    "--",
    ...xs.map((x) => x.path),
  ]);
}
