import type { Denops } from "https://deno.land/x/denops_std@v3.7.1/mod.ts";
import * as path from "https://deno.land/std@0.150.0/path/mod.ts";
import * as fs from "https://deno.land/std@0.150.0/fs/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v3.7.1/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.7.1/function/mod.ts";
import * as option from "https://deno.land/x/denops_std@v3.7.1/option/mod.ts";
import {
  parse as parseBufname,
} from "https://deno.land/x/denops_std@v3.7.1/bufname/mod.ts";
import { expand } from "../../util/cmd.ts";
import {
  findWorktreeFromSuspects,
  listWorktreeSuspectsFromDenops,
} from "../../util/worktree.ts";
import { exec as execEcho } from "../../core/echo/command.ts";

export async function write(
  denops: Denops,
  bufnr: number,
  bufname: string,
): Promise<void> {
  const { scheme, expr, fragment } = parseBufname(bufname);
  if (!fragment) {
    throw new Error(`A buffer '${scheme}://' requires a fragment part`);
  }
  await exec(denops, bufnr, fragment, {
    worktree: expr,
  });
}

export type ExecOptions = {
  worktree?: string;
};

export async function exec(
  denops: Denops,
  bufnr: number,
  relpath: string,
  options: ExecOptions,
): Promise<void> {
  const [verbose, fileencoding, fileformat, content] = await batch.gather(
    denops,
    async (denops) => {
      await option.verbose.get(denops);
      await fn.getbufvar(denops, bufnr, "&fileencoding");
      await fn.getbufvar(denops, bufnr, "&fileformat");
      await fn.getbufline(denops, bufnr, 1, "$");
    },
  ) as [number, string, string, string[]];

  const worktree = await findWorktreeFromSuspects(
    options.worktree
      ? [await expand(denops, options.worktree)]
      : await listWorktreeSuspectsFromDenops(denops, !!verbose),
    !!verbose,
  );

  const original = path.join(worktree, relpath);
  let restore: () => Promise<void>;
  const f = await Deno.makeTempFile({
    dir: path.dirname(original),
  });
  try {
    await Deno.rename(original, f);
    restore = () => Deno.rename(f, original);
  } catch (e) {
    if (!(e instanceof Deno.errors.NotFound)) {
      throw e;
    }
    await Deno.remove(f);
    restore = () => Deno.remove(original);
  }
  try {
    await fs.ensureFile(original);
    await Deno.writeTextFile(original, `${content.join("\n")}\n`);
    await fn.setbufvar(denops, bufnr, "&modified", 0);
    await execEcho(denops, [
      "add",
      "--force",
      "--",
      relpath,
    ], {
      worktree,
      encoding: fileencoding,
      fileformat,
    });
  } finally {
    await restore();
  }
}
