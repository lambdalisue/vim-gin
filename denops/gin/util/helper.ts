import { Denops, helper, batch } from "../deps.ts";
import * as debug from "../core/debug/core.ts";

export async function echoerr(denops: Denops, message: string): Promise<void> {
    await batch.batch(denops, async (denops) => {
      await denops.cmd("echohl ErrorMsg");
      await helper.echo(denops, message);
      await denops.cmd("echohl None");
    });
}

export async function featCall(denops: Denops, fn: () => Promise<unknown>): Promise<unknown> {
  if (debug.get()) {
    return await fn();
  }
  try {
    return await fn();
  } catch (e: unknown) {
    if (e instanceof Error) {
      const err: Error = e;
      await echoerr(denops, `[gin]: ${err.message}`);
    } else {
      throw e;
    }
  }
}
