import type { Denops } from "jsr:@denops/std@^7.0.0";
import { assert, is } from "jsr:@core/unknownutil@^4.0.0";
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
import * as action from "./action.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "tree:command": (bang, mods, args) => {
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
    "tree:edit": (bufnr, bufname) => {
      assert(bufnr, is.Number, { name: "bufnr" });
      assert(bufname, is.String, { name: "bufname" });
      return helper.friendlyCall(denops, () => edit(denops, bufnr, bufname));
    },
    "tree:action:expand": (bufnr, range) => {
      assert(bufnr, is.Number, { name: "bufnr" });
      assert(range, is.TupleOf([is.Number, is.Number]), { name: "range" });
      return helper.friendlyCall(denops, () => action.expand(denops, bufnr, range));
    },
    "tree:action:collapse": (bufnr, range) => {
      assert(bufnr, is.Number, { name: "bufnr" });
      assert(range, is.TupleOf([is.Number, is.Number]), { name: "range" });
      return helper.friendlyCall(denops, () => action.collapse(denops, bufnr, range));
    },
    "tree:action:expandOrEdit": (bufnr, range) => {
      assert(bufnr, is.Number, { name: "bufnr" });
      assert(range, is.TupleOf([is.Number, is.Number]), { name: "range" });
      return helper.friendlyCall(denops, () => action.expandOrEdit(denops, bufnr, range));
    },
  };
}

async function command(
  denops: Denops,
  bang: string,
  mods: string,
  args: string[],
): Promise<void> {
  args = await fillCmdArgs(denops, args, "tree");
  args = await normCmdArgs(denops, args);

  const [opts, flags, residue] = parse(args);
  validateOpts(opts, [
    "worktree",
    "opener",
    ...builtinOpts,
  ]);

  const commitish = parseResidue(residue);
  await exec(denops, {
    worktree: opts.worktree,
    commitish,
    flags,
    opener: opts.opener,
    cmdarg: formatOpts(opts, builtinOpts).join(" "),
    mods,
    bang: bang === "!",
  });
}

function parseResidue(residue: string[]): string | undefined {
  // GinTree [{options}]
  // GinTree [{options}] {commitish}
  switch (residue.length) {
    case 0:
      return undefined;
    case 1:
      return residue[0];
    default:
      throw new Error("Invalid number of arguments");
  }
}