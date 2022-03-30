import { Cache, Denops, unknownutil } from "../deps.ts";
import { decodeUtf8 } from "../util/text.ts";
import { getWorktree } from "../util/worktree.ts";
import { execute } from "../git/process.ts";

type Data = [string, string];

const cache = new Cache<string, Data>(100);

async function getData(
  denops: Denops,
  worktree: string,
): Promise<Data> {
  if (cache.has("data")) {
    return cache.get("data");
  }
  const cwd = worktree || await getWorktree(denops);
  const result = await getBranches(cwd);
  cache.set("data", result);
  return result;
}

async function getBranches(
  cwd: string,
): Promise<Data> {
  const stdout = await execute([
    "rev-parse",
    "--abbrev-ref",
    "--symbolic-full-name",
    "HEAD",
    "@{u}",
  ], {
    noOptionalLocks: true,
    cwd,
  });
  const [branch, upstream] = decodeUtf8(stdout).split("\n");
  return [branch, upstream];
}

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "component:branch:ascii": async (worktree) => {
      unknownutil.assertString(worktree);
      const [branch, upstream] = await getData(denops, worktree);
      if (branch && upstream) {
        return `${branch} -> ${upstream}`;
      }
      return branch;
    },
    "component:branch:unicode": async (worktree) => {
      unknownutil.assertString(worktree);
      const [branch, upstream] = await getData(denops, worktree);
      if (branch && upstream) {
        return `${branch} → ${upstream}`;
      }
      return branch;
    },
  };
}
