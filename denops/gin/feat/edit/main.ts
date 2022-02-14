import { Denops, helper, unknownutil } from "../../deps.ts";
import { command, read, write } from "./command.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "edit:command": (...args) => {
      unknownutil.ensureArray(args, unknownutil.isString);
      return helper.friendlyCall(denops, () => command(denops, args));
    },
    "edit:read": () => helper.friendlyCall(denops, () => read(denops)),
    "edit:write": () => helper.friendlyCall(denops, () => write(denops)),
  };
}
