import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import * as mapping from "jsr:@denops/std@^7.0.0/mapping";
import * as path from "jsr:@std/path@^1.0.0";
import { type DiffLocation, parse } from "./parser.ts";
import { parse as parseBufname } from "jsr:@denops/std@^7.0.0/bufname";
import { exec as execEdit } from "../../command/edit/command.ts";

export const WORKTREE = Symbol("WORKTREE");
export const INDEX = Symbol("INDEX");

export type Commitish = typeof WORKTREE | typeof INDEX | string;

export type CommitishMap = {
  old:
    | Commitish
    | ((_args: { bufnr: number }) => Commitish | Promise<Commitish>);
  new:
    | Commitish
    | ((_args: { bufnr: number }) => Commitish | Promise<Commitish>);
};

type JumpTarget = {
  location: DiffLocation;
  commitish: Commitish;
  worktree: string;
};

/**
 * Initialize diff jump functionality for a buffer
 *
 * @param denops - Denops instance
 * @param bufnr - Buffer number
 * @param namespace - Namespace for dispatcher (e.g., "diff", "buffer")
 * @param options - Configuration options
 */
export async function init(
  denops: Denops,
  bufnr: number,
  namespace: string,
): Promise<void> {
  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
      // Define <Plug> mappings
      await mapping.map(
        denops,
        "<Plug>(gin-diffjump-old)",
        `<Cmd>call denops#request('gin', '${namespace}:diffjump:old', [])<CR>`,
        {
          buffer: true,
          noremap: true,
        },
      );
      await mapping.map(
        denops,
        "<Plug>(gin-diffjump-new)",
        `<Cmd>call denops#request('gin', '${namespace}:diffjump:new', [])<CR>`,
        {
          buffer: true,
          noremap: true,
        },
      );
      await mapping.map(
        denops,
        "<Plug>(gin-diffjump-smart)",
        `<Cmd>call denops#request('gin', '${namespace}:diffjump:smart', [])<CR>`,
        {
          buffer: true,
          noremap: true,
        },
      );
    });
  });
}

export async function jumpOld(
  denops: Denops,
  commitishOrFn:
    | Commitish
    | ((_args: { bufnr: number }) => Commitish | Promise<Commitish>),
  mods: string,
): Promise<void> {
  const bufnr = await fn.bufnr(denops, "%");
  const commitish = typeof commitishOrFn === "function"
    ? await commitishOrFn({ bufnr })
    : commitishOrFn;
  const target = await buildJumpTarget(denops, bufnr, "old", commitish);
  if (target) {
    await jumpTo(denops, target, mods);
  }
}

export async function jumpNew(
  denops: Denops,
  commitishOrFn:
    | Commitish
    | ((_args: { bufnr: number }) => Commitish | Promise<Commitish>),
  mods: string,
): Promise<void> {
  const bufnr = await fn.bufnr(denops, "%");
  const commitish = typeof commitishOrFn === "function"
    ? await commitishOrFn({ bufnr })
    : commitishOrFn;
  const target = await buildJumpTarget(denops, bufnr, "new", commitish);
  if (target) {
    await jumpTo(denops, target, mods);
  }
}

export async function jumpSmart(
  denops: Denops,
  commitishMap: CommitishMap,
  mods: string,
): Promise<void> {
  const bufnr = await fn.bufnr(denops, "%");
  const line = await fn.getline(denops, ".");
  const side = line.startsWith("-") ? "old" : "new";
  const commitish = commitishMap[side];
  const resolved = typeof commitish === "function"
    ? await commitish({ bufnr })
    : commitish;

  const target = await buildJumpTarget(denops, bufnr, side, resolved);
  if (target) {
    await jumpTo(denops, target, mods);
  }
}

async function buildJumpTarget(
  denops: Denops,
  bufnr: number,
  side: "old" | "new",
  commitish: Commitish,
): Promise<JumpTarget | undefined> {
  const [lnum, content, bufname] = await batch.collect(denops, (denops) => [
    fn.line(denops, "."),
    fn.getbufline(denops, bufnr, 1, "$"),
    fn.bufname(denops, bufnr),
  ]);

  const result = parse(lnum - 1, content);
  if (!result) {
    return undefined;
  }

  // Select location based on jump type and requested side
  let location: DiffLocation | undefined;
  if (result.type === "old") {
    location = result.old;
  } else if (result.type === "new") {
    location = result.new;
  } else {
    // jump.type === "both"
    location = side === "old" ? result.old : result.new;
  }
  if (!location) {
    return undefined;
  }

  const { expr: worktree } = parseBufname(bufname);
  if (!worktree) {
    return undefined;
  }

  return {
    location,
    commitish,
    worktree,
  };
}

async function jumpTo(
  denops: Denops,
  target: JumpTarget,
  mods: string,
): Promise<void> {
  const filename = path.join(
    target.worktree,
    target.location.path.replace(/^[ab]\//, ""),
  );

  const column = await fn.col(denops, ".");
  const cmdarg = `+call\\ cursor(${target.location.lnum},${column})`;

  if (target.commitish === WORKTREE) {
    await buffer.open(denops, filename, { mods, cmdarg });
  } else if (target.commitish === INDEX) {
    await execEdit(denops, filename, {
      worktree: target.worktree,
      mods,
      cmdarg,
    });
  } else {
    await execEdit(denops, filename, {
      worktree: target.worktree,
      commitish: target.commitish,
      mods,
      cmdarg,
    });
  }
}
