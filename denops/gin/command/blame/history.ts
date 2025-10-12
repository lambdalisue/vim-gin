import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import * as vars from "jsr:@denops/std@^7.0.0/variable";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import type { HistoryEntry } from "./types.ts";

/**
 * Get blame history from buffer
 */
export async function getHistory(
  denops: Denops,
): Promise<{ history: HistoryEntry[]; historyIndex: number }> {
  const history = (await vars.b.get(denops, "gin_blame_history") as HistoryEntry[] | undefined) || [];
  const historyIndex = (await vars.b.get(denops, "gin_blame_history_index") as number | undefined) ?? -1;
  return { history, historyIndex };
}

/**
 * Save blame history to both nav and blame buffers
 */
export async function saveHistory(
  denops: Denops,
  bufnrNav: number,
  bufnrBlame: number,
  history: HistoryEntry[],
  historyIndex: number,
): Promise<void> {
  await batch.batch(denops, async (denops) => {
    await fn.setbufvar(denops, bufnrNav, "gin_blame_history", history);
    await fn.setbufvar(denops, bufnrNav, "gin_blame_history_index", historyIndex);
    await fn.setbufvar(denops, bufnrBlame, "gin_blame_history", history);
    await fn.setbufvar(denops, bufnrBlame, "gin_blame_history_index", historyIndex);
  });
}

/**
 * Create or update history entry for current position
 */
export function createHistoryUpdate(
  history: HistoryEntry[],
  historyIndex: number,
  commitish: string,
  physicalLine: number,
  filename: string,
): { updatedHistory: HistoryEntry[]; updatedIndex: number } {
  let updatedHistory: HistoryEntry[];

  if (historyIndex < 0) {
    // First time: create initial entry
    updatedHistory = [{
      commitish,
      physicalLine,
      filename,
    }];
  } else {
    // Update current entry, then truncate forward history
    const temp = [...history];
    temp[historyIndex] = {
      commitish,
      physicalLine,
      filename,
    };
    updatedHistory = temp.slice(0, historyIndex + 1);
  }

  return { updatedHistory, updatedIndex: historyIndex };
}

/**
 * Add new history entry
 */
export function addHistoryEntry(
  history: HistoryEntry[],
  commitish: string,
  filename: string,
): { newHistory: HistoryEntry[]; newIndex: number } {
  const newHistory = [
    ...history,
    {
      commitish,
      physicalLine: -1, // Will be updated after buffer update
      filename,
    },
  ];
  return { newHistory, newIndex: newHistory.length - 1 };
}
