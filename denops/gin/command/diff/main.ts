import type { Denops } from "https://deno.land/x/denops_std@v5.0.0/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.1.1/mod.ts#^";
import * as helper from "https://deno.land/x/denops_std@v5.0.0/helper/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v5.0.0/variable/mod.ts";
import {
  builtinOpts,
  formatOpts,
  parse,
  validateFlags,
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
import { jumpNew, jumpOld, jumpSmart } from "./jump.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "diff:command": (bang, mods, args) => {
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
    "diff:edit": (bufnr, bufname) => {
      unknownutil.assertNumber(bufnr);
      unknownutil.assertString(bufname);
      return helper.friendlyCall(denops, () => edit(denops, bufnr, bufname));
    },
    "diff:read": (bufnr, bufname) => {
      unknownutil.assertNumber(bufnr);
      unknownutil.assertString(bufname);
      return helper.friendlyCall(denops, () => read(denops, bufnr, bufname));
    },
    "diff:jump:new": (mods) => {
      if (mods) {
        unknownutil.assertString(mods);
      } else {
        unknownutil.assertUndefined(mods);
      }
      return helper.friendlyCall(denops, () => jumpNew(denops, mods ?? ""));
    },
    "diff:jump:old": (mods) => {
      if (mods) {
        unknownutil.assertString(mods);
      } else {
        unknownutil.assertUndefined(mods);
      }
      return helper.friendlyCall(denops, () => jumpOld(denops, mods ?? ""));
    },
    "diff:jump:smart": (mods) => {
      if (mods) {
        unknownutil.assertString(mods);
      } else {
        unknownutil.assertUndefined(mods);
      }
      return helper.friendlyCall(denops, () => jumpSmart(denops, mods ?? ""));
    },
  };
}

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
    bang: bang === "!",
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
