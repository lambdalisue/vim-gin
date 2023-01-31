import type { Denops } from "https://deno.land/x/denops_std@v4.0.0/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.1.0/mod.ts";
import * as registry from "./registry.ts";
import * as action from "./action.ts";

const rangeRef: [number, number] = [0, 0];

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "action:list": (bufnr) => {
      unknownutil.assertNumber(bufnr);
      return action.list(denops, bufnr);
    },
    "action:call": (name, range) => {
      unknownutil.assertString(name);
      unknownutil.assertLike(rangeRef, range);
      return action.call(denops, name, range);
    },
    "action:gather_candidates": (bufnr, range) => {
      unknownutil.assertNumber(bufnr);
      unknownutil.assertLike(rangeRef, range);
      return registry.gatherCandidates(denops, bufnr, range);
    },
  };
}
