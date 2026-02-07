import type { Denops } from "jsr:@denops/std@^7.0.0";
import { unnullish } from "jsr:@lambdalisue/unnullish@^1.0.0";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import * as option from "jsr:@denops/std@^7.0.0/option";
import { format as formatBufname } from "jsr:@denops/std@^7.0.0/bufname";
import { Flags } from "jsr:@denops/std@^7.0.0/argument";
import { findWorktreeFromDenops } from "../../git/worktree.ts";

export type ExecOptions = {
  worktree?: string;
  ref?: string;
  flags?: Flags;
  opener?: string;
  emojify?: boolean;
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

  const bufname = formatBufname({
    scheme: "ginreflog",
    expr: worktree,
    params: {
      ...options.flags ?? {},
      ref: options.ref,
      emojify: unnullish(options.emojify, (v) => v ? "" : undefined),
    },
  });
  return await buffer.open(denops, bufname, {
    opener: options.opener,
    cmdarg: options.cmdarg,
    mods: options.mods,
    bang: options.bang,
  });
}
