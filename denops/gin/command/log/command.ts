import type { Denops } from "https://deno.land/x/denops_std@v6.5.1/mod.ts";
import * as path from "https://deno.land/std@0.224.0/path/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v1.0.1/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v6.5.1/buffer/mod.ts";
import * as option from "https://deno.land/x/denops_std@v6.5.1/option/mod.ts";
import {
  format as formatBufname,
} from "https://deno.land/x/denops_std@v6.5.1/bufname/mod.ts";
import { Flags } from "https://deno.land/x/denops_std@v6.5.1/argument/mod.ts";
import { findWorktreeFromDenops } from "../../git/worktree.ts";

export type ExecOptions = {
  worktree?: string;
  commitish?: string;
  paths?: string[];
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

  const paths = options.paths?.map((p) =>
    path.isAbsolute(p) ? path.relative(worktree, p) : p
  );

  const bufname = formatBufname({
    scheme: "ginlog",
    expr: worktree,
    params: {
      ...options.flags ?? {},
      commitish: options.commitish,
      emojify: unnullish(options.emojify, (v) => v ? "" : undefined),
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
