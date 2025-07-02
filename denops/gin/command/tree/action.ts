import type { Denops } from "jsr:@denops/std@^7.0.0";
import { ensure, is } from "jsr:@core/unknownutil@^4.0.0";
import { unnullish } from "jsr:@lambdalisue/unnullish@^1.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import * as buffer from "jsr:@denops/std@^7.0.0/buffer";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import * as option from "jsr:@denops/std@^7.0.0/option";
import {
  collapseNode,
  expandNode,
  getVisibleItems,
  type Tree,
  type TreeItem,
  DefaultRenderer,
} from "jsr:@lambdalisue/ui-treeutil@^0.1.2";
import { join } from "jsr:@std/path@^1.0.0/join";
import { Range } from "../../action/core.ts";
import { getTreeState, setTreeState, type TreeState } from "./state.ts";
import { exec as execEdit } from "../edit/command.ts";

export async function expand(
  denops: Denops,
  bufnr: number,
  range: Range,
): Promise<void> {
  const state = await getTreeState(denops, bufnr);
  if (!state) {
    return;
  }

  const item = await getCurrentItem(denops, bufnr, range);
  if (!item || item.type !== "branch") {
    return;
  }

  // Build path from root to the item
  const path = item.path.slice(1); // Remove root from path
  const newTree = expandNode(state.tree, path);
  
  await updateTreeBuffer(denops, bufnr, {
    ...state,
    tree: newTree,
  });
}

export async function collapse(
  denops: Denops,
  bufnr: number,
  range: Range,
): Promise<void> {
  const state = await getTreeState(denops, bufnr);
  if (!state) {
    return;
  }

  const item = await getCurrentItem(denops, bufnr, range);
  if (!item || item.type !== "branch") {
    return;
  }

  // Build path from root to the item
  const path = item.path.slice(1); // Remove root from path
  const newTree = collapseNode(state.tree, path);
  
  await updateTreeBuffer(denops, bufnr, {
    ...state,
    tree: newTree,
  });
}

export async function expandOrEdit(
  denops: Denops,
  bufnr: number,
  range: Range,
): Promise<void> {
  const state = await getTreeState(denops, bufnr);
  if (!state) {
    return;
  }

  const item = await getCurrentItem(denops, bufnr, range);
  if (!item) {
    return;
  }

  if (item.type === "branch") {
    // If it's a branch and collapsed, expand it
    if (item.collapsed) {
      await expand(denops, bufnr, range);
    }
  } else {
    // If it's a leaf, open the file
    await execEdit(denops, item.value, {
      worktree: state.worktree,
      commitish: state.commitish,
      opener: "edit",
    });
  }
}

async function getCurrentItem(
  denops: Denops,
  bufnr: number,
  range: Range,
): Promise<TreeItem | undefined> {
  const state = await getTreeState(denops, bufnr);
  if (!state) {
    return undefined;
  }

  const [start] = range;
  const items = getVisibleItems(state.tree);
  
  // Line numbers are 1-based, array indices are 0-based
  const index = start - 1;
  if (index >= 0 && index < items.length) {
    return items[index];
  }
  
  return undefined;
}

async function updateTreeBuffer(
  denops: Denops,
  bufnr: number,
  state: TreeState,
): Promise<void> {
  // Save the new state
  await setTreeState(denops, bufnr, state);
  
  // Get visible items and render them
  const items = getVisibleItems(state.tree);
  const renderer = new DefaultRenderer();
  const lines = renderer.render(items);
  
  // Save cursor position
  const curpos = await fn.getpos(denops, ".");
  
  await batch.batch(denops, async (denops) => {
    // Update buffer content
    await option.modifiable.setLocal(denops, true);
    await buffer.replace(denops, bufnr, lines);
    await option.modifiable.setLocal(denops, false);
    
    // Restore cursor position
    await fn.setpos(denops, ".", curpos);
  });
}