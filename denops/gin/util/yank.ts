import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import { v } from "jsr:@denops/std@^7.0.0/variable";

export async function yank(
  denops: Denops,
  value: string,
  reg?: string,
): Promise<void> {
  reg = reg ?? await v.get(denops, "register");
  await fn.setreg(denops, reg, value);
}
