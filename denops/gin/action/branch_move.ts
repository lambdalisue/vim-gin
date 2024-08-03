import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import * as helper from "jsr:@denops/std@^7.0.0/helper";
import { define, GatherCandidates, Range } from "./core.ts";

export type Candidate = { branch: string };

export async function init(
  denops: Denops,
  bufnr: number,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  await batch.batch(denops, async (denops) => {
    await define(
      denops,
      bufnr,
      "move",
      (denops, bufnr, range) =>
        doMove(denops, bufnr, range, false, gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "move:force",
      (denops, bufnr, range) =>
        doMove(denops, bufnr, range, true, gatherCandidates),
    );
  });
}

async function doMove(
  denops: Denops,
  bufnr: number,
  range: Range,
  force: boolean,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  const x = xs.at(0);
  if (!x) {
    return;
  }
  const from = x.branch;
  const name = await helper.input(denops, {
    prompt: `Rename (from ${from}): `,
    text: from,
  });
  await denops.cmd('redraw | echo ""');
  if (!name) {
    await helper.echoerr(denops, "Cancelled");
    return;
  }
  await denops.dispatch("gin", "command", "", [
    "branch",
    ...(force ? ["--force"] : []),
    "--move",
    from,
    name,
  ]);
}
