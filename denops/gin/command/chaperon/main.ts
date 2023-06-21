import type { Denops } from "https://deno.land/x/denops_std@v5.0.1/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v5.0.1/variable/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v5.0.1/helper/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.0.0/mod.ts#^";
import {
  builtinOpts,
  formatOpts,
  parse,
  validateOpts,
} from "https://deno.land/x/denops_std@v5.0.1/argument/mod.ts";
import {
  normCmdArgs,
  parseDisableDefaultArgs,
  parseSilent,
} from "../../util/cmd.ts";
import { exec } from "./command.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "chaperon:command": (bang, mods, args) => {
      assert(bang, is.String);
      assert(mods, is.String);
      assert(args, is.ArrayOf(is.String));
      const [disableDefaultArgs, realArgs] = parseDisableDefaultArgs(args);
      const silent = parseSilent(mods);
      return helper.ensureSilent(denops, silent, () => {
        return helper.friendlyCall(
          denops,
          () =>
            command(denops, bang, mods, realArgs, {
              disableDefaultArgs,
            }),
        );
      });
    },
  };
}

type CommandOptions = {
  disableDefaultArgs?: boolean;
};

async function command(
  denops: Denops,
  bang: string,
  mods: string,
  args: string[],
  options: CommandOptions = {},
): Promise<void> {
  if (!options.disableDefaultArgs) {
    const defaultArgs = await vars.g.get(
      denops,
      "gin_chaperon_default_args",
      [],
    );
    assert(defaultArgs, is.ArrayOf(is.String));
    args = [...defaultArgs, ...args];
  }
  const [opts, _, residue] = parse(await normCmdArgs(denops, args));
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
