import type { Denops } from "jsr:@denops/std@^7.0.0";
import { unnullish } from "jsr:@lambdalisue/unnullish@^1.0.0";
import { ensure, is } from "jsr:@core/unknownutil@^4.0.0";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import * as option from "jsr:@denops/std@^7.0.0/option";
import * as vars from "jsr:@denops/std@^7.0.0/variable";
import { parse as parseBufname } from "jsr:@denops/std@^7.0.0/bufname";
import {
  builtinOpts,
  Flags,
  formatFlags,
  parseOpts,
  validateOpts,
} from "jsr:@denops/std@^7.0.0/argument";
import { bind } from "../../command/bare/command.ts";
import { exec as execBuffer } from "../../command/buffer/edit.ts";
import { init as initActionBrowse } from "../../action/browse.ts";
import { init as initActionCherryPick } from "../../action/cherry_pick.ts";
import { init as initActionCore, Range } from "../../action/core.ts";
import { init as initActionEcho } from "../../action/echo.ts";
import { init as initActionFixup } from "../../action/fixup.ts";
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
    commitish: unnullish(
      params?.commitish,
      (x) => ensure(x, is.String, { message: "commitish must be string" }),
    ),
    paths: unnullish(fragment, JSON.parse),
    flags: {
      ...params,
      commitish: undefined,
      emojify: undefined,
    },
    encoding: opts.enc ?? opts.encoding,
    fileformat: opts.ff ?? opts.fileformat,
    emojify: "emojify" in (params ?? {}),
  });
}

export type ExecOptions = {
  worktree?: string;
  commitish?: string;
  paths?: string[];
  flags?: Flags;
  encoding?: string;
  fileformat?: string;
  emojify?: boolean;
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
    ...formatFlags({
      "decorate": "short",
      ...(options.flags ?? {}),
    }),
    ...(unnullish(options.commitish, (v) => [v]) ?? []),
    "--",
    ...(filenames ?? []),
  ];
  await execBuffer(denops, bufnr, args, {
    worktree: options.worktree,
    encoding: options.encoding,
    fileformat: options.fileformat,
    emojify: options.emojify,
  });
  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
      await bind(denops, bufnr);
      await initActionCore(denops, bufnr);
      await initActionBrowse(denops, bufnr, gatherCandidates);
      await initActionCherryPick(denops, bufnr, gatherCandidates);
      await initActionEcho(denops, bufnr, gatherCandidates);
      await initActionFixup(denops, bufnr, async (denops, bufnr, range) => {
        const xs = await gatherCandidates(denops, bufnr, range);
        return xs.map((x) => ({ commit: x.commit }));
      });
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
  const [content, patternStr] = await batch.collect(denops, (denops) => [
    fn.getbufline(
      denops,
      bufnr,
      Math.max(start, 1),
      Math.max(end, 1),
    ),
    vars.g.get(denops, "gin_log_parse_pattern"),
  ]);
  const pattern = unnullish(
    patternStr,
    (v) =>
      new RegExp(
        ensure(v, is.String, {
          message: "g:gin_log_parse_pattern must be string",
        }),
      ),
  );
  const result = parseLog(content, pattern);
  return result.entries;
}
