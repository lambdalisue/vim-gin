import { Denops } from "../../deps.ts";
import * as buffer from "../../util/buffer.ts";

export async function command(
  denops: Denops,
  bufnr: number,
): Promise<void> {
  await buffer.reload(denops, bufnr);
}
