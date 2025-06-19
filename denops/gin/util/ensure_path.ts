import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as fn from "jsr:@denops/std@^7.0.0/function";

/**
 * Ensure the path is absolute.
 *
 * It returns the absolute path of the given path. If the path is not given, it
 * returns the absolute path of the current buffer.
 *
 * @param denops Denops instance.
 * @param path Path to ensure.
 * @returns Absolute path.
 */
export async function ensurePath(
  denops: Denops,
  path?: string,
): Promise<string> {
  const expr = path ?? await fn.bufname(denops);
  const abspath = await fn.fnamemodify(denops, expr, ":p");
  return abspath;
}
