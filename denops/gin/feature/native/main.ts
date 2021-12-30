import { Denops, unknownutil } from "../../deps.ts";
import { command } from "./command.ts";

export async function main(denops: Denops): Promise<void> {
  denops.dispatcher = {
    ...denops.dispatcher,
    "native:command": (...args: unknown[]) => {
      unknownutil.ensureArray(args, unknownutil.isString);
      return command(denops, ...args);
    },
  };
}
