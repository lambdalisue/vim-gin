import { autocmd, batch, Denops, fn, helper } from "../deps.ts";

/**
 * Open a buffer
 */
export async function open(denops: Denops, bufname: string): Promise<void> {
  await denops.cmd("edit `=bufname`", { bufname });
}

/**
 * Edit a buffer
 */
export async function reload(denops: Denops, bufnr: number): Promise<void> {
  await helper.load(denops, new URL("./buffer.vim", import.meta.url));
  await denops.cmd("call timer_start(0, { -> GinCoreBufferReload(bufnr) })", {
    bufnr,
  });
}

/**
 * Replace the buffer content
 */
export async function replace(
  denops: Denops,
  bufnr: number,
  repl: string[],
): Promise<void> {
  await helper.load(denops, new URL("./buffer.vim", import.meta.url));
  await denops.call("GinCoreBufferReplace", bufnr, repl);
}

/**
 * Concrete the buffer.
 *
 * - The `buftype` option become "nofile"
 * - The `swapfile` become disabled
 * - The `modifiable` become disabled
 * - The content of the buffer is restored on `BufReadCmd` synchronously
 */
export async function concrete(
  denops: Denops,
  bufnr: number,
): Promise<void> {
  await helper.load(denops, new URL("./buffer.vim", import.meta.url));
  await batch.batch(denops, async (denops) => {
    await fn.setbufvar(denops, bufnr, "&buftype", "nofile");
    await fn.setbufvar(denops, bufnr, "&swapfile", 0);
    await fn.setbufvar(denops, bufnr, "&modifiable", 0);
    await autocmd.group(denops, "gin_core_buffer_concrete", (helper) => {
      const pat = `<buffer=${bufnr}>`;
      helper.remove("*", pat);
      helper.define("BufReadCmd", pat, "call GinCoreBufferConcreteRestore()", {
        nested: true,
      });
    });
    await denops.call("GinCoreBufferConcreteStore");
  });
}
