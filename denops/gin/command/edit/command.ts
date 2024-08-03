import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as path from "jsr:@std/path@^1.0.0";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import * as option from "jsr:@denops/std@^7.0.0/option";
import { format as formatBufname } from "jsr:@denops/std@^7.0.0/bufname";
import { findWorktreeFromDenops } from "../../git/worktree.ts";

export type ExecOptions = {
  worktree?: string;
  commitish?: string;
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
    scheme: "ginedit",
    expr: worktree,
    params: {
      commitish: options.commitish,
    },
    fragment: relpath,
  });
  return await buffer.open(denops, bufname.toString(), {
    opener: options.opener,
    cmdarg: options.cmdarg,
    mods: options.mods,
    bang: options.bang,
  });
}
