import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import * as helper from "jsr:@denops/std@^7.0.0/helper";
import { define, GatherCandidates, Range } from "./core.ts";

export type Candidate = { branch: string; worktree?: string };

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
  if (x.worktree) {
    const from = x.worktree;
    const newPath = await helper.input(denops, {
      prompt: `New path (from ${from}): `,
      text: from,
    });
    await denops.cmd('redraw | echo ""');
    if (!newPath) {
      await helper.echoerr(denops, "Cancelled");
      return;
    }
    await denops.dispatch("gin", "command", "", [
      "worktree",
      "move",
      ...(force ? ["--force"] : []),
      from,
      newPath,
    ]);
  } else {
    const from = x.branch;
    const newName = await helper.input(denops, {
      prompt: `Rename (from ${from}): `,
      text: from,
    });
    await denops.cmd('redraw | echo ""');
    if (!newName) {
      await helper.echoerr(denops, "Cancelled");
      return;
    }
    await denops.dispatch("gin", "command", "", [
      "branch",
      ...(force ? ["--force"] : []),
      "--move",
      from,
      newName,
    ]);
  }
}
