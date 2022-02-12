import { Denops, unknownutil } from "../../deps.ts";
import { featCall } from "../../util/helper.ts";
import { command, read, write } from "./command.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "edit:command": (...args) => {
      unknownutil.ensureArray(args, unknownutil.isString);
      return featCall(denops, () => command(denops, args));
    },
    "edit:read": () => featCall(denops, () => read(denops)),
    "edit:write": () => featCall(denops, () => write(denops)),
  };
}
