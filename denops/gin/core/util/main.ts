import type { Denops } from "https://deno.land/x/denops_std@v4.0.0/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.1.0/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v4.0.0/buffer/mod.ts";
import { expand } from "../../util/cmd.ts";
import { findWorktreeFromDenops } from "../../git/worktree.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "util:reload": (bufnr) => {
      unknownutil.assertNumber(bufnr);
      return buffer.reload(denops, bufnr);
    },

    "util:expand": (expr) => {
      unknownutil.assertString(expr);
      return expand(denops, expr);
    },

    "util:worktree": (worktree) => {
      if (worktree) {
        unknownutil.assertString(worktree);
      } else {
        unknownutil.assertUndefined(worktree);
      }
      return findWorktreeFromDenops(denops, { worktree });
    },
  };
}
