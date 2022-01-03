import { Denops, unknownutil } from "../../deps.ts";
import { command } from "./command.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "reload:command": (bufnr) => {
      unknownutil.ensureNumber(bufnr);
      return command(denops, bufnr);
    },
  };
}
