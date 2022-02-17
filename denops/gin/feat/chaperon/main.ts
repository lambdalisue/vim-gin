import { Denops, helper, unknownutil } from "../../deps.ts";
import { command } from "./command.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "chaperon:command": (...args) => {
      unknownutil.ensureArray(args, unknownutil.isString);
      return helper.friendlyCall(denops, () => command(denops, args));
    },
  };
}
