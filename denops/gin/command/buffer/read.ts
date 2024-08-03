import type { Denops } from "jsr:@denops/std@^7.0.0";
import { emojify } from "jsr:@lambdalisue/github-emoji@^1.0.0";
import { unnullish } from "jsr:@lambdalisue/unnullish@^1.0.0";
import { ensure, is } from "jsr:@core/unknownutil@^4.0.0";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import * as vars from "jsr:@denops/std@^7.0.0/variable";
import {
  builtinOpts,
  parseOpts,
  validateOpts,
} from "jsr:@denops/std@^7.0.0/argument";
import { parse as parseBufname } from "jsr:@denops/std@^7.0.0/bufname";
import { execute } from "../../git/executor.ts";

export async function read(
  denops: Denops,
  bufnr: number,
  bufname: string,
): Promise<void> {
  const cmdarg = await vars.v.get(denops, "cmdarg") as string;
  const [opts, _] = parseOpts(cmdarg.split(" "));
  validateOpts(opts, builtinOpts);
  const { scheme, expr, params, fragment } = parseBufname(bufname);
  if (!fragment) {
    throw new Error(`A buffer '${scheme}://' requires a fragment part`);
  }
  const args = fragment.replace(/\$$/, "").split(" ");
  await exec(denops, bufnr, args, {
    processor: unnullish(
      params?.processor,
      (v) =>
        ensure(v, is.String, { message: "processor must be string" }).split(
          " ",
        ),
    ),
    worktree: expr,
    encoding: opts.enc ?? opts.encoding,
    fileformat: opts.ff ?? opts.fileformat,
    emojify: "emojify" in (params ?? {}),
  });
}

export type ExecOptions = {
  processor?: string[];
  worktree?: string;
  encoding?: string;
  fileformat?: string;
  emojify?: boolean;
  lnum?: number;
};

export async function exec(
  denops: Denops,
  bufnr: number,
  args: string[],
  options: ExecOptions,
): Promise<void> {
  const { stdout } = await execute(denops, args, {
    processor: options.processor,
    worktree: options.worktree,
    throwOnError: true,
  });
  const { content } = await buffer.decode(
    denops,
    bufnr,
    stdout,
    {
      fileformat: options.fileformat,
      fileencoding: options.encoding,
    },
  );
  await buffer.append(
    denops,
    bufnr,
    options.emojify ? content.map(emojify) : content,
    {
      lnum: options.lnum,
    },
  );
}
