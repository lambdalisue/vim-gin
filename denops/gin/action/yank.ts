import type { Denops } from "https://deno.land/x/denops_std@v5.0.0/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v5.0.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v5.0.0/function/mod.ts";
import { v } from "https://deno.land/x/denops_std@v5.0.0/variable/mod.ts";
import { define, GatherCandidates, Range } from "./core.ts";

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
  const reg = await v.get(denops, "register");
  await fn.setreg(denops, reg, txt);
}
