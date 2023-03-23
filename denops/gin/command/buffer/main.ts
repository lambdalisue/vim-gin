import type { Denops } from "https://deno.land/x/denops_std@v4.1.0/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v1.0.0/unnullish.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.1.0/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v4.1.0/helper/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v4.1.0/buffer/mod.ts";
import {
  builtinOpts,
  formatOpts,
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v4.1.0/argument/opts.ts";

import { normCmdArgs, parseSilent } from "../../util/cmd.ts";
import { exec } from "./command.ts";
import { edit } from "./edit.ts";
import { read } from "./read.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "buffer:command": (bang, mods, args) => {
      unknownutil.assertString(bang);
      unknownutil.assertString(mods);
      unknownutil.assertArray(args, unknownutil.isString);
      const silent = parseSilent(mods);
      return helper.ensureSilent(denops, silent, () => {
        return helper.friendlyCall(
          denops,
          () => command(denops, bang, mods, args),
        );
      });
    },
    "buffer:edit": (bufnr, bufname) => {
      unknownutil.assertNumber(bufnr);
      unknownutil.assertString(bufname);
      return helper.friendlyCall(
        denops,
        () => edit(denops, bufnr, bufname),
      );
    },
    "buffer:read": (bufnr, bufname) => {
      unknownutil.assertNumber(bufnr);
      unknownutil.assertString(bufname);
      return helper.friendlyCall(
        denops,
        () => read(denops, bufnr, bufname),
      );
    },
  };
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
    ...builtinOpts,
  ]);
  return exec(denops, residue, {
    processor: opts.processor?.split(" "),
    worktree: opts.worktree,
    monochrome: unnullish(opts.monochrome, () => true),
    opener: opts.opener,
    cmdarg: formatOpts(opts, builtinOpts).join(" "),
    mods,
    bang: bang === "!",
  });
}
