import type { Denops } from "https://deno.land/x/denops_std@v3.9.0/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v0.2.0/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v3.9.0/batch/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.9.0/buffer/mod.ts";
import * as option from "https://deno.land/x/denops_std@v3.9.0/option/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.9.0/variable/mod.ts";
import {
  builtinOpts,
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v3.9.0/argument/mod.ts";
import {
  parse as parseBufname,
} from "https://deno.land/x/denops_std@v3.9.0/bufname/mod.ts";
import {
  buildDecorationsFromAnsiEscapeCode,
} from "../../util/ansi_escape_code.ts";
import { execute } from "../executor.ts";

export async function edit(
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
    monochrome: "monochrome" in (params ?? {}),
    encoding: opts.enc ?? opts.encoding,
    fileformat: opts.ff ?? opts.fileformat,
  });
}

export type ExecOptions = {
  processor?: string[];
  worktree?: string;
  monochrome?: boolean;
  encoding?: string;
  fileformat?: string;
};

export async function exec(
  denops: Denops,
  bufnr: number,
  args: string[],
  options: ExecOptions,
): Promise<void> {
  args = [
    ...(options.monochrome ? [] : [
      // It seems 'color.ui' is not enough on Windows
      "-c",
      "color.branch=always",
      "-c",
      "color.diff=always",
      "-c",
      "color.status=always",
      "-c",
      "color.ui=always",
    ]),
    ...args,
  ];
  const { stdout } = await execute(denops, args, {
    processor: options.processor,
    worktree: options.worktree,
    throwOnError: true,
  });
  const { content, fileformat, fileencoding } = await buffer.decode(
    denops,
    bufnr,
    stdout,
    {
      fileformat: options.fileformat,
      fileencoding: options.encoding,
    },
  );
  const [trimmed, decorations] = await buildDecorationsFromAnsiEscapeCode(
    denops,
    content,
  );
  await buffer.replace(denops, bufnr, trimmed, {
    fileformat,
    fileencoding,
  });
  await buffer.decorate(denops, bufnr, decorations);
  await buffer.concrete(denops, bufnr);
  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
      await option.filetype.setLocal(denops, "gin");
      await option.bufhidden.setLocal(denops, "unload");
      await option.buftype.setLocal(denops, "nofile");
      await option.swapfile.setLocal(denops, false);
      await option.modifiable.setLocal(denops, false);
    });
  });
}
