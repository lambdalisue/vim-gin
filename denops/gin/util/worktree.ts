import { Denops, fn, batch, bufname } from "../deps.ts";
import { GIN_FILE_BUFFER_PROTOCOLS } from "../global.ts";
import { find } from "../git/finder.ts";


export async function getWorktree(denops: Denops): Promise<string> {
  const [cwd, bname] = await batch.gather(denops, async (denops) => {
    await fn.getcwd(denops);
    await fn.bufname(denops, '%');
  }) as [string, string];
  if (bname) {
    try {
      const { scheme, expr } = bufname.parse(bname);
      if (GIN_FILE_BUFFER_PROTOCOLS.includes(scheme)) {
        return await fn.fnamemodify(denops, expr, ':p') as string;
      }
    } catch {}
  }
  return await find(cwd);
}
