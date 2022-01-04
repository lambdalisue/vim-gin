import { Denops, unknownutil } from "../../deps.ts";
import { command } from "./command.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "native:command": (...args: unknown[]) => {
      unknownutil.ensureArray(args, unknownutil.isString);
      return command(denops, args);
    },
  };
}
