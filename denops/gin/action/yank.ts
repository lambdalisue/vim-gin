import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import { define, GatherCandidates, Range } from "./core.ts";
import { yank } from "../util/yank.ts";

export type Candidate = { value: string };

export type Options = {
  prefix?: string;
  suffix?: string;
};

export async function init(
  denops: Denops,
  bufnr: number,
  gatherCandidates: GatherCandidates<Candidate>,
  options: Options = {},
): Promise<void> {
  const prefix = options.prefix ?? "";
  const suffix = options.suffix ?? "";
  await batch.batch(denops, async (denops) => {
    await define(
      denops,
      bufnr,
      `${prefix}yank${suffix}`,
      (denops, bufnr, range) =>
        doYank(
          denops,
          bufnr,
          range,
          gatherCandidates,
        ),
    );
  });
}

async function doYank(
  denops: Denops,
  bufnr: number,
  range: Range,
  gatherCandidates: GatherCandidates<Candidate>,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  const txt = xs.map((v) => v.value).join("\n");
  await yank(denops, txt);
}
