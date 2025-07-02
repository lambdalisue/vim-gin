import type { Denops } from "jsr:@denops/std@^7.0.0";
import type { Tree } from "jsr:@lambdalisue/ui-treeutil@^0.1.2";
import { is, maybe } from "jsr:@core/unknownutil@^4.3.0";
import * as fn from "jsr:@denops/std@^7.0.0/function";

const TREE_STATE_VAR = "gin_tree_state";

export interface TreeState {
  tree: Tree;
  commitish: string;
  worktree: string;
}

export async function getTreeState(
  denops: Denops,
  bufnr: number,
): Promise<TreeState | undefined> {
  try {
    const state = maybe(
      await fn.getbufvar(denops, bufnr, TREE_STATE_VAR),
      is.String,
    );
    if (!state) {
      return undefined;
    }
    return JSON.parse(state) as TreeState;
  } catch {
    return undefined;
  }
}

export async function setTreeState(
  denops: Denops,
  bufnr: number,
  state: TreeState,
): Promise<void> {
  await fn.setbufvar(denops, bufnr, TREE_STATE_VAR, JSON.stringify(state));
}

