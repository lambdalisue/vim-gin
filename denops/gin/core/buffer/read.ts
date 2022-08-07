import type { Denops } from "https://deno.land/x/denops_std@v3.8.1/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.8.1/buffer/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.8.1/variable/mod.ts";
import {
  builtinOpts,
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v3.8.1/argument/mod.ts";
import {
  parse as parseBufname,
} from "https://deno.land/x/denops_std@v3.8.1/bufname/mod.ts";
import { execute } from "../executor.ts";

export async function read(
  denops: Denops,
  bufnr: number,
  bufname: string,
): Promise<void> {
  const cmdarg = await vars.v.get(denops, "cmdarg") as string;
  const [opts, _] = parseOpts(cmdarg.split(" "));
  validateOpts(opts, builtinOpts);
  const { scheme, expr, fragment } = parseBufname(bufname);
  if (!fragment) {
    throw new Error(`A buffer '${scheme}://' requires a fragment part`);
  }
  const args = unknownutil.ensureArray(
    fragment.replace(/\$$/, "").split(" "),
    unknownutil.isString,
  );
  await exec(denops, bufnr, args, {
    worktree: expr,
    encoding: opts.enc ?? opts.encoding,
    fileformat: opts.ff ?? opts.fileformat,
  });
}

export type ExecOptions = {
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
