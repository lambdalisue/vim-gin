import type { Denops } from "https://deno.land/x/denops_std@v3.8.1/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v0.2.0/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.8.1/buffer/mod.ts";
import * as option from "https://deno.land/x/denops_std@v3.8.1/option/mod.ts";
import {
  format as formatBufname,
} from "https://deno.land/x/denops_std@v3.8.1/bufname/mod.ts";
import {
  builtinOpts,
  formatOpts,
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v3.8.1/argument/mod.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { findWorktreeFromDenops } from "../../util/worktree.ts";

export async function command(
  denops: Denops,
  mods: string,
  args: string[],
): Promise<buffer.OpenResult> {
  const [opts, residue] = parseOpts(await normCmdArgs(denops, args));
  validateOpts(opts, [
    "worktree",
    "monochrome",
    ...builtinOpts,
  ]);
  return exec(denops, residue, {
    worktree: opts.worktree,
    monochrome: unnullish(opts.monochrome, () => true),
    cmdarg: formatOpts(opts, builtinOpts).join(" "),
    mods,
  });
}

export type ExecOptions = {
  worktree?: string;
  monochrome?: boolean;
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
      monochrome: unnullish(options.monochrome, () => ""),
    },
    fragment: `${args.join(" ")}$`,
  });
  return await buffer.open(denops, bufname, {
    cmdarg: options.cmdarg,
    mods: options.mods,
  });
}
