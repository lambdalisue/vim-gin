import type { Denops } from "jsr:@denops/std@^7.0.0";
import { assert, ensure, is } from "jsr:@core/unknownutil@^4.0.0";
import * as helper from "jsr:@denops/std@^7.0.0/helper";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import { parse as parseBufname } from "jsr:@denops/std@^7.0.0/bufname";
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
import { main as mainDiffJump } from "../../feat/diffjump/main.ts";
import { parseCommitish } from "./commitish.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "diff:command": (bang, mods, args) => {
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
    "diff:edit": (bufnr, bufname) => {
      assert(bufnr, is.Number, { name: "bufnr" });
      assert(bufname, is.String, { name: "bufname" });
      return helper.friendlyCall(denops, () => edit(denops, bufnr, bufname));
    },
    "diff:read": (bufnr, bufname) => {
      assert(bufnr, is.Number, { name: "bufnr" });
      assert(bufname, is.String, { name: "bufname" });
      return helper.friendlyCall(denops, () => read(denops, bufnr, bufname));
    },
  };
  mainDiffJump(denops, "diff", {
    commitishMap: {
      old: async ({ bufnr }) => {
        const bufname = await fn.bufname(denops, bufnr);
        const { params } = parseBufname(bufname);
        const cached = "cached" in (params ?? {});
        const commitish = ensure(
          params?.commitish ?? "",
          is.String,
          { message: "commitish must be string" },
        );
        const [oldCommitish, _] = parseCommitish(commitish, cached);
        return oldCommitish;
      },
      new: async ({ bufnr }) => {
        const bufname = await fn.bufname(denops, bufnr);
        const { params } = parseBufname(bufname);
        const cached = "cached" in (params ?? {});
        const commitish = ensure(
          params?.commitish ?? "",
          is.String,
          { message: "commitish must be string" },
        );
        const [_, newCommitish] = parseCommitish(commitish, cached);
        return newCommitish;
      },
    },
  });
}

async function command(
  denops: Denops,
  bang: string,
  mods: string,
  args: string[],
): Promise<void> {
  args = await fillCmdArgs(denops, args, "diff");
  args = await normCmdArgs(denops, args);

  const [opts, flags, residue] = parse(args);
  validateOpts(opts, [
    "processor",
    "worktree",
    "opener",
    ...builtinOpts,
  ]);
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
