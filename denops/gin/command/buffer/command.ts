import type { Denops } from "jsr:@denops/std@^7.0.0";
import { unnullish } from "jsr:@lambdalisue/unnullish@^1.0.0";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import * as option from "jsr:@denops/std@^7.0.0/option";
import { format as formatBufname } from "jsr:@denops/std@^7.0.0/bufname";
import { findWorktreeFromDenops } from "../../git/worktree.ts";

export type ExecOptions = {
  processor?: string[];
  worktree?: string;
  monochrome?: boolean;
  opener?: string;
  emojify?: boolean;
  diffjump?: string;
  difffold?: boolean;
  filetype?: string;
  cmdarg?: string;
  mods?: string;
  bang?: boolean;
};

export async function exec(
  denops: Denops,
  args: string[],
  options: ExecOptions = {},
): Promise<buffer.OpenResult> {
  const verbose = await option.verbose.get(denops);
  const worktree = await findWorktreeFromDenops(denops, {
    worktree: options.worktree,
    verbose: !!verbose,
  });
  const bufname = formatBufname({
    scheme: "gin",
    expr: worktree,
    params: {
      processor: unnullish(options.processor, (v) => v.join(" ")),
      monochrome: unnullish(options.monochrome, (v) => v ? "" : undefined),
      emojify: unnullish(options.emojify, (v) => v ? "" : undefined),
      diffjump: options.diffjump,
      difffold: unnullish(options.difffold, (v) => v ? "" : undefined),
      filetype: options.filetype ?? "gin-buffer",
    },
    fragment: `${args.join(" ")}$`,
  });
  return await buffer.open(denops, bufname, {
    opener: options.opener,
    cmdarg: options.cmdarg,
    mods: options.mods,
    bang: options.bang,
  });
}
