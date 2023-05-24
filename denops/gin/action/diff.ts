import type { Denops } from "https://deno.land/x/denops_std@v5.0.0/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v5.0.0/batch/mod.ts";
import { alias, define, GatherCandidates, Range } from "./core.ts";
import {
  exec as execDiff,
  ExecOptions as ExecDiffOptions,
} from "../command/diff/command.ts";

export type Candidate = { path: string };

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
        `diff:local:${opener}`,
        (denops, bufnr, range) =>
          doDiff(denops, bufnr, range, opener, {}, gatherCandidates),
      );
      await define(
        denops,
        bufnr,
        `diff:cached:${opener}`,
        (denops, bufnr, range) =>
          doDiff(
            denops,
            bufnr,
            range,
            opener,
            { flags: { "cached": "" } },
            gatherCandidates,
          ),
      );
      await define(
        denops,
        bufnr,
        `diff:HEAD:${opener}`,
        (denops, bufnr, range) =>
          doDiff(
            denops,
            bufnr,
            range,
            opener,
            { commitish: "HEAD" },
            gatherCandidates,
          ),
      );
    }
    await alias(
      denops,
      bufnr,
      "diff:local",
      "diff:local:edit",
    );
    await alias(
      denops,
      bufnr,
      "diff:cached",
      "diff:cached:edit",
    );
    await alias(
      denops,
      bufnr,
      "diff:HEAD",
      "diff:HEAD:edit",
    );
    await alias(
      denops,
      bufnr,
      "diff",
      "diff:local",
    );
  });
}

async function doDiff(
  denops: Denops,
  bufnr: number,
  range: Range,
  opener: string,
  options: ExecDiffOptions,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  for (const x of xs) {
    await execDiff(denops, {
      opener,
      paths: [x.path],
      ...options,
    });
  }
}
