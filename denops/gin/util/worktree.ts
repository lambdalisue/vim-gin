import { batch, bufname, Denops, fn, unknownutil } from "../deps.ts";
import { GIN_BUFFER_PROTOCOLS } from "../global.ts";
import { expand } from "../util/cmd.ts";
import { Opts } from "../util/args.ts";
import { find } from "../git/finder.ts";

async function getWorktree(denops: Denops): Promise<string> {
  const [cwd, bname] = await batch.gather(denops, async (denops) => {
    await fn.getcwd(denops);
    await fn.bufname(denops, "%");
  });
  unknownutil.assertString(cwd);
  unknownutil.assertString(bname);
  if (bname) {
    try {
      const { scheme, expr } = bufname.parse(bname);
      if (GIN_BUFFER_PROTOCOLS.includes(scheme)) {
        return unknownutil.ensureString(
          await fn.fnamemodify(denops, expr, ":p"),
        );
      }
    } catch {
      // Ignore errors
    }
  }
  return await find(cwd);
}

export async function getWorktreeFromOpts(
  denops: Denops,
  opts: Opts,
): Promise<string> {
  const worktree = opts["worktree"]
    ? await find(await expand(denops, opts["worktree"]))
    : await getWorktree(denops);
  return worktree;
}
