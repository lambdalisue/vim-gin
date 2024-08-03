import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import { alias, define, GatherCandidates, Range } from "./core.ts";

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
      "merge:ff",
      (denops, bufnr, range) =>
        doMerge(denops, bufnr, range, "ff", gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "merge:no-ff",
      (denops, bufnr, range) =>
        doMerge(denops, bufnr, range, "no-ff", gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "merge:ff-only",
      (denops, bufnr, range) =>
        doMerge(denops, bufnr, range, "ff-only", gatherCandidates),
    );
    await alias(
      denops,
      bufnr,
      "merge",
      "merge:ff",
    );
  });
}

async function doMerge(
  denops: Denops,
  bufnr: number,
  range: Range,
  method: "ff" | "no-ff" | "ff-only",
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  const x = xs.at(0);
  if (!x) {
    return;
  }
  await denops.dispatch("gin", "command", "", [
    "merge",
    `--${method}`,
    x.commit,
  ]);
}
