import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as path from "jsr:@std/path@^1.0.0";
import { unnullish } from "jsr:@lambdalisue/unnullish@^1.0.0";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import * as option from "jsr:@denops/std@^7.0.0/option";
import { format as formatBufname } from "jsr:@denops/std@^7.0.0/bufname";
import { Flags } from "jsr:@denops/std@^7.0.0/argument";
import { findWorktreeFromDenops } from "../../git/worktree.ts";

export type ExecOptions = {
  processor?: string[];
  worktree?: string;
  commitish?: string;
  paths?: string[];
  flags?: Flags;
  opener?: string;
  cmdarg?: string;
  mods?: string;
  bang?: boolean;
};

export async function exec(
  denops: Denops,
  options: ExecOptions = {},
): Promise<buffer.OpenResult> {
  const verbose = await option.verbose.get(denops);

  const worktree = await findWorktreeFromDenops(denops, {
    worktree: options.worktree,
    verbose: !!verbose,
  });

  const paths = options.paths?.map((p) =>
    path.isAbsolute(p) ? path.relative(worktree, p) : p
  );

  const bufname = formatBufname({
    scheme: "gindiff",
    expr: worktree,
    params: {
      ...options.flags ?? {},
      processor: unnullish(options.processor, (v) => v.join(" ")),
      commitish: options.commitish,
    },
    fragment: unnullish(paths, JSON.stringify),
  });
  return await buffer.open(denops, bufname, {
    opener: options.opener,
    cmdarg: options.cmdarg,
    mods: options.mods,
    bang: options.bang,
  });
}
