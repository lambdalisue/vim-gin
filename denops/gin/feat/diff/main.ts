import type { Denops } from "https://deno.land/x/denops_std@v3.12.0/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.1.0/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v3.12.0/helper/mod.ts";
import { parseSilent } from "../../util/cmd.ts";
import { command } from "./command.ts";
import { edit } from "./edit.ts";
import { read } from "./read.ts";
import { jumpNew, jumpOld, jumpSmart } from "./jump.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "diff:command": (bang, mods, args) => {
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
    "diff:edit": (bufnr, bufname) => {
      unknownutil.assertNumber(bufnr);
      unknownutil.assertString(bufname);
      return helper.friendlyCall(denops, () => edit(denops, bufnr, bufname));
    },
    "diff:read": (bufnr, bufname) => {
      unknownutil.assertNumber(bufnr);
      unknownutil.assertString(bufname);
      return helper.friendlyCall(denops, () => read(denops, bufnr, bufname));
    },
    "diff:jump:new": (mods) => {
      if (mods) {
        unknownutil.assertString(mods);
      } else {
        unknownutil.assertUndefined(mods);
      }
      return helper.friendlyCall(denops, () => jumpNew(denops, mods ?? ""));
    },
    "diff:jump:old": (mods) => {
      if (mods) {
        unknownutil.assertString(mods);
      } else {
        unknownutil.assertUndefined(mods);
      }
      return helper.friendlyCall(denops, () => jumpOld(denops, mods ?? ""));
    },
    "diff:jump:smart": (mods) => {
      if (mods) {
        unknownutil.assertString(mods);
      } else {
        unknownutil.assertUndefined(mods);
      }
      return helper.friendlyCall(denops, () => jumpSmart(denops, mods ?? ""));
    },
  };
}
