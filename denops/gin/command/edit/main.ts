import type { Denops } from "https://deno.land/x/denops_std@v5.0.1/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.9.0/mod.ts#^";
import * as vars from "https://deno.land/x/denops_std@v5.0.1/variable/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v5.0.1/helper/mod.ts";
import {
  builtinOpts,
  formatOpts,
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v5.0.1/argument/mod.ts";
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
      assert(bang, is.String, { message: "bang must be string" });
      assert(mods, is.String, { message: "mods must be string" });
      assert(args, is.ArrayOf(is.String), { message: "args must be string[]" });
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
      assert(bufnr, is.Number, { message: "bufnr must be number" });
      assert(bufname, is.String, { message: "bufname must be string" });
      return helper.friendlyCall(denops, () => edit(denops, bufnr, bufname));
    },
    "edit:read": (bufnr, bufname) => {
      assert(bufnr, is.Number, { message: "bufnr must be number" });
      assert(bufname, is.String, { message: "bufname must be string" });
      return helper.friendlyCall(denops, () => read(denops, bufnr, bufname));
    },
    "edit:write": (bufnr, bufname) => {
      assert(bufnr, is.Number, { message: "bufnr must be number" });
      assert(bufname, is.String, { message: "bufname must be string" });
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
    assert(defaultArgs, is.ArrayOf(is.String), {
      message: "g:gin_edit_default_args must be string[]",
    });
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
