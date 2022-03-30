import { Cache, Denops, path, unknownutil } from "../deps.ts";
import { getWorktree } from "../util/worktree.ts";
import { find } from "../git/finder.ts";

type Data = string;

const cache = new Cache<string, Data>(100);

async function getData(
  denops: Denops,
  worktree: string,
): Promise<Data> {
  if (cache.has("data")) {
    return cache.get("data");
  }
  const cwd = worktree || await getWorktree(denops);
  const result = await find(cwd);
  cache.set("data", result);
  return result;
}

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "component:worktree:full": async (worktree) => {
      unknownutil.assertString(worktree);
      const fullpath = await getData(denops, worktree);
      return fullpath;
    },
    "component:worktree:name": async (worktree) => {
      unknownutil.assertString(worktree);
      const fullpath = await getData(denops, worktree);
      return path.basename(fullpath);
    },
  };
}
