import type { Denops } from "https://deno.land/x/denops_std@v5.0.0/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v1.0.1/mod.ts";
import { ensureString } from "https://deno.land/x/unknownutil@v2.1.1/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v5.0.0/function/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v5.0.0/batch/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v5.0.0/buffer/mod.ts";
import * as option from "https://deno.land/x/denops_std@v5.0.0/option/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v5.0.0/variable/mod.ts";
import { parse as parseBufname } from "https://deno.land/x/denops_std@v5.0.0/bufname/mod.ts";
import {
  builtinOpts,
  Flags,
  formatFlags,
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v5.0.0/argument/mod.ts";
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
import { init as initActionYank } from "../../action/yank.ts";
import { Entry, parse as parseLog } from "./parser.ts";

export async function edit(
  denops: Denops,
  bufnr: number,
  bufname: string,
): Promise<void> {
  const cmdarg = await vars.v.get(denops, "cmdarg") as string;
  const [opts, _] = parseOpts(cmdarg.split(" "));
  validateOpts(opts, builtinOpts);
  const { expr, params, fragment } = parseBufname(bufname);
  await exec(denops, bufnr, {
    worktree: expr,
    commitish: unnullish(params?.commitish, ensureString),
    paths: unnullish(fragment, JSON.parse),
    flags: {
      ...params,
      commitish: undefined,
    },
    encoding: opts.enc ?? opts.encoding,
    fileformat: opts.ff ?? opts.fileformat,
  });
}

export type ExecOptions = {
  worktree?: string;
  commitish?: string;
  paths?: string[];
  flags?: Flags;
  encoding?: string;
  fileformat?: string;
};

export async function exec(
  denops: Denops,
  bufnr: number,
  options: ExecOptions,
): Promise<void> {
  const filenames = options.paths?.map((v) => v.replaceAll("\\", "/"));
  const args = [
    "log",
    "--color=always",
    ...formatFlags(options.flags ?? {}),
    ...(unnullish(options.commitish, (v) => [v]) ?? []),
    "--",
    ...(filenames ?? []),
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
      await initActionYank(denops, bufnr, async (denops, bufnr, range) => {
        const xs = await gatherCandidates(denops, bufnr, range);
        return xs.map((x) => ({ value: x.commit }));
      }, {
        suffix: ":commit",
      });
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
