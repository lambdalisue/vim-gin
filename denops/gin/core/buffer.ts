import type { Denops } from "https://deno.land/x/denops_std@v3.7.1/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v0.1.0/mod.ts";
import * as option from "https://deno.land/x/denops_std@v3.7.1/option/mod.ts";
import {
  format as formatBufname,
} from "https://deno.land/x/denops_std@v3.7.1/bufname/mod.ts";
import { expand } from "../util/cmd.ts";
import {
  findWorktreeFromSuspects,
  listWorktreeSuspectsFromDenops,
} from "../util/worktree.ts";

export type FormatOptions = {
  worktree?: string;
  monochrome?: boolean;
};

export async function format(
  denops: Denops,
  scheme: string,
  args: string[],
  options: FormatOptions,
): Promise<string> {
  const verbose = await option.verbose.get(denops);

  const worktree = await findWorktreeFromSuspects(
    options.worktree
      ? [await expand(denops, options.worktree)]
      : await listWorktreeSuspectsFromDenops(denops, !!verbose),
    !!verbose,
  );
  return formatBufname({
    scheme,
    expr: worktree,
    params: {
      monochrome: unnullish(options.monochrome, () => "") ?? undefined,
    },
    fragment: `${args.join(" ")}$`,
  });
}
