import type { Denops } from "https://deno.land/x/denops_std@v4.1.0/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v4.1.0/batch/mod.ts";
import { alias, define, GatherCandidates, Range } from "./core.ts";
import {
  exec as execChaperon,
  ExecOptions as ExecChaperonOptions,
} from "../command/chaperon/command.ts";

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
        doChaperon(denops, bufnr, range, {}, gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "chaperon:theirs",
      (denops, bufnr, range) =>
        doChaperon(denops, bufnr, range, { noOurs: true }, gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "chaperon:ours",
      (denops, bufnr, range) =>
        doChaperon(denops, bufnr, range, { noTheirs: true }, gatherCandidates),
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
  options: ExecChaperonOptions,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  for (const x of xs) {
    await execChaperon(denops, x.path, {
      opener: "tabedit",
      ...options,
    });
  }
}
