import { batch, bufname, Denops, fn } from "../deps.ts";
import { GIN_FILE_BUFFER_PROTOCOLS } from "../global.ts";
import { expand } from "../util/cmd.ts";
import { find } from "../git/finder.ts";

async function getWorktree(denops: Denops): Promise<string> {
  const [cwd, bname] = await batch.gather(denops, async (denops) => {
    await fn.getcwd(denops);
    await fn.bufname(denops, "%");
  }) as [string, string];
  if (bname) {
    try {
      const { scheme, expr } = bufname.parse(bname);
      if (GIN_FILE_BUFFER_PROTOCOLS.includes(scheme)) {
        return await fn.fnamemodify(denops, expr, ":p") as string;
      }
    } catch {
      // Ignore errors
    }
  }
  return await find(cwd);
}

export async function getWorktreeFromOpts(
  denops: Denops,
  opts: Record<string, string>,
): Promise<string> {
  const worktree = opts["worktree"]
    ? await find(await expand(denops, opts["worktree"]))
    : await getWorktree(denops);
  return worktree;
}
