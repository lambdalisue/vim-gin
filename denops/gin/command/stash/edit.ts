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
import { init as initActionCore, Range } from "../../action/core.ts";
import { init as initActionEcho } from "../../action/echo.ts";
import { init as initActionShow } from "../../action/show.ts";
import { init as initActionStashApply } from "../../action/stash_apply.ts";
import { init as initActionStashDrop } from "../../action/stash_drop.ts";
import { init as initActionStashPop } from "../../action/stash_pop.ts";
import { init as initActionYank } from "../../action/yank.ts";
import { Entry, parse as parseStash } from "./parser.ts";

export async function edit(
  denops: Denops,
  bufnr: number,
  bufname: string,
): Promise<void> {
  const cmdarg = await vars.v.get(denops, "cmdarg") as string;
  const [opts, _] = parseOpts(cmdarg.split(" "));
  validateOpts(opts, builtinOpts);
  const { expr, params } = parseBufname(bufname);
  await exec(denops, bufnr, {
    worktree: expr,
    flags: {
      ...params,
      emojify: undefined,
    },
    encoding: opts.enc ?? opts.encoding,
    fileformat: opts.ff ?? opts.fileformat,
    emojify: "emojify" in (params ?? {}),
  });
}

export type ExecOptions = {
  worktree?: string;
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
  const args = [
    "stash",
    "list",
    "--color=never",
    ...formatFlags(options.flags ?? {}),
  ];
  await execBuffer(denops, bufnr, args, {
    worktree: options.worktree,
    monochrome: true,
    encoding: options.encoding,
    fileformat: options.fileformat,
    emojify: options.emojify,
  });
  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
      await bind(denops, bufnr);
      await initActionCore(denops, bufnr);
      await initActionBrowse(denops, bufnr, gatherCandidates);
      await initActionEcho(denops, bufnr, gatherCandidates);
      await initActionShow(denops, bufnr, gatherCandidates);
      await initActionStashApply(denops, bufnr, gatherCandidates);
      await initActionStashDrop(denops, bufnr, gatherCandidates);
      await initActionStashPop(denops, bufnr, gatherCandidates);
      await initActionYank(denops, bufnr, async (denops, bufnr, range) => {
        const xs = await gatherCandidates(denops, bufnr, range);
        return xs.map((x) => ({ value: x.commit }));
      }, {
        suffix: ":stash",
      });
      await option.filetype.setLocal(denops, "gin-stash");
    });
  });
}

async function gatherCandidates(
  denops: Denops,
  bufnr: number,
  [start, end]: Range,
): Promise<(Entry & { commit: string })[]> {
  const [content, patternStr] = await batch.collect(denops, (denops) => [
    fn.getbufline(
      denops,
      bufnr,
      Math.max(start, 1),
      Math.max(end, 1),
    ),
    vars.g.get(denops, "gin_stash_parse_pattern"),
  ]);
  const pattern = unnullish(
    patternStr,
    (v) =>
      new RegExp(
        ensure(v, is.String, {
          message: "g:gin_stash_parse_pattern must be string",
        }),
      ),
  );
  const result = parseStash(content, pattern);
  // Map stashRef to commit field for compatibility with show/browse actions
  return result.entries.map((entry) => ({
    ...entry,
    commit: entry.stashRef,
  }));
}
