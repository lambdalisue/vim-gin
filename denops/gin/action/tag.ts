import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import * as helper from "jsr:@denops/std@^7.0.0/helper";
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
      "tag:lightweight",
      (denops, bufnr, range) =>
        doTag(denops, bufnr, range, false, gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "tag:annotate",
      (denops, bufnr, range) =>
        doTagInteractive(
          denops,
          bufnr,
          range,
          true,
          false,
          false,
          gatherCandidates,
        ),
    );
    await define(
      denops,
      bufnr,
      "tag:sign",
      (denops, bufnr, range) =>
        doTagInteractive(
          denops,
          bufnr,
          range,
          false,
          true,
          false,
          gatherCandidates,
        ),
    );
    await define(
      denops,
      bufnr,
      "tag:lightweight:force",
      (denops, bufnr, range) =>
        doTag(denops, bufnr, range, true, gatherCandidates),
    );
    await define(
      denops,
      bufnr,
      "tag:annotate:force",
      (denops, bufnr, range) =>
        doTagInteractive(
          denops,
          bufnr,
          range,
          true,
          false,
          true,
          gatherCandidates,
        ),
    );
    await define(
      denops,
      bufnr,
      "tag:sign:force",
      (denops, bufnr, range) =>
        doTagInteractive(
          denops,
          bufnr,
          range,
          false,
          true,
          true,
          gatherCandidates,
        ),
    );
    await alias(
      denops,
      bufnr,
      "tag",
      "tag:annotate",
    );
  });
}

async function doTag(
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
  const name = await helper.input(denops, {
    prompt: `Name: `,
  });
  if (!name) {
    await helper.echo(denops, "Cancelled");
    return;
  }
  await denops.dispatch("gin", "command", "", [
    "tag",
    ...(force ? ["--force"] : []),
    name,
    x.commit,
  ]);
}

async function doTagInteractive(
  denops: Denops,
  bufnr: number,
  range: Range,
  annotate: boolean,
  sign: boolean,
  force: boolean,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  const x = xs.at(0);
  if (!x) {
    return;
  }
  const name = await helper.input(denops, {
    prompt: `Name: `,
  });
  if (!name) {
    await helper.echo(denops, "Cancelled");
    return;
  }
  // NOTE:
  // We must NOT await the command otherwise Vim would freeze
  // because command proxy could not work if we await here.
  denops.dispatch("gin", "command", "", [
    "tag",
    ...(annotate ? ["--annotate"] : []),
    ...(sign ? ["--sign"] : []),
    ...(force ? ["--force"] : []),
    name,
    x.commit,
  ]).catch(async (e) => {
    await helper.echoerr(denops, e.toString());
  }).then(
    // suppress false-positive detection of file changes
    // NOTE: must be done on resolve because the tag is not awaited
    () => denops.cmd("silent checktime"),
  );
}
