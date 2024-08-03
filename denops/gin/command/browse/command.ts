import type { Denops } from "jsr:@denops/std@^7.0.0";
import { unnullish } from "jsr:@lambdalisue/unnullish@^1.0.0";
import { assert, is } from "jsr:@core/unknownutil@^4.0.0";
import { systemopen } from "jsr:@lambdalisue/systemopen@^1.0.0";
import { getURL, Options } from "jsr:@lambdalisue/git-browse@^1.0.1/cli";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import * as vars from "jsr:@denops/std@^7.0.0/variable";
import * as path from "jsr:@std/path@^1.0.0";
import * as option from "jsr:@denops/std@^7.0.0/option";
import { findWorktreeFromDenops } from "../../git/worktree.ts";
import { yank } from "../../util/yank.ts";

export type ExecOptions = Omit<Options, "cwd" | "aliases"> & {
  worktree?: string;
  yank?: string | boolean;
  noBrowser?: boolean;
};

export async function exec(
  denops: Denops,
  commitish: string,
  options: ExecOptions = {},
): Promise<void> {
  const [verbose, aliases] = await batch.collect(denops, (denops) => [
    option.verbose.get(denops),
    vars.g.get(denops, "gin_browse_aliases", {}),
  ]);
  assert(aliases, is.RecordOf(is.String), {
    name: "g:gin_browse_aliases",
  });

  const worktree = await findWorktreeFromDenops(denops, {
    worktree: options.worktree,
    verbose: !!verbose,
  });

  options.path = unnullish(
    options.path,
    (p) => path.isAbsolute(p) ? path.relative(worktree, p) : p,
  );
  options.path = unnullish(
    options.path,
    (p) => p === "" ? "." : p,
  );
  const url = await getURL(commitish, {
    cwd: worktree,
    remote: options.remote,
    path: options.path,
    home: options.home,
    commit: options.commit,
    pr: options.pr,
    permalink: options.permalink,
    aliases,
  });

  if (options.yank != null && options.yank !== false) {
    await yank(
      denops,
      url.href,
      options.yank === true ? undefined : options.yank,
    );
  }
  if (options.noBrowser) {
    await denops.cmd("echomsg url", { url: url.href });
  } else {
    await systemopen(url.href);
  }
}
