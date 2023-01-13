import type { Denops } from "https://deno.land/x/denops_std@v4.0.0/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v1.0.0/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v4.0.0/buffer/mod.ts";
import * as option from "https://deno.land/x/denops_std@v4.0.0/option/mod.ts";
import {
  format as formatBufname,
} from "https://deno.land/x/denops_std@v4.0.0/bufname/mod.ts";
import {
  builtinOpts,
  formatOpts,
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v4.0.0/argument/mod.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { findWorktreeFromDenops } from "../../util/worktree.ts";

export async function command(
  denops: Denops,
  mods: string,
  args: string[],
): Promise<buffer.OpenResult> {
  const [opts, residue] = parseOpts(await normCmdArgs(denops, args));
  validateOpts(opts, [
    "processor",
    "worktree",
    "monochrome",
    "opener",
    ...builtinOpts,
  ]);
  return exec(denops, residue, {
    processor: opts.processor?.split(" "),
    worktree: opts.worktree,
    monochrome: unnullish(opts.monochrome, () => true),
    opener: opts.opener,
    cmdarg: formatOpts(opts, builtinOpts).join(" "),
    mods,
  });
}

export type ExecOptions = {
  processor?: string[];
  worktree?: string;
  monochrome?: boolean;
  opener?: string;
  cmdarg?: string;
  mods?: string;
};

export async function exec(
  denops: Denops,
  args: string[],
  options: ExecOptions,
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
      monochrome: unnullish(options.monochrome, () => ""),
    },
    fragment: `${args.join(" ")}$`,
  });
  return await buffer.open(denops, bufname, {
    opener: options.opener,
    cmdarg: options.cmdarg,
    mods: options.mods,
  });
}
