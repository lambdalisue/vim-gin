import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as helper from "jsr:@denops/std@^7.0.0/helper";
import { assert, is } from "jsr:@core/unknownutil@^4.0.0";
import { type CommitishMap, jumpNew, jumpOld, jumpSmart } from "./jump.ts";

export type InitOptions = {
  commitishMap?: CommitishMap;
};

const isStringOrUndefined = is.UnionOf([is.String, is.Undefined]);

export function main(
  denops: Denops,
  namespace: string,
  options: InitOptions = {},
): void {
  const commitishMap = options.commitishMap ?? {
    old: "HEAD^",
    new: "HEAD",
  };

  denops.dispatcher = {
    ...denops.dispatcher,
    [`${namespace}:diffjump:old`]: (mods) => {
      assert(mods, isStringOrUndefined);
      return helper.friendlyCall(
        denops,
        () => jumpOld(denops, commitishMap.old, mods ?? ""),
      );
    },
    [`${namespace}:diffjump:new`]: (mods) => {
      assert(mods, isStringOrUndefined);
      return helper.friendlyCall(
        denops,
        () => jumpNew(denops, commitishMap.new, mods ?? ""),
      );
    },
    [`${namespace}:diffjump:smart`]: (mods) => {
      assert(mods, isStringOrUndefined);
      return helper.friendlyCall(
        denops,
        () => jumpSmart(denops, commitishMap, mods ?? ""),
      );
    },
  };
}
