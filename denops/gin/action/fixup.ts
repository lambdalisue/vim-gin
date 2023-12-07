import type { Denops } from "https://deno.land/x/denops_std@v5.0.1/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v5.0.1/batch/mod.ts";
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
      "fixup:fixup",
      (denops, bufnr, range) => doFixup(denops, bufnr, range, gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "fixup:amend",
      (denops, bufnr, range) =>
        doFixupInteractive(denops, bufnr, range, "amend", gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "fixup:reword",
      (denops, bufnr, range) =>
        doFixupInteractive(denops, bufnr, range, "reword", gatherCandidates),
    );
    await alias(
      denops,
      bufnr,
      "fixup",
      "fixup:fixup",
    );
  });
}

async function doFixup(
  denops: Denops,
  bufnr: number,
  range: Range,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  const commit = xs.map((v) => v.commit).join("\n");
  await denops.dispatch("gin", "command", "", [
    "commit",
    `--fixup=${commit}`,
  ]);
}

async function doFixupInteractive(
  denops: Denops,
  bufnr: number,
  range: Range,
  kind: "amend" | "reword",
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  const commit = xs.map((v) => v.commit).join("\n");
  // Do not block Vim so that users can edit commit message
  denops
    .dispatch("gin", "command", "", ["commit", `--fixup=${kind}:${commit}`])
    .catch((e) => console.error(`failed to execute git commit: ${e}`));
}
