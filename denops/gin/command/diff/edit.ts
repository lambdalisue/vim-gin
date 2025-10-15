import type { Denops } from "jsr:@denops/std@^7.0.0";
import { unnullish } from "jsr:@lambdalisue/unnullish@^1.0.0";
import { ensure, is } from "jsr:@core/unknownutil@^4.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
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
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import { exec as execBuffer } from "../../command/buffer/edit.ts";
import { init as initDiffJump } from "../../feat/diffjump/jump.ts";
import { init as initDiffFold } from "../../feat/difffold/fold.ts";

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
    processor: unnullish(
      params?.processor,
      (v) =>
        ensure(v, is.String, { message: "processor must be string" }).split(
          " ",
        ),
    ),
    worktree: expr,
    commitish: unnullish(
      params?.commitish,
      (v) => ensure(v, is.String, { message: "commitish must be string" }),
    ),
    paths: unnullish(fragment, JSON.parse),
    flags: {
      ...params,
      processor: undefined,
      commitish: undefined,
    },
    encoding: opts.enc ?? opts.encoding,
    fileformat: opts.ff ?? opts.fileformat,
  });
}

export type ExecOptions = {
  processor?: string[];
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
    "diff",
    ...formatFlags(options.flags ?? {}),
    ...(unnullish(options.commitish, (v) => [v]) ?? []),
    "--",
    ...(filenames ?? []),
  ];
  await execBuffer(denops, bufnr, args, {
    processor: options.processor,
    worktree: options.worktree,
    encoding: options.encoding,
    fileformat: options.fileformat,
  });
  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
      await option.filetype.setLocal(denops, "gin-diff");
      await option.bufhidden.setLocal(denops, "unload");
      await option.buftype.setLocal(denops, "nofile");
      await option.swapfile.setLocal(denops, false);
      await option.modifiable.setLocal(denops, false);
    });
  });

  // Initialize diff jump functionality
  await initDiffJump(denops, bufnr, "diff");

  // Initialize diff fold functionality
  await initDiffFold(denops, bufnr);
}
