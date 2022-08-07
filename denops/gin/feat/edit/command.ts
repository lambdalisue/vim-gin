import type { Denops } from "https://deno.land/x/denops_std@v3.8.1/mod.ts";
import * as path from "https://deno.land/std@0.151.0/path/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v0.1.0/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.8.1/buffer/mod.ts";
import * as option from "https://deno.land/x/denops_std@v3.8.1/option/mod.ts";
import {
  builtinOpts,
  formatOpts,
  parse,
  validateFlags,
  validateOpts,
} from "https://deno.land/x/denops_std@v3.8.1/argument/mod.ts";
import {
  format as formatBufname,
} from "https://deno.land/x/denops_std@v3.8.1/bufname/mod.ts";
import { expand, normCmdArgs } from "../../util/cmd.ts";
import {
  findWorktreeFromSuspects,
  listWorktreeSuspectsFromDenops,
} from "../../util/worktree.ts";

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
  validateFlags(flags, [
    "cached",
  ]);
  const [commitish, abspath] = parseResidue(residue);
  await exec(denops, abspath, {
    worktree: opts.worktree,
    commitish,
    cached: "cached" in flags,
    cmdarg: formatOpts(opts, builtinOpts).join(" "),
    mods,
  });
}

export type ExecOptions = {
  worktree?: string;
  commitish?: string;
  cached?: boolean;
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

  const worktree = await findWorktreeFromSuspects(
    options.worktree
      ? [await expand(denops, options.worktree)]
      : await listWorktreeSuspectsFromDenops(denops, !!verbose),
    !!verbose,
  );

  const relpath = path.relative(worktree, filename);

  if (!options.commitish && !options.cached) {
    // worktree
    return await buffer.open(denops, path.join(worktree, relpath), {
      opener: options.opener,
      cmdarg: options.cmdarg,
      mods: options.mods,
    });
  } else {
    // commitish/cached
    const bufname = formatBufname({
      scheme: "ginedit",
      expr: worktree,
      params: {
        cached: unnullish(options.cached, () => "") ?? undefined,
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
}

function parseResidue(
  residue: string[],
): [string | undefined, string] {
  // GinEdit [{options}] {path}
  // GinEdit [{options}] --cached {path}
  // GinEdit [{options}] {commitish} {path}
  switch (residue.length) {
    case 1:
      return [undefined, residue[0].toString()];
    case 2:
      return [residue[0].toString(), residue[1].toString()];
    default:
      throw new Error("Invalid number of arguments");
  }
}
