import type { Denops } from "https://deno.land/x/denops_std@v3.8.1/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v3.8.1/autocmd/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.8.1/function/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v3.8.1/batch/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.8.1/buffer/mod.ts";
import * as option from "https://deno.land/x/denops_std@v3.8.1/option/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.8.1/variable/mod.ts";
import { parse as parseBufname } from "https://deno.land/x/denops_std@v3.8.1/bufname/mod.ts";
import {
  Flags,
  formatFlags,
  parseOpts,
} from "https://deno.land/x/denops_std@v3.8.1/argument/mod.ts";
import { bind } from "../../core/bare/command.ts";
import { register as registerGatherer } from "../../core/action/registry.ts";
import { exec as execBuffer } from "../../core/buffer/edit.ts";
import { getCandidates } from "./action.ts";

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
    pathspecs: fragment?.replace(/\$$/, "").split(" ").filter((v) => v),
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
  await registerGatherer(denops, bufnr, getCandidates);
  await buffer.ensure(denops, bufnr, async () => {
    await buffer.modifiable(denops, bufnr, async () => {
      const saved = await fn.winsaveview(denops);
      await denops.cmd("silent! 2,$sort /.. /)");
      await fn.winrestview(denops, saved);
    });
    await batch.batch(denops, async (denops) => {
      await bind(denops, bufnr);
      await option.filetype.setLocal(denops, "gin-status");
      await denops.call("gin#internal#feat#status#core#init");
      await autocmd.group(
        denops,
        `gin_feat_status_command_read_${bufnr}`,
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
