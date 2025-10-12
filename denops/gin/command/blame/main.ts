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
import { exec } from "./command.ts";
import {
  edit,
  editNav,
  navigateHistory,
  switchToCommit,
  updateDetail,
} from "./edit.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "blame:command": (bang, mods, args) => {
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
    "blame:edit": (bufnr, bufname) => {
      assert(bufnr, is.Number, { name: "bufnr" });
      assert(bufname, is.String, { name: "bufname" });
      return helper.friendlyCall(denops, () => edit(denops, bufnr, bufname));
    },
    "blame:edit:nav": (bufnr, bufname) => {
      assert(bufnr, is.Number, { name: "bufnr" });
      assert(bufname, is.String, { name: "bufname" });
      //return helper.friendlyCall(denops, () => editNav(denops, bufnr, bufname));
      return editNav(denops, bufnr, bufname);
    },
    "blame:switch_to_commit": () => {
      return helper.friendlyCall(denops, () => switchToCommit(denops));
    },
    "blame:navigate_history": (direction) => {
      assert(direction, is.String, { name: "direction" });
      if (direction !== "older" && direction !== "newer") {
        throw new Error(`Invalid direction: ${direction}`);
      }
      return helper.friendlyCall(
        denops,
        () => navigateHistory(denops, direction as "older" | "newer"),
      );
    },
    "blame:update_detail": () => {
      return updateDetail(denops);
    },
  };
}

async function command(
  denops: Denops,
  bang: string,
  mods: string,
  args: string[],
): Promise<void> {
  args = await fillCmdArgs(denops, args, "edit");
  args = await normCmdArgs(denops, args);

  const [opts, residue] = parseOpts(args);
  validateOpts(opts, [
    "worktree",
    "opener",
    "emojify",
    ...builtinOpts,
  ]);
  const [commitish, filename] = parseResidue(residue);
  await exec(denops, filename, {
    worktree: opts.worktree,
    commitish,
    emojify: "emojify" in opts,
    opener: opts.opener,
    cmdarg: formatOpts(opts, builtinOpts).join(" "),
    mods,
    bang: bang === "!",
  });
}

function parseResidue(
  residue: string[],
): [string | undefined, string] {
  // GinBlame [{options}] {path}
  // GinBlame [{options}] {commitish} {path}
  switch (residue.length) {
    case 1:
      return [undefined, residue[0]];
    case 2:
      return [residue[0], residue[1]];
    default:
      throw new Error("Invalid number of arguments");
  }
}
