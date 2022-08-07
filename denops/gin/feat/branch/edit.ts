import type { Denops } from "https://deno.land/x/denops_std@v3.8.1/mod.ts";
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
    patterns: fragment?.replace(/\$$/, "").split(" ").filter((v) => v),
    encoding: opts.enc ?? opts.encoding,
    fileformat: opts.ff ?? opts.fileformat,
  });
}

export type ExecOptions = {
  worktree?: string;
  flags?: Flags;
  patterns?: string[];
  encoding?: string;
  fileformat?: string;
};

export async function exec(
  denops: Denops,
  bufnr: number,
  options: ExecOptions,
): Promise<void> {
  const args = [
    "branch",
    "--list",
    "-vv",
    ...formatFlags(options.flags ?? {}),
    "--",
    ...(options.patterns ?? []),
  ];
  await execBuffer(denops, bufnr, args, {
    worktree: options.worktree,
    encoding: options.encoding,
    fileformat: options.fileformat,
  });
  await registerGatherer(denops, bufnr, getCandidates);
  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
      await bind(denops, bufnr);
      await option.filetype.setLocal(denops, "gin-branch");
      await denops.call("gin#internal#feat#branch#core#init");
    });
  });
}
