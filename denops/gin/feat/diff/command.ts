import type { Denops } from "https://deno.land/x/denops_std@v3.8.1/mod.ts";
import * as path from "https://deno.land/std@0.151.0/path/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.8.1/buffer/mod.ts";
import * as option from "https://deno.land/x/denops_std@v3.8.1/option/mod.ts";
import {
  format as formatBufname,
} from "https://deno.land/x/denops_std@v3.8.1/bufname/mod.ts";
import {
  builtinOpts,
  Flags,
  formatOpts,
  parse,
  validateFlags,
  validateOpts,
} from "https://deno.land/x/denops_std@v3.8.1/argument/mod.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { findWorktreeFromDenops } from "../../util/worktree.ts";

const allowedFlags = [
  "R",
  "b",
  "w",
  "I",
  "cached",
  "renames",
  "diff-filter",
  "ignore-cr-at-eol",
  "ignore-space-at-eol",
  "ignore-space-change",
  "ignore-all-space",
  "ignore-blank-lines",
  "ignore-matching-lines",
  "ignore-submodules",
];

export async function command(
  denops: Denops,
  mods: string,
  args: string[],
): Promise<void> {
  const [opts, flags, residue] = parse(await normCmdArgs(denops, args));
  validateOpts(opts, [
    "worktree",
    ...builtinOpts,
  ]);
  validateFlags(flags, allowedFlags);
  const [commitish, abspath] = parseResidue(residue);
  await exec(denops, abspath, {
    worktree: opts.worktree,
    commitish,
    flags,
    cmdarg: formatOpts(opts, builtinOpts).join(" "),
    mods,
  });
}

export type ExecOptions = {
  worktree?: string;
  commitish?: string;
  flags?: Flags;
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
    scheme: "gindiff",
    expr: worktree,
    params: {
      ...options.flags ?? {},
      commitish: options.commitish,
    },
    fragment: relpath,
  });
  return await buffer.open(denops, bufname, {
    opener: options.opener,
    cmdarg: options.cmdarg,
    mods: options.mods,
  });
}

function parseResidue(residue: string[]): [string | undefined, string] {
  // GinDiff [{options}] [{commitish}] {path}
  switch (residue.length) {
    case 1:
      return [undefined, residue[0].toString()];
    case 2:
      return [residue[0].toString(), residue[1].toString()];
    default:
      throw new Error("Invalid number of arguments");
  }
}
