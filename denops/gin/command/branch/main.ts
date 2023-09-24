import type { Denops } from "https://deno.land/x/denops_std@v5.0.1/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v5.0.1/helper/mod.ts";
import {
  assert,
  ensure,
  is,
} from "https://deno.land/x/unknownutil@v3.9.0/mod.ts#^";
import * as vars from "https://deno.land/x/denops_std@v5.0.1/variable/mod.ts";
import {
  builtinOpts,
  formatOpts,
  parse,
  validateFlags,
  validateOpts,
} from "https://deno.land/x/denops_std@v5.0.1/argument/mod.ts";

import { normCmdArgs, parseSilent } from "../../util/cmd.ts";
import { exec } from "./command.ts";
import { edit } from "./edit.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "branch:command": (bang, mods, args) => {
      assert(bang, is.String, { name: "bang" });
      assert(mods, is.String, { name: "mods" });
      assert(args, is.ArrayOf(is.String), { name: "args" });
      const silent = parseSilent(mods);
      return helper.ensureSilent(denops, silent, () => {
        return helper.friendlyCall(
          denops,
          () => command(denops, bang, mods, args),
        );
      });
    },
    "branch:edit": (bufnr, bufname) => {
      assert(bufnr, is.Number, { name: "bufnr" });
      assert(bufname, is.String, { name: "bufname" });
      return helper.friendlyCall(denops, () => edit(denops, bufnr, bufname));
    },
  };
}

const allowedFlags = [
  "a",
  "all",
  "r",
  "remotes",
  "i",
  "ignore-case",
  "abbrev",
  "no-abbrev",
];

async function command(
  denops: Denops,
  bang: string,
  mods: string,
  args: string[],
): Promise<void> {
  if (args.length === 0) {
    args = ensure(
      await vars.g.get(denops, "gin_branch_default_args", []),
      is.ArrayOf(is.String),
      {
        name: "g:gin_branch_default_args",
      },
    );
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
    patterns: residue,
    flags,
    opener: opts.opener,
    cmdarg: formatOpts(opts, builtinOpts).join(" "),
    mods,
    bang: bang === "!",
  });
}
