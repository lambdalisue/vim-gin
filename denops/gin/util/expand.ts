import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import { parse as parseBufname } from "jsr:@denops/std@^7.0.0/bufname";
import { join } from "jsr:@std/path@^1.0.0/join";
import { ensure, is } from "jsr:@core/unknownutil@^4.0.0";
import { GIN_FILE_BUFFER_PROTOCOLS } from "../global.ts";

export async function expand(denops: Denops, expr: string): Promise<string> {
  const bufname = ensure(await fn.expand(denops, expr), is.String);
  try {
    const { scheme, expr, fragment } = parseBufname(bufname);
    if (fragment && GIN_FILE_BUFFER_PROTOCOLS.includes(scheme)) {
      try {
        // Return the first path if the buffer has multiple paths
        const paths = JSON.parse(fragment);
        const path = paths.at(0);
        return path ? join(expr, path) : bufname;
      } catch {
        return join(expr, fragment);
      }
    }
  } catch {
    // Ignore errors
  }
  return bufname;
}
