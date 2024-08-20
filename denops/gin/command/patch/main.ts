import type { Denops } from "jsr:@denops/std@^7.0.0";
import { assert, is } from "jsr:@core/unknownutil@^4.0.0";
import * as helper from "jsr:@denops/std@^7.0.0/helper";
import {
  builtinOpts,
  formatOpts,
  parseOpts,
  validateOpts,
} from "jsr:@denops/std@^7.0.0/argument";
import { fillCmdArgs, normCmdArgs, parseSilent } from "../../util/cmd.ts";
import { ensurePath } from "../../util/ensure_path.ts";
import { exec } from "./command.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "patch:command": (bang, mods, args) => {
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
  };
}

async function command(
  denops: Denops,
  bang: string,
  mods: string,
  args: string[],
): Promise<void> {
  args = await fillCmdArgs(denops, args, "patch");
  args = await normCmdArgs(denops, args);

  const [opts, residue] = parseOpts(args);
  validateOpts(opts, [
    "worktree",
    "opener",
    "no-head",
    "no-worktree",
    ...builtinOpts,
  ]);

  const [rawpath] = parseResidue(residue);
  await exec(denops, await ensurePath(denops, rawpath), {
    worktree: opts.worktree,
    noHead: "no-head" in opts,
    noWorktree: "no-worktree" in opts,
    opener: opts.opener,
    cmdarg: formatOpts(opts, builtinOpts).join(" "),
    mods,
    bang: bang === "!",
  });
}

function parseResidue(
  residue: string[],
): [string | undefined] {
  switch (residue.length) {
    // GinPatch [{options}]
    case 0:
      return [undefined];
    // GinPatch [{options}] {path}
    case 1:
      return [residue[0]];
    default:
      throw new Error("Invalid number of arguments");
  }
}
