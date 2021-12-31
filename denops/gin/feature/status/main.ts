import { Denops, unknownutil } from "../../deps.ts";
import { command, read } from "./command.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "status:command": (...args) => {
      unknownutil.ensureArray(args, unknownutil.isString);
      return command(denops, ...args);
    },
    "status:read": () => read(denops),
  };
}
