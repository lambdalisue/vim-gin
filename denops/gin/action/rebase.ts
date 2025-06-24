import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import * as helper from "jsr:@denops/std@^7.0.0/helper";
import { define, GatherCandidates, Range } from "./core.ts";

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
      "rebase",
      (denops, bufnr, range) =>
        doRebase(denops, bufnr, range, gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "rebase:x",
      (denops, bufnr, range) =>
        doRebase(denops, bufnr, range, gatherCandidates, true),
    );
    await define(
      denops,
      bufnr,
      "rebase:i",
      (denops, bufnr, range) =>
        doRebaseInteractive(denops, bufnr, range, gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "rebase:i:x",
      (denops, bufnr, range) =>
        doRebaseInteractive(denops, bufnr, range, gatherCandidates, true),
    );
    await define(
      denops,
      bufnr,
      "rebase:instant-drop",
      (denops, bufnr, range) =>
        doRebaseInstantDrop(denops, bufnr, range, gatherCandidates),
    );
  });
}

async function doRebase(
  denops: Denops,
  bufnr: number,
  range: Range,
  gatherCandidates: GatherCandidates<Candidate>,
  execute?: boolean,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  const x = xs.at(0);
  if (!x) {
    return;
  }
  const args = ["rebase", x.commit];
  if (execute) {
    const cmd = await helper.input(denops, {
      prompt: "Execute command after rebase: ",
    }) ?? "";
    await denops.cmd('redraw | echo ""');
    if (!cmd) {
      await helper.echoerr(denops, "Cancelled");
      return;
    }
    args.push("-x", cmd);
  }
  await denops.dispatch("gin", "command", "", args);

  // suppress false-positive detection of file changes
  await denops.cmd("silent checktime");
}

async function doRebaseInteractive(
  denops: Denops,
  bufnr: number,
  range: Range,
  gatherCandidates: GatherCandidates<Candidate>,
  execute?: boolean,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  const x = xs.at(0);
  if (!x) {
    return;
  }
  const args = [
    "rebase",
    "--interactive",
    x.commit,
  ];
  if (execute) {
    const cmd = await helper.input(denops, {
      prompt: "Execute command after rebase: ",
    }) ?? "";
    await denops.cmd('redraw | echo ""');
    if (!cmd) {
      await helper.echoerr(denops, "Cancelled");
      return;
    }
    args.push("-x", cmd);
  }
  // NOTE:
  // We must NOT await the command otherwise Vim would freeze
  // because command proxy could not work if we await here.
  denops.dispatch("gin", "command", "", args).catch(async (e) => {
    await helper.echoerr(denops, e.toString());
  }).then(
    // suppress false-positive detection of file changes
    // NOTE: must be done on resolve because the rebase is not awaited
    () => denops.cmd("silent checktime"),
  );
}

async function doRebaseInstantDrop(
  denops: Denops,
  bufnr: number,
  range: Range,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  const x = xs.at(0);
  if (!x) {
    return;
  }
  await denops.dispatch("gin", "command", "", [
    "rebase",
    "--onto",
    `${x.commit}~`,
    x.commit,
    "HEAD",
  ]);

  // suppress false-positive detection of file changes
  await denops.cmd("silent checktime");
}
