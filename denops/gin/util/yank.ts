import type { Denops } from "https://deno.land/x/denops_std@v5.0.1/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v5.0.1/function/mod.ts";
import { v } from "https://deno.land/x/denops_std@v5.0.1/variable/mod.ts";

export async function yank(
  denops: Denops,
  value: string,
  reg?: string,
): Promise<void> {
  reg = reg ?? await v.get(denops, "register");
  await fn.setreg(denops, reg, value);
}
