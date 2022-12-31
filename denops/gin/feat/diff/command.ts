import type { Denops } from "https://deno.land/x/denops_std@v3.12.1/mod.ts";
import * as path from "https://deno.land/std@0.170.0/path/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.1.0/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v1.0.0/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.12.1/buffer/mod.ts";
import * as option from "https://deno.land/x/denops_std@v3.12.1/option/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.12.1/variable/mod.ts";
import {
  format as formatBufname,
} from "https://deno.land/x/denops_std@v3.12.1/bufname/mod.ts";
import {
  builtinOpts,
  Flags,
  formatOpts,
  parse,
  validateFlags,
  validateOpts,
} from "https://deno.land/x/denops_std@v3.12.1/argument/mod.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { findWorktreeFromDenops } from "../../util/worktree.ts";

const allowedFlags = [
  "R",
  "b",
  "w",
  "I",
  "cached",
  "staged",
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
      "gin_diff_default_args",
      [],
    );
    unknownutil.assertArray(defaultArgs, unknownutil.isString);
    args = [...defaultArgs, ...args];
  }
  const [opts, flags, residue] = parse(await normCmdArgs(denops, args));
  validateOpts(opts, [
    "processor",
    "worktree",
    "opener",
    ...builtinOpts,
  ]);
  validateFlags(flags, allowedFlags);
  const [commitish, paths] = parseResidue(residue);
  await exec(denops, {
    processor: opts.processor?.split(" "),
    worktree: opts.worktree,
    commitish,
    paths,
    flags,
    opener: opts.opener,
    cmdarg: formatOpts(opts, builtinOpts).join(" "),
    mods,
  });
}

export type ExecOptions = {
  processor?: string[];
  worktree?: string;
  commitish?: string;
  paths?: string[];
  flags?: Flags;
  opener?: string;
  cmdarg?: string;
  mods?: string;
};

export async function exec(
  denops: Denops,
  options: ExecOptions,
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
    fragment: unnullish(paths, (v) => `${JSON.stringify(v)}$`),
  });
  return await buffer.open(denops, bufname, {
    opener: options.opener,
    cmdarg: options.cmdarg,
    mods: options.mods,
  });
}

function parseResidue(residue: string[]): [string | undefined, string[]] {
  const index = residue.indexOf("--");
  const head = index === -1 ? residue : residue.slice(0, index);
  const tail = index === -1 ? [] : residue.slice(index + 1);
  // GinDiff [{options}]
  // GinDiff [{options}] {commitish}
  // GinDiff [{options}] -- {path}...
  // GinDiff [{options}] {commitish} -- {path}...
  switch (head.length) {
    case 0:
      return [undefined, tail];
    case 1:
      return [head[0], tail];
    default:
      throw new Error("Invalid number of arguments");
  }
}
