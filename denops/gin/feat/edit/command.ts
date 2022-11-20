import type { Denops } from "https://deno.land/x/denops_std@v3.9.3/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.1.0/mod.ts";
import * as path from "https://deno.land/std@0.165.0/path/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.9.3/buffer/mod.ts";
import * as option from "https://deno.land/x/denops_std@v3.9.3/option/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.9.3/variable/mod.ts";
import {
  builtinOpts,
  formatOpts,
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v3.9.3/argument/mod.ts";
import {
  format as formatBufname,
} from "https://deno.land/x/denops_std@v3.9.3/bufname/mod.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { findWorktreeFromDenops } from "../../util/worktree.ts";

export type CommandOptions = {
  disableDefaultArgs?: boolean;
};

export async function command(
  denops: Denops,
  mods: string,
  args: string[],
  options: CommandOptions = {},
): Promise<void> {
  if (!options.disableDefaultArgs) {
    const defaultArgs = await vars.g.get(
      denops,
      "gin_edit_default_args",
      [],
    );
    unknownutil.assertArray(defaultArgs, unknownutil.isString);
    args = [...defaultArgs, ...args];
  }
  const [opts, residue] = parseOpts(await normCmdArgs(denops, args));
  validateOpts(opts, [
    "worktree",
    "opener",
    ...builtinOpts,
  ]);
  const [commitish, filename] = parseResidue(residue);
  await exec(denops, filename, {
    worktree: opts.worktree,
    commitish,
    opener: opts.opener,
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
