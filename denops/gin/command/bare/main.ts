import type { Denops } from "https://deno.land/x/denops_std@v5.0.0/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.1.1/mod.ts#^";
import * as helper from "https://deno.land/x/denops_std@v5.0.0/helper/mod.ts";
import {
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v5.0.0/argument/opts.ts";
import { normCmdArgs, parseSilent } from "../../util/cmd.ts";
import { exec } from "./command.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "command": (mods, args) => {
      unknownutil.assertString(mods);
      unknownutil.assertArray(args, unknownutil.isString);
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
