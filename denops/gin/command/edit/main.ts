import type { Denops } from "https://deno.land/x/denops_std@v5.0.0/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.1.1/mod.ts#^";
import * as vars from "https://deno.land/x/denops_std@v5.0.0/variable/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v5.0.0/helper/mod.ts";
import {
  builtinOpts,
  formatOpts,
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v5.0.0/argument/mod.ts";
import {
  normCmdArgs,
  parseDisableDefaultArgs,
  parseSilent,
} from "../../util/cmd.ts";
import { exec } from "./command.ts";
import { edit } from "./edit.ts";
import { read } from "./read.ts";
import { write } from "./write.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "edit:command": (bang, mods, args) => {
      unknownutil.assertString(bang);
      unknownutil.assertString(mods);
      unknownutil.assertArray(args, unknownutil.isString);
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
    "edit:edit": (bufnr, bufname) => {
      unknownutil.assertNumber(bufnr);
      unknownutil.assertString(bufname);
      return helper.friendlyCall(denops, () => edit(denops, bufnr, bufname));
    },
    "edit:read": (bufnr, bufname) => {
      unknownutil.assertNumber(bufnr);
      unknownutil.assertString(bufname);
      return helper.friendlyCall(denops, () => read(denops, bufnr, bufname));
    },
    "edit:write": (bufnr, bufname) => {
      unknownutil.assertNumber(bufnr);
      unknownutil.assertString(bufname);
      return helper.friendlyCall(denops, () => write(denops, bufnr, bufname));
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
    bang: bang === "!",
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
