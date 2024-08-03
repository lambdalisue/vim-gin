import type { Denops } from "jsr:@denops/std@^7.0.0";
import { unnullish } from "jsr:@lambdalisue/unnullish@^1.0.0";
import * as path from "jsr:@std/path@^1.0.0";
import * as autocmd from "jsr:@denops/std@^7.0.0/autocmd";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import * as option from "jsr:@denops/std@^7.0.0/option";
import * as vars from "jsr:@denops/std@^7.0.0/variable";
import { parse as parseBufname } from "jsr:@denops/std@^7.0.0/bufname";
import { Flags, formatFlags, parseOpts } from "jsr:@denops/std@^7.0.0/argument";
import { bind } from "../../command/bare/command.ts";
import { exec as execBuffer } from "../../command/buffer/edit.ts";
import { findWorktreeFromDenops } from "../../git/worktree.ts";
import { init as initActionAdd } from "../../action/add.ts";
import { init as initActionBrowse } from "../../action/browse.ts";
import { init as initActionChaperon } from "../../action/chaperon.ts";
import { init as initActionCore, Range } from "../../action/core.ts";
import { init as initActionDiff } from "../../action/diff.ts";
import { init as initActionDiffSmart } from "../../action/diff_smart.ts";
import { init as initActionEcho } from "../../action/echo.ts";
import { init as initActionEdit } from "../../action/edit.ts";
import { init as initActionPatch } from "../../action/patch.ts";
import { init as initActionResetFile } from "../../action/reset_file.ts";
import { init as initActionRestore } from "../../action/restore.ts";
import { init as initActionRm } from "../../action/rm.ts";
import { init as initActionStage } from "../../action/stage.ts";
import { init as initActionStash } from "../../action/stash.ts";
import { init as initActionYank } from "../../action/yank.ts";
import { Entry, parse as parseStatus } from "./parser.ts";

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
    pathspecs: unnullish(fragment, (v) => JSON.parse(v.replace(/\$$/, ""))),
    encoding: opts.enc ?? opts.encoding,
    fileformat: opts.ff ?? opts.fileformat,
  });
}

export type ExecOptions = {
  worktree?: string;
  flags?: Flags;
  pathspecs?: string[];
  encoding?: string;
  fileformat?: string;
};

export async function exec(
  denops: Denops,
  bufnr: number,
  options: ExecOptions,
): Promise<void> {
  const args = [
    "status",
    "--short",
    "--branch",
    "--ahead-behind",
    ...formatFlags(options.flags ?? {}),
    "--",
    ...(options.pathspecs ?? []),
  ];
  await execBuffer(denops, bufnr, args, {
    worktree: options.worktree,
    encoding: options.encoding,
    fileformat: options.fileformat,
  });
  await buffer.ensure(denops, bufnr, async () => {
    await buffer.modifiable(denops, bufnr, async () => {
      const saved = await fn.winsaveview(denops);
      await denops.cmd("silent! 2,$sort /.. /)");
      await fn.winrestview(denops, saved);
    });
    await batch.batch(denops, async (denops) => {
      await bind(denops, bufnr);
      await initActionCore(denops, bufnr);
      await initActionAdd(denops, bufnr, gatherCandidates);
      await initActionBrowse(denops, bufnr, async (denops, bufnr, range) => {
        const xs = await gatherCandidates(denops, bufnr, range);
        return xs.map((x) => ({ commit: "HEAD", ...x }));
      });
      await initActionChaperon(denops, bufnr, gatherCandidates);
      await initActionDiff(denops, bufnr, gatherCandidates);
      await initActionDiffSmart(denops, bufnr, gatherCandidates);
      await initActionEcho(denops, bufnr, gatherCandidates);
      await initActionEdit(denops, bufnr, gatherCandidates);
      await initActionPatch(denops, bufnr, gatherCandidates);
      await initActionResetFile(denops, bufnr, gatherCandidates);
      await initActionRestore(denops, bufnr, gatherCandidates);
      await initActionRm(denops, bufnr, gatherCandidates);
      await initActionStage(denops, bufnr, gatherCandidates);
      await initActionStash(denops, bufnr, gatherCandidates);
      await initActionYank(denops, bufnr, async (denops, bufnr, range) => {
        const xs = await gatherCandidates(denops, bufnr, range);
        return xs.map((x) => ({ value: x.path }));
      }, {
        suffix: ":path",
      });
      await initActionYank(denops, bufnr, async (denops, bufnr, range) => {
        const xs = await gatherCandidates(denops, bufnr, range);
        return xs.map((x) => ({ value: x.origPath ?? "" }));
      }, {
        suffix: ":path:orig",
      });
      await option.filetype.setLocal(denops, "gin-status");
      await autocmd.group(
        denops,
        `gin_command_status_command_read_${bufnr}`,
        (helper) => {
          helper.remove();
          helper.define(
            ["BufWritePost", "FileWritePost"],
            "*",
            `call gin#util#reload(${bufnr})`,
          );
        },
      );
    });
  });
}

async function gatherCandidates(
  denops: Denops,
  bufnr: number,
  [start, end]: Range,
): Promise<Entry[]> {
  const worktree = await findWorktreeFromDenops(denops);
  const content = await fn.getbufline(
    denops,
    bufnr,
    Math.max(start, 1),
    Math.max(end, 1),
  );
  const result = parseStatus(content);
  return result.entries.map((ent) => ({
    ...ent,
    path: path.join(worktree, ent.path),
    origPath: unnullish(ent.origPath, (v) => path.join(worktree, v)),
  }));
}
