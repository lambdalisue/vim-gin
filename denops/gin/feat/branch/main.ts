import type { Denops } from "https://deno.land/x/denops_std@v3.9.0/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v3.9.0/helper/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import { parseSilent } from "../../util/cmd.ts";
import { command } from "./command.ts";
import { edit } from "./edit.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "branch:command": (bang, mods, args) => {
      unknownutil.assertString(bang);
      unknownutil.assertString(mods);
      unknownutil.assertArray(args, unknownutil.isString);
      const silent = parseSilent(mods);
      return helper.ensureSilent(denops, silent, () => {
        return helper.friendlyCall(denops, () =>
          command(denops, mods, args, {
            disableDefaultArgs: bang === "!",
          }));
      });
    },
    "branch:edit": (bufnr, bufname) => {
      unknownutil.assertNumber(bufnr);
      unknownutil.assertString(bufname);
      return helper.friendlyCall(denops, () => edit(denops, bufnr, bufname));
    },
  };
}
