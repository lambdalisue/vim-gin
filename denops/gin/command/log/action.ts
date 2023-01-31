import type { Denops } from "https://deno.land/x/denops_std@v4.0.0/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v1.0.0/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v4.0.0/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v4.0.0/function/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v4.0.0/variable/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v4.0.0/helper/mod.ts";
import { define, Range } from "../../core/action/action.ts";
import { command as commandBuffer } from "../../command/buffer/command.ts";
import { Entry, parse as parseLog } from "./parser.ts";

export async function init(denops: Denops, bufnr: number): Promise<void> {
  const openers = [
    "edit",
    "split",
    "vsplit",
    "tabedit",
  ];
  await batch.batch(denops, async (denops) => {
    await define(denops, bufnr, "echo", doEcho);
    for (const opener of openers) {
      await define(
        denops,
        bufnr,
        `show:${opener}`,
        (denops, bufnr, range) => doShow(denops, bufnr, range, opener, []),
      );
    }
  });
}

async function doEcho(
  denops: Denops,
  bufnr: number,
  range: Range,
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  await helper.echo(denops, JSON.stringify(xs, null, 2));
}

async function doShow(
  denops: Denops,
  bufnr: number,
  range: Range,
  opener: string,
  extraArgs: string[],
): Promise<void> {
  const xs = await gatherCandidates(denops, bufnr, range);
  for (const x of xs) {
    await commandBuffer(denops, "", [
      `++opener=${opener}`,
      "show",
      ...extraArgs,
      x.commit,
    ]);
  }
}

async function gatherCandidates(
  denops: Denops,
  bufnr: number,
  [start, end]: Range,
): Promise<Entry[]> {
  const [content, patternStr] = await batch.gather(denops, async (denops) => {
    await fn.getbufline(
      denops,
      bufnr,
      Math.max(start, 1),
      Math.max(end, 1),
    );
    await vars.g.get(denops, "gin_log_parse_pattern");
  }) as [string[], string | undefined];
  const pattern = unnullish(patternStr, (v) => new RegExp(v));
  const result = parseLog(content, pattern);
  return result.entries;
}
