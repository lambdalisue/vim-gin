import type { Denops } from "jsr:@denops/std@^7.0.0";
import { unnullish } from "jsr:@lambdalisue/unnullish@^1.0.0";
import { ensure, is } from "jsr:@core/unknownutil@^4.0.0";
import * as vars from "jsr:@denops/std@^7.0.0/variable";
import { parse as parseBufname } from "jsr:@denops/std@^7.0.0/bufname";
import {
  builtinOpts,
  Flags,
  formatFlags,
  parseOpts,
  validateOpts,
} from "jsr:@denops/std@^7.0.0/argument";
import { exec as execBuffer } from "../../command/buffer/read.ts";

export async function read(
  denops: Denops,
  bufnr: number,
  bufname: string,
): Promise<void> {
  const cmdarg = ensure(await vars.v.get(denops, "cmdarg"), is.String);
  const [opts, _] = parseOpts(cmdarg.split(" "));
  validateOpts(opts, builtinOpts);
  const { expr, params, fragment } = parseBufname(bufname);
  await exec(denops, bufnr, {
    worktree: expr,
    commitish: unnullish(
      params?.commitish,
      (v) => ensure(v, is.String, { message: "commitish must be string" }),
    ),
    paths: unnullish(fragment, JSON.parse),
    flags: {
      ...params,
      commitish: undefined,
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
    ...formatFlags(options.flags ?? {}),
    ...unnullish(options.commitish, (v) => [v]) ?? [],
    "--",
    ...(filenames ?? []),
  ];
  await execBuffer(denops, bufnr, args, {
    worktree: options.worktree,
    encoding: options.encoding,
    fileformat: options.fileformat,
    emojify: options.emojify,
  });
}
