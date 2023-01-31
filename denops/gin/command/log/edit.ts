import type { Denops } from "https://deno.land/x/denops_std@v4.0.0/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v1.0.0/mod.ts";
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
import { init as initActionCore } from "../../action/core/action.ts";
import { init as initActionLog } from "./action.ts";

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
      await initActionLog(denops, bufnr);
      await option.filetype.setLocal(denops, "gin-log");
    });
  });
}
