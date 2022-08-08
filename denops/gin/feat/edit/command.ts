import type { Denops } from "https://deno.land/x/denops_std@v3.8.1/mod.ts";
import * as path from "https://deno.land/std@0.151.0/path/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.8.1/buffer/mod.ts";
import * as option from "https://deno.land/x/denops_std@v3.8.1/option/mod.ts";
import {
  builtinOpts,
  formatOpts,
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v3.8.1/argument/mod.ts";
import {
  format as formatBufname,
} from "https://deno.land/x/denops_std@v3.8.1/bufname/mod.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { findWorktreeFromDenops } from "../../util/worktree.ts";

export async function command(
  denops: Denops,
  mods: string,
  args: string[],
): Promise<void> {
  const [opts, residue] = parseOpts(await normCmdArgs(denops, args));
  validateOpts(opts, [
    "worktree",
    ...builtinOpts,
  ]);
  const [commitish, filename] = parseResidue(residue);
  await exec(denops, filename, {
    worktree: opts.worktree,
    commitish,
    cmdarg: formatOpts(opts, builtinOpts).join(" "),
    mods,
  });
}

export type ExecOptions = {
  worktree?: string;
  commitish?: string;
  opener?: string;
  cmdarg?: string;
  mods?: string;
};

export async function exec(
  denops: Denops,
  filename: string,
  options: ExecOptions,
): Promise<buffer.OpenResult> {
  const verbose = await option.verbose.get(denops);

  const worktree = await findWorktreeFromDenops(denops, {
    worktree: options.worktree,
    verbose: !!verbose,
  });

  const relpath = path.relative(worktree, filename);

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
  });
}

function parseResidue(
  residue: string[],
): [string | undefined, string] {
  // GinEdit [{options}] {path}
  // GinEdit [{options}] {commitish} {path}
  switch (residue.length) {
    case 1:
      return [undefined, residue[0]];
    case 2:
      return [residue[0], residue[1]];
    default:
      throw new Error("Invalid number of arguments");
  }
}
