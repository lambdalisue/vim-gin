import { Denops, unknownutil } from "../../deps.ts";
import { featCall } from "../../util/helper.ts";
import { command, read } from "./command.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "status:command": (...args) => {
      unknownutil.ensureArray(args, unknownutil.isString);
      return featCall(denops, () => command(denops, args));
    },
    "status:read": () => featCall(denops, () => read(denops)),
  };
}
