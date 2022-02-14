// XXX:
// https://github.com/vim-denops/deno-denops-std/pull/119
import type { Denops } from "https://deno.land/x/denops_std@v2.4.0/mod.ts";
import { batch } from "https://deno.land/x/denops_std@v2.4.0/batch/mod.ts";
import { echo } from "https://deno.land/x/denops_std@v2.4.0/helper/mod.ts";

/**
 * Echo message as an error message.
 *
 * Note that this function just use ErrorMsg highlight and is not equivalent
 * to `echoerr` command in Vim/Neovim.
 */
export async function echoerr(denops: Denops, message: string): Promise<void> {
  await batch(denops, async (denops) => {
    await denops.cmd("echohl ErrorMsg");
    await echo(denops, message);
    await denops.cmd("echohl None");
  });
}

/**
 * Call given function and print a friendly error message (without stack trace) on failure.
 *
 * Print a stack trace when denops is running in debug mode.
 */
export async function friendlyCall(
  denops: Denops,
  fn: () => Promise<unknown>,
): Promise<unknown> {
  if (denops.meta.mode === "debug") {
    return await fn();
  }
  try {
    return await fn();
  } catch (e: unknown) {
    if (e instanceof Error) {
      const err: Error = e;
      await echoerr(denops, `[${denops.name}]: ${err.message}`);
    } else {
      throw e;
    }
  }
}

export * from "https://deno.land/x/denops_std@v2.4.0/helper/mod.ts";
