import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as path from "jsr:@std/path@^1.0.0";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import * as option from "jsr:@denops/std@^7.0.0/option";
import { format as formatBufname } from "jsr:@denops/std@^7.0.0/bufname";
import { unnullish } from "jsr:@lambdalisue/unnullish@^1.0.0";
import { findWorktreeFromDenops } from "../../git/worktree.ts";

export type ExecOptions = {
  worktree?: string;
  commitish?: string;
  emojify?: boolean;
  opener?: string;
  cmdarg?: string;
  mods?: string;
  bang?: boolean;
};

export async function exec(
  denops: Denops,
  filename: string,
  options: ExecOptions = {},
): Promise<buffer.OpenResult> {
  const verbose = await option.verbose.get(denops);

  const worktree = await findWorktreeFromDenops(denops, {
    worktree: options.worktree,
    verbose: !!verbose,
  });

  const relpath = path.isAbsolute(filename)
    ? path.relative(worktree, filename)
    : filename;

  const bufname = formatBufname({
    scheme: "ginblame",
    expr: worktree,
    params: {
      commitish: options.commitish,
      emojify: unnullish(options.emojify, (v) => v ? "" : undefined),
    },
    fragment: relpath,
  });
  return await buffer.open(denops, bufname.toString(), {
    opener: options.opener ?? "tabedit",
    cmdarg: options.cmdarg,
    mods: options.mods,
    bang: options.bang,
  });
}
