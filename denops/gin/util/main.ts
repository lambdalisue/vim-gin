import type { Denops } from "https://deno.land/x/denops_std@v5.0.1/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.6.0/mod.ts#^";
import * as buffer from "https://deno.land/x/denops_std@v5.0.1/buffer/mod.ts";
import { expand } from "./expand.ts";
import { findWorktreeFromDenops } from "../git/worktree.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "util:reload": (bufnr) => {
      assert(bufnr, is.Number, { message: "bufnr must be number" });
      return buffer.reload(denops, bufnr);
    },

    "util:expand": (expr) => {
      assert(expr, is.String, { message: "expr must be string" });
      return expand(denops, expr);
    },

    "util:worktree": (worktree) => {
      assert(worktree, is.OneOf([is.String, is.Undefined]), {
        message: "worktree must be string | undefined",
      });
      return findWorktreeFromDenops(denops, { worktree });
    },
  };
}
