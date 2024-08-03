import type { Denops } from "jsr:@denops/std@^7.0.0";
import { as, assert, is } from "jsr:@core/unknownutil@^4.0.0";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import { expand } from "./expand.ts";
import { findWorktreeFromDenops } from "../git/worktree.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "util:reload": (bufnr) => {
      assert(bufnr, is.Number, { name: "bufnr" });
      return buffer.reload(denops, bufnr);
    },

    "util:expand": (expr) => {
      assert(expr, is.String, { name: "expr" });
      return expand(denops, expr);
    },

    "util:worktree": (worktree) => {
      assert(worktree, as.Optional(is.String), {
        name: "worktree",
      });
      return findWorktreeFromDenops(denops, { worktree });
    },
  };
}
