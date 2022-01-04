import { Denops, unknownutil } from "../../deps.ts";
import * as core from "./core.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "debug:get": () => {
      return Promise.resolve(core.get());
    },
    "debug:set": (value) => {
      unknownutil.ensureBoolean(value);
      core.set(value);
      return Promise.resolve();
    },
    "debug:report": (message) => {
      unknownutil.ensureString(message);
      core.report(message);
      return Promise.resolve();
    },
  };
}
