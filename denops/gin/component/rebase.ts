import type { Denops } from "jsr:@denops/std@^7.0.0";
import { Cache } from "jsr:@lambdalisue/ttl-cache@^1.0.0";
import { findWorktreeFromDenops } from "../git/worktree.ts";
import { getRebaseState, RebaseState } from "../git/rebase.ts";

const cache = new Cache<string, RebaseState | undefined>(100);

async function getData(
  denops: Denops,
): Promise<RebaseState | undefined> {
  return cache.get("data") ?? await (async () => {
    const worktree = await findWorktreeFromDenops(denops);
    const result = await getRebaseState(worktree);
    cache.set("data", result);
    return result;
  })();
}

function formatRebaseState(state: RebaseState): string {
  const prefix = state.interactive ? "REBASE-i" : "REBASE";
  return `${prefix} ${state.current}/${state.total}`;
}

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "component:rebase:ascii": async () => {
      const state = await getData(denops);
      if (!state) return "";
      return formatRebaseState(state);
    },
    "component:rebase:unicode": async () => {
      const state = await getData(denops);
      if (!state) return "";
      return formatRebaseState(state);
    },
  };
}
