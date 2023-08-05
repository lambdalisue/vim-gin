import type { Denops } from "https://deno.land/x/denops_std@v5.0.1/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v1.0.1/mod.ts";
import {
  assert,
  ensure,
  is,
} from "https://deno.land/x/unknownutil@v3.0.0/mod.ts#^";
import * as batch from "https://deno.land/x/denops_std@v5.0.1/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v5.0.1/function/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v5.0.1/variable/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v5.0.1/helper/mod.ts";
import {
  parse,
  validateFlags,
  validateOpts,
} from "https://deno.land/x/denops_std@v5.0.1/argument/mod.ts";
import { normCmdArgs, parseDisableDefaultArgs } from "../../util/cmd.ts";
import { exec } from "./command.ts";

type Range = readonly [number, number];

const isRange = is.TupleOf([is.Number, is.Number] as const);

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "browse:command": (args, range) => {
      assert(args, is.ArrayOf(is.String), { message: "args must be string[]" });
      assert(range, is.OneOf([is.Undefined, isRange]), {
        message: "range must be undefined | [number, number]",
      });
      const [disableDefaultArgs, realArgs] = parseDisableDefaultArgs(args);
      return helper.friendlyCall(
        denops,
        () =>
          command(denops, realArgs, {
            disableDefaultArgs,
            range,
          }),
      );
    },
  };
}

type CommandOptions = {
  disableDefaultArgs?: boolean;
  range?: Range;
};

async function command(
  denops: Denops,
  args: string[],
  options: CommandOptions = {},
): Promise<void> {
  if (!options.disableDefaultArgs) {
    const defaultArgs = await vars.g.get(
      denops,
      "gin_browse_default_args",
      [],
    );
    assert(defaultArgs, is.ArrayOf(is.String), {
      message: "g:gin_browse_default_args must be string[]",
    });
    args = [...defaultArgs, ...args];
  }
  const [opts, flags, residue] = parse(await normCmdArgs(denops, args));
  validateFlags(flags, [
    "remote",
    "permalink",
    "path",
    "home",
    "commit",
    "pr",
    "n",
    "no-browser",
  ]);
  validateOpts(opts, [
    "worktree",
    "yank",
  ]);
  const commitish = parseResidue(residue);
  const path = unnullish(
    await ensurePath(denops, opts.path),
    (p) => formatPath(p, options.range),
  );
  await exec(denops, commitish ?? "HEAD", {
    worktree: opts.worktree,
    yank: "yank" in opts,
    noBrowser: ("n" in flags || "no-browser" in flags),
    remote: ensure(flags.remote, is.OneOf([is.Undefined, is.String]), {
      "message": "REMOTE in --remote={REMOTE} must be string",
    }),
    path,
    home: "home" in flags,
    commit: "commit" in flags,
    pr: "pr" in flags,
    permalink: "permalink" in flags,
  });
}

function parseResidue(
  residue: string[],
): string | undefined {
  // GinBrowse [{options}] {commitish}
  switch (residue.length) {
    case 0:
      return undefined;
    case 1:
      return residue[0];
    default:
      throw new Error("Invalid number of arguments");
  }
}

async function ensurePath(
  denops: Denops,
  path?: string,
): Promise<string | undefined> {
  if (path) {
    return ensure(path, is.String, {
      message: "PATH in --path={PATH} must be string",
    });
  }
  const [bufname, buftype, cwd] = await batch.collect(denops, (denops) => [
    fn.expand(denops, "%:p") as Promise<string>,
    fn.getbufvar(denops, "%", "&buftype") as Promise<string>,
    fn.getcwd(denops),
  ]);
  return buftype ? cwd : bufname;
}

function formatPath(path: string, range?: Range): string {
  if (!range) {
    return path;
  }
  const [start, end] = range;
  if (start === end) {
    return `${path}:${start}`;
  }
  return `${path}:${start}:${end}`;
}
