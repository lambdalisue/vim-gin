import type { Denops } from "jsr:@denops/std@^7.0.0";
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

const defaultFormat =
  "%(objectname:short) %(refname:short) %(creatordate:short) %(subject)";

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
    flags: {
      ...params,
      emojify: undefined,
    },
    patterns: fragment?.replace(/\$$/, "").split(" ").filter((v) => v),
    encoding: opts.enc ?? opts.encoding,
    fileformat: opts.ff ?? opts.fileformat,
    emojify: "emojify" in (params ?? {}),
  });
}

export type ExecOptions = {
  worktree?: string;
  flags?: Flags;
  patterns?: string[];
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
    "tag",
    "--list",
    "--color=never",
    `--format=${defaultFormat}`,
    ...formatFlags(options.flags ?? {}),
    "--",
    ...(options.patterns ?? []),
  ];
  await execBuffer(denops, bufnr, args, {
    worktree: options.worktree,
    encoding: options.encoding,
    fileformat: options.fileformat,
    emojify: options.emojify,
  });
}
