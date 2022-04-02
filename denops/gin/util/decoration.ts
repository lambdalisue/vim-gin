import type { Denops } from "https://deno.land/x/denops_std@v3.2.0/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v3.2.0/batch/mod.ts";
import * as vimFn from "https://deno.land/x/denops_std@v3.2.0/function/vim/mod.ts";
import * as nvimFn from "https://deno.land/x/denops_std@v3.2.0/function/nvim/mod.ts";
import * as itertools from "https://deno.land/x/itertools@v1.0.2/mod.ts";
import { unreachable } from "https://deno.land/x/unreachable@v0.1.0/mod.ts";

export type Decoration = {
  // Line number
  line: number;
  // Column number (bytes)
  column: number;
  // Length (bytes)
  length: number;
  // Highlight name
  highlight: string;
};

/**
 * Decorate the specified buffer with decorations
 */
export function decorate(
  denops: Denops,
  bufnr: number,
  decorations: Decoration[],
): Promise<void> {
  switch (denops.meta.host) {
    case "vim":
      return vimDecorate(denops, bufnr, decorations);
    case "nvim":
      return nvimDecorate(denops, bufnr, decorations);
    default:
      unreachable(denops.meta.host);
  }
}

async function vimDecorate(
  denops: Denops,
  bufnr: number,
  decorations: Decoration[],
): Promise<void> {
  const toPropType = (n: string) => `gin:decoration:decorate:${n}`;
  try {
    for (const chunk of itertools.chunked(decorations, 1000)) {
      await batch.batch(denops, async (denops) => {
        for (const deco of chunk) {
          await vimFn.prop_add(denops, deco.line, deco.column, {
            bufnr,
            length: deco.length,
            type: toPropType(deco.highlight),
          });
        }
      });
    }
  } catch {
    // Fail silently
  }
}

async function nvimDecorate(
  denops: Denops,
  bufnr: number,
  decorations: Decoration[],
): Promise<void> {
  const ns = await nvimFn.nvim_create_namespace(
    denops,
    "gin:decoration:decorate",
  );
  for (const chunk of itertools.chunked(decorations, 1000)) {
    await batch.batch(denops, async (denops) => {
      for (const deco of chunk) {
        await nvimFn.nvim_buf_add_highlight(
          denops,
          bufnr,
          ns,
          deco.highlight,
          deco.line - 1,
          deco.column - 1,
          deco.column - 1 + deco.length,
        );
      }
    });
  }
}
