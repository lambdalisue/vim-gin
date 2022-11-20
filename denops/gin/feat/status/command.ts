import type { Denops } from "https://deno.land/x/denops_std@v3.9.2/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v1.0.0/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.1.0/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.9.2/buffer/mod.ts";
import * as option from "https://deno.land/x/denops_std@v3.9.2/option/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.9.2/variable/mod.ts";
import {
  format as formatBufname,
} from "https://deno.land/x/denops_std@v3.9.2/bufname/mod.ts";
import {
  builtinOpts,
  Flags,
  formatOpts,
  parse,
  validateFlags,
  validateOpts,
} from "https://deno.land/x/denops_std@v3.9.2/argument/mod.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { findWorktreeFromDenops } from "../../util/worktree.ts";

const allowedFlags = [
  "u",
  "untracked-files",
  "ignore-submodules",
  "ignored",
  "renames",
  "no-renames",
  "find-renames",
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
      "gin_status_default_args",
      [],
    );
    unknownutil.assertArray(defaultArgs, unknownutil.isString);
    args = [...defaultArgs, ...args];
  }
  const [opts, flags, residue] = parse(await normCmdArgs(denops, args));
  validateOpts(opts, [
    "worktree",
    "opener",
    ...builtinOpts,
  ]);
  validateFlags(flags, allowedFlags);
  await exec(denops, {
    worktree: opts.worktree,
    pathspecs: residue,
    flags,
    opener: opts.opener,
    cmdarg: formatOpts(opts, builtinOpts).join(" "),
    mods,
  });
}

export type ExecOptions = {
  worktree?: string;
  pathspecs?: string[];
  flags?: Flags;
  opener?: string;
  cmdarg?: string;
  mods?: string;
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
    scheme: "ginstatus",
    expr: worktree,
    params: {
      "untracked-files": "",
      ...options.flags ?? {},
    },
    fragment: unnullish(options.pathspecs, (v) => `${JSON.stringify(v)}$`),
  });
  return await buffer.open(denops, bufname, {
    opener: options.opener,
    cmdarg: options.cmdarg,
    mods: options.mods,
  });
}
