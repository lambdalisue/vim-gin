import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as helper from "jsr:@denops/std@^7.0.0/helper";
import { assert, is } from "jsr:@core/unknownutil@^4.0.0";
import {
  builtinOpts,
  formatOpts,
  parseOpts,
  validateOpts,
} from "jsr:@denops/std@^7.0.0/argument";
import { fillCmdArgs, normCmdArgs, parseSilent } from "../../util/cmd.ts";
import { exec } from "./command.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "chaperon:command": (bang, mods, args) => {
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
  args = await fillCmdArgs(denops, args, "chaperon");
  args = await normCmdArgs(denops, args);

  const [opts, residue] = parseOpts(args);
  validateOpts(opts, [
    "worktree",
    "opener",
    "no-ours",
    "no-theirs",
    ...builtinOpts,
  ]);

  const [abspath] = parseResidue(residue);
  await exec(denops, abspath, {
    worktree: opts.worktree,
    opener: opts.opener,
    noOurs: "no-ours" in opts,
    noTheirs: "no-theirs" in opts,
    cmdarg: formatOpts(opts, builtinOpts).join(" "),
    mods,
    bang: bang === "!",
  });
}

function parseResidue(
  residue: string[],
): [string] {
  // GinChaperon [{options}] {path}
  switch (residue.length) {
    case 1:
      return [residue[0]];
    default:
      throw new Error("Invalid number of arguments");
  }
}
