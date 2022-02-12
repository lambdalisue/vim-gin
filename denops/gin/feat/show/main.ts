import { Denops, unknownutil } from "../../deps.ts";
import { featCall } from "../../util/helper.ts";
import { command, read } from "./command.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "show:command": (...args) => {
      unknownutil.ensureArray(args, unknownutil.isString);
      return featCall(denops, () => command(denops, args, false));
    },
    "show:command:file": (...args) => {
      unknownutil.ensureArray(args, unknownutil.isString);
      return featCall(denops, () => command(denops, args, true));
    },
    "show:read": () => featCall(denops, () => read(denops)),
  };
}
