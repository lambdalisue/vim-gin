import type { Denops } from "jsr:@denops/std@^7.0.0";
import { Cache } from "jsr:@lambdalisue/ttl-cache@^1.0.0";
import * as path from "jsr:@std/path@^1.0.0";
import { findWorktreeFromDenops } from "../git/worktree.ts";
import { findWorktree } from "../git/finder.ts";

type Data = string;

const cache = new Cache<string, Data>(100);

async function getData(
  denops: Denops,
): Promise<Data> {
  return cache.get("data") ?? await (async () => {
    const worktree = await findWorktreeFromDenops(denops);
    const result = await findWorktree(worktree);
    cache.set("data", result);
    return result;
  })();
}

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "component:worktree:full": async () => {
      const fullpath = await getData(denops);
      return fullpath;
    },
    "component:worktree:name": async () => {
      const fullpath = await getData(denops);
      return path.basename(fullpath);
    },
  };
}
