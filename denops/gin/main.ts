import { Denops } from "./deps.ts";
import { main as mainNative } from "./feature/native/main.ts";

export async function main(denops: Denops): Promise<void> {
  await mainNative(denops);
}
