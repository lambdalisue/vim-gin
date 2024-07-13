import type { Denops } from "https://deno.land/x/denops_std@v6.5.1/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v6.5.1/function/mod.ts";
import { parse as parseBufname } from "https://deno.land/x/denops_std@v6.5.1/bufname/mod.ts";
import { join } from "https://deno.land/std@0.224.0/path/join.ts";
import { ensure, is } from "https://deno.land/x/unknownutil@v3.18.1/mod.ts";
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
