import type { Denops } from "jsr:@denops/std@^7.0.0";
import { emojify } from "jsr:@lambdalisue/github-emoji@^1.0.0";
import { unnullish } from "jsr:@lambdalisue/unnullish@^1.0.0";
import { ensure, is } from "jsr:@core/unknownutil@^4.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import * as option from "jsr:@denops/std@^7.0.0/option";
import * as vars from "jsr:@denops/std@^7.0.0/variable";
import {
  builtinOpts,
  parseOpts,
  validateOpts,
} from "jsr:@denops/std@^7.0.0/argument";
import { parse as parseBufname } from "jsr:@denops/std@^7.0.0/bufname";
import {
  buildDecorationsFromAnsiEscapeCode,
} from "../../util/ansi_escape_code.ts";
import { execute } from "../../git/executor.ts";

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
    monochrome: "monochrome" in (params ?? {}),
    encoding: opts.enc ?? opts.encoding,
    fileformat: opts.ff ?? opts.fileformat,
    emojify: "emojify" in (params ?? {}),
  });
}

export type ExecOptions = {
  processor?: string[];
  worktree?: string;
  monochrome?: boolean;
  encoding?: string;
  fileformat?: string;
  emojify?: boolean;
  stdoutIndicator?: string;
  stderrIndicator?: string;
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
    stdoutIndicator: options.stdoutIndicator ?? "null",
    stderrIndicator: options.stderrIndicator,
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
    options.emojify ? content.map(emojify) : content,
  );
  await buffer.replace(
    denops,
    bufnr,
    trimmed,
    {
      fileformat,
      fileencoding,
    },
  );
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
