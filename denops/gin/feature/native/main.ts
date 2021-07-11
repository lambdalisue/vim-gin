import { autocmd, batch, Denops, unknownutil } from "../../deps.ts";
import { command } from "./command.ts";

export async function main(denops: Denops): Promise<void> {
  denops.dispatcher = {
    ...denops.dispatcher,
    "native:command": async (...args: unknown[]) => {
      unknownutil.ensureArray(args, unknownutil.isString);
      return await command(denops, ...args);
    },
  };
  await batch.batch(denops, async (denops) => {
    await denops.cmd(
      `command! -bar -nargs=* Gin call denops#notify('${denops.name}', 'native:command', [<f-args>])`,
    );
    await autocmd.group(denops, "gin_native_main_main", (helper) => {
      helper.remove();
      helper.define(
        "User",
        ["GinNativeCommandPre", "GinNativeCommandPost"],
        ":",
      );
    });
  });
}
