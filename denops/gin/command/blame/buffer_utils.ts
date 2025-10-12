import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import * as vars from "jsr:@denops/std@^7.0.0/variable";
import {
  parse as parseBufname,
  type BufnameParams,
} from "jsr:@denops/std@^7.0.0/bufname";
import type { GitBlameResult, GitBlameLine } from "./parser.ts";

/**
 * Information about the current blame buffer context
 */
export type BlameBufferContext = {
  bufnrCurrent: number;
  bufnrNav: number;
  bufnrBlame: number;
  scheme: string;
  expr: string;
  params: BufnameParams | undefined;
  fileFragment: string;
  blameResult: GitBlameResult;
};

/**
 * Get blame buffer context from current buffer
 */
export async function getBlameContext(denops: Denops): Promise<BlameBufferContext> {
  const bufnrCurrent = await fn.bufnr(denops);
  const bufnameCurrent = await fn.bufname(denops, bufnrCurrent);
  const { scheme, expr, params } = parseBufname(bufnameCurrent);

  // Determine which buffer we're in and get the paired buffers
  let bufnrNav: number;
  let bufnrBlame: number;

  if (scheme === "ginblamenav") {
    bufnrNav = bufnrCurrent;
    const bufnameBlame = await vars.b.get(denops, "gin_blame_file_bufname") as string | undefined;
    if (!bufnameBlame) {
      throw new Error("Cannot find associated ginblame buffer");
    }
    bufnrBlame = await fn.bufnr(denops, bufnameBlame);
  } else if (scheme === "ginblame") {
    bufnrBlame = bufnrCurrent;
    const bufnameNav = await vars.b.get(denops, "gin_blame_nav_bufname") as string | undefined;
    if (!bufnameNav) {
      throw new Error("Cannot find associated ginblamenav buffer");
    }
    bufnrNav = await fn.bufnr(denops, bufnameNav);
  } else {
    throw new Error("This command can only be called from ginblame or ginblamenav buffer");
  }

  const fileFragment = await vars.b.get(denops, "gin_blame_file_fragment") as string | undefined;
  if (!fileFragment) {
    throw new Error("File fragment not found");
  }

  const blameResult = await vars.b.get(denops, "gin_blame_result") as GitBlameResult | undefined;
  if (!blameResult) {
    throw new Error("Blame result not found");
  }

  if (bufnrBlame === -1) {
    throw new Error("Ginblame buffer not found");
  }

  return {
    bufnrCurrent,
    bufnrNav,
    bufnrBlame,
    scheme,
    expr,
    params,
    fileFragment,
    blameResult,
  };
}

/**
 * Get blame line from current cursor position using lineMap
 * Works for both ginblamenav and ginblame buffers
 */
export async function getBlameLine(
  denops: Denops,
  _scheme: string,
  lnum: number,
  _blameResult: GitBlameResult,
): Promise<{ blameLine: GitBlameLine; relativeOffset: number } | null> {
  // Get the line map (physical line -> GitBlameLine)
  const lineMap = await vars.b.get(denops, "gin_blame_line_map") as Record<number, GitBlameLine> | undefined;
  if (!lineMap) {
    return null;
  }

  // Direct lookup by physical line number
  const blameLine = lineMap[lnum];
  if (!blameLine) {
    return null; // Empty line or divider
  }

  return { blameLine, relativeOffset: 0 };
}
