import type { Denops } from "https://deno.land/x/denops_std@v5.0.0/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v1.0.1/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.1.1/mod.ts#^";
import * as buffer from "https://deno.land/x/denops_std@v5.0.0/buffer/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v5.0.0/variable/mod.ts";
import {
  builtinOpts,
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v5.0.0/argument/mod.ts";
import {
  parse as parseBufname,
} from "https://deno.land/x/denops_std@v5.0.0/bufname/mod.ts";
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
  const args = unknownutil.ensureArray(
    fragment.replace(/\$$/, "").split(" "),
    unknownutil.isString,
  );
  await exec(denops, bufnr, args, {
    processor: unnullish(
      params?.processor,
      (v) => unknownutil.ensureString(v).split(" "),
    ),
    worktree: expr,
    encoding: opts.enc ?? opts.encoding,
    fileformat: opts.ff ?? opts.fileformat,
  });
}

export type ExecOptions = {
  processor?: string[];
  worktree?: string;
  encoding?: string;
  fileformat?: string;
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
  await buffer.append(denops, bufnr, content, {
    lnum: options.lnum,
  });
}
