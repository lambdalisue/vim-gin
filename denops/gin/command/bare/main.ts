import type { Denops } from "https://deno.land/x/denops_std@v5.0.1/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.0.0/mod.ts#^";
import * as helper from "https://deno.land/x/denops_std@v5.0.1/helper/mod.ts";
import {
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v5.0.1/argument/opts.ts";
import { normCmdArgs, parseSilent } from "../../util/cmd.ts";
import { exec } from "./command.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "command": (mods, args) => {
      assert(mods, is.String, { message: "mods must be string" });
      assert(args, is.ArrayOf(is.String), { message: "args must be string[]" });
      const silent = parseSilent(mods);
      return helper.ensureSilent(denops, silent, () => {
        return helper.friendlyCall(denops, () => command(denops, args));
      });
    },
  };
}

async function command(denops: Denops, args: string[]): Promise<void> {
  const [opts, residue] = parseOpts(await normCmdArgs(denops, args));
  validateOpts(opts, [
    "worktree",
    "enc",
    "encoding",
    "ff",
    "fileformat",
  ]);
  await exec(denops, residue, {
    worktree: opts.worktree,
    encoding: opts.enc ?? opts.encoding,
    fileformat: opts.ff ?? opts.fileformat,
  });
}
