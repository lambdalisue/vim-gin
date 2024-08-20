import type { Denops } from "jsr:@denops/std@^7.0.0";
import { assert, ensure, is } from "jsr:@core/unknownutil@^4.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import * as helper from "jsr:@denops/std@^7.0.0/helper";
import { parse, validateOpts } from "jsr:@denops/std@^7.0.0/argument";
import { fillCmdArgs, normCmdArgs } from "../../util/cmd.ts";
import { exec } from "./command.ts";

type Range = readonly [number, number];

const isRange = is.TupleOf([is.Number, is.Number] as const);

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "browse:command": (args, range) => {
      assert(args, is.ArrayOf(is.String), { name: "args" });
      assert(range, is.UnionOf([is.Undefined, isRange]), { name: "range" });
      return helper.friendlyCall(
        denops,
        () =>
          command(denops, args, {
            range,
          }),
      );
    },
  };
}

type CommandOptions = {
  range?: Range;
};

async function command(
  denops: Denops,
  args: string[],
  options: CommandOptions = {},
): Promise<void> {
  args = await fillCmdArgs(denops, args, "browse");
  args = await normCmdArgs(denops, args);

  const [opts, flags, residue] = parse(args);
  validateOpts(opts, [
    "worktree",
    "repository",
    "yank",
  ]);

  const [commitish, rawpath] = parseResidue(residue);
  const path = formatPath(await ensurePath(denops, rawpath), options.range);
  await exec(denops, commitish ?? "HEAD", {
    worktree: opts.worktree,
    yank: opts.yank === "" ? true : (opts.yank ?? false),
    noBrowser: ("n" in flags || "no-browser" in flags),
    remote: ensure(flags.remote, is.UnionOf([is.Undefined, is.String]), {
      "message": "REMOTE in --remote={REMOTE} must be string",
    }),
    path: "repository" in opts ? undefined : path,
    home: "home" in flags,
    commit: "commit" in flags,
    pr: "pr" in flags,
    permalink: "permalink" in flags,
  });
}

function parseResidue(
  residue: string[],
): [string | undefined, string | undefined] {
  switch (residue.length) {
    // GinBrowse [{options}]
    case 0:
      return [undefined, undefined];
    // GinBrowse [{options}] {commitish}
    case 1:
      return [residue[0], undefined];
    // GinBrowse [{options}] {commitish} {path}
    case 2:
      return [residue[0], residue[1]];
    default:
      throw new Error("Invalid number of arguments");
  }
}

async function ensurePath(
  denops: Denops,
  path?: string,
): Promise<string> {
  const bufname = await fn.expand(denops, path ?? "%") as string;
  const abspath = await fn.fnamemodify(denops, bufname, ":p");
  if (path) {
    return abspath;
  }
  const [buftype, cwd] = await batch.collect(denops, (denops) => [
    fn.getbufvar(denops, "%", "&buftype") as Promise<string>,
    fn.getcwd(denops),
  ]);
  return buftype ? cwd : abspath;
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
