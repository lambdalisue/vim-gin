import type { Denops } from "https://deno.land/x/denops_std@v3.7.1/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v3.7.1/helper/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import { parseSilent } from "../../util/cmd.ts";
import { command, read, write } from "./command.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "edit:command": (mods, ...args) => {
      unknownutil.assertString(mods);
      unknownutil.assertArray(args, unknownutil.isString);
      const silent = parseSilent(mods);
      return helper.ensureSilent(denops, silent, () => {
        return helper.friendlyCall(denops, () => command(denops, mods, args));
      });
    },
    "edit:read": (bufnr, bufname) => {
      unknownutil.assertNumber(bufnr);
      unknownutil.assertString(bufname);
      return read(denops, bufnr, bufname);
    },
    "edit:write": (bufnr, bufname) => {
      unknownutil.assertNumber(bufnr);
      unknownutil.assertString(bufname);
      return write(denops, bufnr, bufname);
    },
  };
}
