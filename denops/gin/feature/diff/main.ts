import { autocmd, batch, Denops, unknownutil } from "../../deps.ts";
import { command, read } from "./command.ts";

export async function main(denops: Denops): Promise<void> {
  denops.dispatcher = {
    ...denops.dispatcher,
    "diff:command": (...args) => {
      unknownutil.ensureArray(args, unknownutil.isString);
      return command(denops, ...args);
    },
    "diff:read": () => read(denops),
  };
  await batch.batch(denops, async (denops) => {
    await autocmd.group(denops, "gindiff_internal", (helper) => {
      helper.remove("*");
      helper.define(
        "BufReadCmd",
        "gindiff://*",
        `call denops#request('${denops.name}', "diff:read", [])`,
      );
    });
    await denops.cmd(
      `command! -bar -nargs=* GinDiff call denops#notify('${denops.name}', 'diff:command', [<f-args>])`,
    );
  });
}
