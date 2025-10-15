import type { Denops } from "jsr:@denops/std@^7.0.0";
import { unnullish } from "jsr:@lambdalisue/unnullish@^1.0.0";
import { assert, ensure, is } from "jsr:@core/unknownutil@^4.0.0";
import * as helper from "jsr:@denops/std@^7.0.0/helper";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import { parse as parseBufname } from "jsr:@denops/std@^7.0.0/bufname";
import {
  builtinOpts,
  formatOpts,
  parseOpts,
  validateOpts,
} from "jsr:@denops/std@^7.0.0/argument";

import { normCmdArgs, parseSilent } from "../../util/cmd.ts";
import { exec } from "./command.ts";
import { edit } from "./edit.ts";
import { read } from "./read.ts";
import { main as mainDiffJump } from "../../feat/diffjump/main.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "buffer:command": (bang, mods, args) => {
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
    "buffer:edit": (bufnr, bufname) => {
      assert(bufnr, is.Number, { name: "bufnr" });
      assert(bufname, is.String, { name: "bufname" });
      return helper.friendlyCall(
        denops,
        () => edit(denops, bufnr, bufname),
      );
    },
    "buffer:read": (bufnr, bufname) => {
      assert(bufnr, is.Number, { name: "bufnr" });
      assert(bufname, is.String, { name: "bufname" });
      return helper.friendlyCall(
        denops,
        () => read(denops, bufnr, bufname),
      );
    },
  };
  mainDiffJump(denops, "buffer", {
    commitishMap: {
      old: async ({ bufnr }) => {
        const bufname = await fn.bufname(denops, bufnr);
        const { params } = parseBufname(bufname);
        const jumpCommitish = params?.diffjump;
        if (jumpCommitish === undefined) {
          return "HEAD^";
        }
        const commitish = ensure(
          jumpCommitish || "HEAD",
          is.String,
          { message: "jump must be string" },
        );
        return `${commitish}^`;
      },
      new: async ({ bufnr }) => {
        const bufname = await fn.bufname(denops, bufnr);
        const { params } = parseBufname(bufname);
        const jumpCommitish = params?.diffjump;
        if (jumpCommitish === undefined) {
          return "HEAD";
        }
        const commitish = ensure(
          jumpCommitish || "HEAD",
          is.String,
          { message: "jump must be string" },
        );
        return commitish;
      },
    },
  });
}

async function command(
  denops: Denops,
  bang: string,
  mods: string,
  args: string[],
): Promise<buffer.OpenResult> {
  const [opts, residue] = parseOpts(await normCmdArgs(denops, args));
  validateOpts(opts, [
    "processor",
    "worktree",
    "monochrome",
    "opener",
    "emojify",
    "diffjump",
    "filetype",
    ...builtinOpts,
  ]);
  return exec(denops, residue, {
    processor: opts.processor?.split(" "),
    worktree: opts.worktree,
    monochrome: unnullish(opts.monochrome, () => true),
    opener: opts.opener,
    emojify: unnullish(opts.emojify, () => true),
    diffjump: opts.diffjump,
    filetype: opts.filetype,
    cmdarg: formatOpts(opts, builtinOpts).join(" "),
    mods,
    bang: bang === "!",
  });
}
