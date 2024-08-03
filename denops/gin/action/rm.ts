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
      "rm",
      (denops, bufnr, range) =>
        doRm(denops, bufnr, range, [], gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "rm:force",
      (denops, bufnr, range) =>
        doRm(denops, bufnr, range, ["--force"], gatherCandidates),
    );
  });
}

async function doRm(
  denops: Denops,
  bufnr: number,
  range: Range,
  extraArgs: string[],
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  await denops.dispatch("gin", "command", "", [
    "rm",
    "--quiet",
    "--ignore-unmatch",
    "--cached",
    ...extraArgs,
    "--",
    ...xs.map((x) => x.path),
  ]);
}
