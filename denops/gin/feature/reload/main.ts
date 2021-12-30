import { batch, Denops, unknownutil } from "../../deps.ts";
import { command } from "./command.ts";

export async function main(denops: Denops): Promise<void> {
  denops.dispatcher = {
    ...denops.dispatcher,
    "reload:command": async (bufnr) => {
      if (bufnr == null) {
        bufnr = await denops.call('bufnr', '%');
      }
      unknownutil.ensureNumber(bufnr);
      return await command(denops, bufnr);
    },
  };
  await batch.batch(denops, async (denops) => {
    await denops.cmd(
      `command! -bar -nargs=? GinReload call denops#request('${denops.name}', 'reload:command', [<f-args>])`,
    );
  });
}
