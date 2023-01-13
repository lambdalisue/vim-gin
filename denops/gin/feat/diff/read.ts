import type { Denops } from "https://deno.land/x/denops_std@v4.0.0/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v1.0.0/mod.ts";
import { ensureString } from "https://deno.land/x/unknownutil@v2.1.0/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v4.0.0/variable/mod.ts";
import {
  parse as parseBufname,
} from "https://deno.land/x/denops_std@v4.0.0/bufname/mod.ts";
import {
  builtinOpts,
  Flags,
  formatFlags,
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v4.0.0/argument/mod.ts";
import { exec as execBuffer } from "../../core/buffer/read.ts";

export async function read(
  denops: Denops,
  bufnr: number,
  bufname: string,
): Promise<void> {
  const cmdarg = await vars.v.get(denops, "cmdarg") as string;
  const [opts, _] = parseOpts(cmdarg.split(" "));
  validateOpts(opts, builtinOpts);
  const { expr, params, fragment } = parseBufname(bufname);
  await exec(denops, bufnr, {
    processor: unnullish(opts.processor, (v) => v.split(" ")),
    worktree: expr,
    commitish: unnullish(params?.commitish, ensureString),
    paths: unnullish(fragment, (v) => JSON.parse(v.replace(/\$$/, ""))),
    flags: {
      ...params,
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
    ...unnullish(options.commitish, (v) => [v]) ?? [],
    "--",
    ...(filenames ?? []),
  ];
  await execBuffer(denops, bufnr, args, {
    processor: options.processor,
    worktree: options.worktree,
    encoding: options.encoding,
    fileformat: options.fileformat,
  });
}
