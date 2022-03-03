import { Denops, helper, unknownutil } from "../../deps.ts";
import { command, read } from "./command.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "status:command": (...args) => {
      unknownutil.assertArray(args, unknownutil.isString);
      return helper.friendlyCall(denops, () => command(denops, args));
    },
    "status:read": () => helper.friendlyCall(denops, () => read(denops)),
  };
}
