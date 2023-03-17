import type { Denops } from "https://deno.land/x/denops_std@v4.1.0/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v4.1.0/batch/mod.ts";
import { alias, define, GatherCandidates, Range } from "./core.ts";
import { command as commandDiff } from "../command/diff/command.ts";

export type Candidate = { path: string; XY: string };

export async function init(
  denops: Denops,
  bufnr: number,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  await batch.batch(denops, async (denops) => {
    const openers = [
      "edit",
      "split",
      "vsplit",
      "tabedit",
    ];
    for (const opener of openers) {
      await define(
        denops,
        bufnr,
        `diff:smart:${opener}`,
        (denops, bufnr, range) =>
          doDiffSmart(denops, bufnr, range, opener, gatherCandidates),
      );
    }
    await alias(
      denops,
      bufnr,
      "diff:smart",
      "diff:smart:edit",
    );
    await alias(
      denops,
      bufnr,
      "diff",
      "diff:smart",
    );
  });
}

async function doDiffSmart(
  denops: Denops,
  bufnr: number,
  range: Range,
  opener: string,
  gatherCandidates: GatherCandidates<Candidate>,
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
