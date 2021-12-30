import { Denops, unknownutil } from "../../deps.ts";
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
}
