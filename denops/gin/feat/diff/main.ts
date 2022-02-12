import { Denops, unknownutil } from "../../deps.ts";
import { featCall } from "../../util/helper.ts";
import { command, read } from "./command.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "diff:command": (...args) => {
      unknownutil.ensureArray(args, unknownutil.isString);
      return featCall(denops, () => command(denops, args, false));
    },
    "diff:command:file": (...args) => {
      unknownutil.ensureArray(args, unknownutil.isString);
      return featCall(denops, () => command(denops, args, true));
    },
    "diff:read": () => featCall(denops, () => read(denops)),
  };
}
