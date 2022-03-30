import { Cache, Denops, unknownutil } from "../deps.ts";
import { decodeUtf8 } from "../util/text.ts";
import { getWorktree } from "../util/worktree.ts";
import { execute } from "../git/process.ts";

type Data = [number, number];

const cache = new Cache<string, Data>(100);

async function getData(
  denops: Denops,
  worktree: string,
): Promise<Data> {
  if (cache.has("data")) {
    return cache.get("data");
  }
  const cwd = worktree || await getWorktree(denops);
  const result = await Promise.all([
    getAhead(cwd),
    getBehind(cwd),
  ]);
  cache.set("data", result);
  return result;
}

async function getAhead(cwd: string): Promise<number> {
  const stdout = await execute([
    "rev-list",
    "--count",
    "@{u}..HEAD",
  ], {
    noOptionalLocks: true,
    cwd,
  });
  return Number(decodeUtf8(stdout));
}

async function getBehind(cwd: string): Promise<number> {
  const stdout = await execute([
    "rev-list",
    "--count",
    "HEAD..@{u}",
  ], {
    noOptionalLocks: true,
    cwd,
  });
  return Number(decodeUtf8(stdout));
}

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "component:traffic:ascii": async (worktree) => {
      unknownutil.assertString(worktree);
      const [ahead, behind] = await getData(denops, worktree);
      let component = "";
      if (ahead) {
        component += `^${ahead}`;
      }
      if (behind) {
        component += `v${behind}`;
      }
      return component;
    },
    "component:traffic:unicode": async (worktree) => {
      unknownutil.assertString(worktree);
      const [ahead, behind] = await getData(denops, worktree);
      let component = "";
      if (ahead) {
        component += `↑${ahead}`;
      }
      if (behind) {
        component += `↓${behind}`;
      }
      return component;
    },
  };
}
