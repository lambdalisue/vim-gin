import { autocmd, batch, Denops, unknownutil } from "../../deps.ts";
import { command, read } from "./command.ts";

export async function main(denops: Denops): Promise<void> {
  denops.dispatcher = {
    ...denops.dispatcher,
    "status:command": (...args) => {
      unknownutil.ensureArray(args, unknownutil.isString);
      return command(denops, ...args);
    },
    "status:read": () => read(denops),
  };
  await batch.batch(denops, async (denops) => {
    await autocmd.group(denops, "ginstatus_internal", (helper) => {
      helper.remove("*");
      helper.define(
        "BufReadCmd",
        "ginstatus://*",
        `call denops#request('${denops.name}', "status:read", [])`,
      );
    });
    await denops.cmd(
      `command! -bar -nargs=* GinStatus call denops#notify('${denops.name}', 'status:command', [<f-args>])`,
    );
  });
}
