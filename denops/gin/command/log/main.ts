import type { Denops } from "jsr:@denops/std@^7.0.0";
import { assert, is } from "jsr:@core/unknownutil@^4.0.0";
import { unnullish } from "jsr:@lambdalisue/unnullish@^1.0.0";
import * as helper from "jsr:@denops/std@^7.0.0/helper";
import {
  builtinOpts,
  formatOpts,
  parse,
  validateOpts,
} from "jsr:@denops/std@^7.0.0/argument";
import { fillCmdArgs, normCmdArgs, parseSilent } from "../../util/cmd.ts";
import { exec } from "./command.ts";
import { edit } from "./edit.ts";
import { read } from "./read.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "log:command": (bang, mods, args) => {
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
    "log:edit": (bufnr, bufname) => {
      assert(bufnr, is.Number, { name: "bufnr" });
      assert(bufname, is.String, { name: "bufname" });
      return helper.friendlyCall(denops, () => edit(denops, bufnr, bufname));
    },
    "log:read": (bufnr, bufname) => {
      assert(bufnr, is.Number, { name: "bufnr" });
      assert(bufname, is.String, { name: "bufname" });
      return helper.friendlyCall(denops, () => read(denops, bufnr, bufname));
    },
  };
}

async function command(
  denops: Denops,
  bang: string,
  mods: string,
  args: string[],
): Promise<void> {
  args = await fillCmdArgs(denops, args, "log");
  args = await normCmdArgs(denops, args);

  const [opts, flags, residue] = parse(args);
  validateOpts(opts, [
    "worktree",
    "opener",
    "emojify",
    ...builtinOpts,
  ]);

  const [commitish, paths] = parseResidue(residue);
  await exec(denops, {
    worktree: opts.worktree,
    commitish,
    paths,
    flags,
    opener: opts.opener,
    emojify: unnullish(opts.emojify, () => true),
    cmdarg: formatOpts(opts, builtinOpts).join(" "),
    mods,
    bang: bang === "!",
  });
}

function parseResidue(residue: string[]): [string | undefined, string[]] {
  const index = residue.indexOf("--");
  const head = index === -1 ? residue : residue.slice(0, index);
  const tail = index === -1 ? [] : residue.slice(index + 1);
  // GinLog [{options}]
  // GinLog [{options}] {commitish}
  // GinLog [{options}] -- {pathspec}...
  // GinLog [{options}] {commitish} -- {pathspec}...
  switch (head.length) {
    case 0:
      return [undefined, tail];
    case 1:
      return [head[0], tail];
    default:
      throw new Error("Invalid number of arguments");
  }
}
