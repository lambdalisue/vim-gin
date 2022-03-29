import {
  ansiEscapeCode,
  batch,
  Denops,
  itertools,
  nvimFn,
  unreachable,
  vimFn,
} from "../deps.ts";
import { countVimBytes } from "./text.ts";

export type Decoration = {
  line: number;
  column: number;
  length: number;
  highlight: string;
};

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

export function buildDecorationsFromAnsiEscapeCode(
  content: string[],
): [string[], Decoration[]] {
  const trimmed: string[] = [];
  const decorations: Decoration[] = [];
  for (let i = 0; i < content.length; i++) {
    const [t, annons] = ansiEscapeCode.trimAndParse(content[i]);
    let previous: [number, string] | undefined;
    for (const annon of annons) {
      if (!annon.csi.sgr) {
        continue;
      }
      const highlight = highlightFromSgr(annon.csi.sgr);
      if (!highlight) {
        continue;
      }
      const byteOffset = countVimBytes(t.substring(0, annon.offset));
      if (previous) {
        decorations.push({
          line: i + 1,
          column: 1 + previous[0],
          length: byteOffset - previous[0],
          highlight: previous[1],
        });
      }
      previous = highlight === "NONE" ? undefined : [byteOffset, highlight];
    }
    if (previous) {
      decorations.push({
        line: i + 1,
        column: previous[0],
        length: countVimBytes(t) - previous[0],
        highlight: previous[1],
      });
    }
    trimmed.push(t);
  }
  return [trimmed, decorations];
}

function highlightFromSgr(sgr: ansiEscapeCode.Sgr): string | undefined {
  if (sgr.foreground === "default" || sgr.reset) {
    return "NONE";
  }
  if (sgr.foreground && typeof sgr.foreground === "number") {
    const index = (sgr.bold && sgr.foreground < 8)
      ? sgr.foreground + 8
      : sgr.foreground;
    return `GinColor${index}`;
  }
  // We don't support that SGR
  return undefined;
}
