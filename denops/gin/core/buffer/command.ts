import type { Denops } from "https://deno.land/x/denops_std@v3.7.1/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v0.1.0/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.7.1/buffer/mod.ts";
import {
  builtinOpts,
  formatOpts,
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v3.7.1/argument/mod.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { format } from "../buffer.ts";

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
    monochrome: unnullish(opts.monochrome, () => true) ?? undefined,
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
  const bufname = await format(denops, "gin", args, {
    worktree: options.worktree,
    monochrome: options.monochrome,
  });
  return await buffer.open(denops, bufname, {
    cmdarg: options.cmdarg,
    mods: options.mods,
  });
}
