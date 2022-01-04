import { Denops, unknownutil } from "../../deps.ts";
import * as buffer from "../../util/buffer.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "util:reload": (bufnr) => {
      unknownutil.ensureNumber(bufnr);
      return buffer.reload(denops, bufnr);
    },
  };
}
