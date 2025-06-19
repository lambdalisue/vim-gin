import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import * as helper from "jsr:@denops/std@^7.0.0/helper";
import { define, GatherCandidates, Range } from "./core.ts";

export type Candidate = { target?: string };

export async function init(
  denops: Denops,
  bufnr: number,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  await batch.batch(denops, async (denops) => {
    await define(
      denops,
      bufnr,
      "new",
      (denops, bufnr, range) =>
        doNew(denops, bufnr, range, false, gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "new:force",
      (denops, bufnr, range) =>
        doNew(denops, bufnr, range, true, gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "new:orphan",
      (denops, bufnr, range) =>
        doNewOrphan(denops, bufnr, range, gatherCandidates),
    );
  });
}

async function doNew(
  denops: Denops,
  bufnr: number,
  range: Range,
  force: boolean,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  const x = xs.at(0);
  const from = x?.target ?? "HEAD";
  const name = await helper.input(denops, {
    prompt: `New branch (from ${from}): `,
    text: from,
  });
  await denops.cmd('redraw | echo ""');
  if (!name) {
    await helper.echoerr(denops, "Cancelled");
    return;
  }
  await denops.dispatch("gin", "command", "", [
    "switch",
    force ? "-C" : "-c",
    name,
    from,
  ]);
}

async function doNewOrphan(
  denops: Denops,
  _bufnr: number,
  _range: Range,
  _gatherCandidates: GatherCandidates<unknown>,
): Promise<void> {
  const name = await helper.input(denops, {
    prompt: "New branch (orphan): ",
  });
  await denops.cmd('redraw | echo ""');
  if (!name) {
    await helper.echoerr(denops, "Cancelled");
    return;
  }
  await denops.dispatch("gin", "command", "", ["switch", "--orphan", name]);
}
