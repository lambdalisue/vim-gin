import type { Denops } from "jsr:@denops/std@^7.0.0";
import { ensure, is } from "jsr:@core/unknownutil@^4.0.0";
import { unnullish } from "jsr:@lambdalisue/unnullish@^1.0.0";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import * as vars from "jsr:@denops/std@^7.0.0/variable";
import { parseOpts, validateOpts } from "jsr:@denops/std@^7.0.0/argument";
import { parse as parseBufname } from "jsr:@denops/std@^7.0.0/bufname";
import { execute } from "../../git/executor.ts";
import { formatTreeish } from "./util.ts";

export async function read(
  denops: Denops,
  bufnr: number,
  bufname: string,
): Promise<void> {
  const cmdarg = ensure(await vars.v.get(denops, "cmdarg"), is.String);
  const [opts, _] = parseOpts(cmdarg.split(" "));
  validateOpts(opts, ["enc", "encoding", "ff", "fileformat"]);
  const { scheme, expr, params, fragment } = parseBufname(bufname);
  if (!fragment) {
    throw new Error(`A buffer '${scheme}://' requires a fragment part`);
  }
  await exec(denops, bufnr, fragment, {
    worktree: expr,
    commitish: unnullish(
      params?.commitish,
      (v) => ensure(v, is.String, { message: "commitish must be string" }),
    ),
    encoding: opts.enc ?? opts.encoding,
    fileformat: opts.ff ?? opts.fileformat,
  });
}

export type ExecOptions = {
  worktree?: string;
  commitish?: string;
  lnum?: number;
  encoding?: string;
  fileformat?: string;
};

export async function exec(
  denops: Denops,
  bufnr: number,
  relpath: string,
  options: ExecOptions,
): Promise<void> {
  const filename = relpath.replaceAll("\\", "/");
  const args = ["show", ...formatTreeish(options.commitish, filename)];
  const { stdout } = await execute(
    denops,
    args,
    {
      worktree: options.worktree,
      throwOnError: true,
      stdoutIndicator: "null",
    },
  );
  const { content } = await buffer.decode(denops, bufnr, stdout, {
    fileformat: options.fileformat,
    fileencoding: options.encoding,
  });
  await buffer.append(denops, bufnr, content, {
    lnum: options.lnum,
  });
}
