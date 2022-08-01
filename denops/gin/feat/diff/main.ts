import type { Denops } from "https://deno.land/x/denops_std@v3.6.0/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v3.6.0/helper/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import { parseSilent } from "../../util/cmd.ts";
import { command, jumpNew, jumpOld, read } from "./command.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "diff:command": (mods, ...args) => {
      unknownutil.assertString(mods);
      unknownutil.assertArray(args, unknownutil.isString);
      const silent = parseSilent(mods);
      return helper.ensureSilent(denops, silent, () => {
        return helper.friendlyCall(denops, () => command(denops, mods, args));
      });
    },
    "diff:read": () => read(denops),
    "diff:jump:new": (mods) => {
      mods = mods ?? "";
      unknownutil.assertString(mods);
      return jumpNew(denops, mods);
    },
    "diff:jump:old": (mods) => {
      mods = mods ?? "";
      unknownutil.assertString(mods);
      return jumpOld(denops, mods);
    },
  };
}
