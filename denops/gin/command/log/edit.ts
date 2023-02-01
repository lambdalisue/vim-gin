import type { Denops } from "https://deno.land/x/denops_std@v4.0.0/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v1.0.0/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v4.0.0/function/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v4.0.0/batch/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v4.0.0/buffer/mod.ts";
import * as option from "https://deno.land/x/denops_std@v4.0.0/option/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v4.0.0/variable/mod.ts";
import { parse as parseBufname } from "https://deno.land/x/denops_std@v4.0.0/bufname/mod.ts";
import {
  Flags,
  formatFlags,
  parseOpts,
} from "https://deno.land/x/denops_std@v4.0.0/argument/mod.ts";
import { bind } from "../../command/bare/command.ts";
import { exec as execBuffer } from "../../command/buffer/edit.ts";
import { init as initActionCore, Range } from "../../action/core.ts";
import { init as initActionCherryPick } from "../../action/cherry_pick.ts";
import { init as initActionEcho } from "../../action/echo.ts";
import { init as initActionMerge } from "../../action/merge.ts";
import { init as initActionRebase } from "../../action/rebase.ts";
import { init as initActionReset } from "../../action/reset.ts";
import { init as initActionRevert } from "../../action/revert.ts";
import { init as initActionShow } from "../../action/show.ts";
import { init as initActionSwitch } from "../../action/switch.ts";
import { init as initActionTag } from "../../action/tag.ts";
import { Entry, parse as parseLog } from "./parser.ts";

export async function edit(
  denops: Denops,
  bufnr: number,
  bufname: string,
): Promise<void> {
  const cmdarg = await vars.v.get(denops, "cmdarg") as string;
  const [opts, _] = parseOpts(cmdarg.split(" "));
  const { expr, params, fragment } = parseBufname(bufname);
  await exec(denops, bufnr, {
    worktree: expr,
    flags: params,
    args: unnullish(fragment, (v) => JSON.parse(v.replace(/\$$/, ""))),
    encoding: opts.enc ?? opts.encoding,
    fileformat: opts.ff ?? opts.fileformat,
  });
}

export type ExecOptions = {
  worktree?: string;
  flags?: Flags;
  args?: string[];
  encoding?: string;
  fileformat?: string;
};

export async function exec(
  denops: Denops,
  bufnr: number,
  options: ExecOptions,
): Promise<void> {
  const args = [
    "log",
    "--color=always",
    ...formatFlags(options.flags ?? {}),
    ...(options.args ?? []),
  ];
  await execBuffer(denops, bufnr, args, {
    worktree: options.worktree,
    encoding: options.encoding,
    fileformat: options.fileformat,
  });
  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
      await bind(denops, bufnr);
      await initActionCore(denops, bufnr);
      await initActionCherryPick(denops, bufnr, gatherCandidates);
      await initActionEcho(denops, bufnr, gatherCandidates);
      await initActionMerge(denops, bufnr, gatherCandidates);
      await initActionRebase(denops, bufnr, gatherCandidates);
      await initActionReset(denops, bufnr, gatherCandidates);
      await initActionRevert(denops, bufnr, gatherCandidates);
      await initActionShow(denops, bufnr, gatherCandidates);
      await initActionSwitch(denops, bufnr, async (denops, bufnr, range) => {
        const xs = await gatherCandidates(denops, bufnr, range);
        return xs.map((x) => ({ target: x.commit, ...x }));
      });
      await initActionTag(denops, bufnr, gatherCandidates);
      await option.filetype.setLocal(denops, "gin-log");
    });
  });
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
