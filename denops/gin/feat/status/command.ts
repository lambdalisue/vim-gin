import { batch, bufname, Denops, flags, fn, option, vars } from "../../deps.ts";
import * as buffer from "../../util/buffer.ts";
import { toBooleanArgs, toStringArgs } from "../../util/arg.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { getWorktree } from "../../util/worktree.ts";
import { Entry, GitStatusResult, parse } from "./parser.ts";
import { render } from "./render.ts";
import { execute } from "../../git/process.ts";
import { bind } from "../../core/bare/command.ts";
import {
  Candidate as CandidateBase,
  Range,
  register as registerGatherer,
} from "../../core/action/registry.ts";

type Candidate = Entry & CandidateBase;

export async function command(
  denops: Denops,
  args: string[],
): Promise<void> {
  const opts = parseArgs(await normCmdArgs(denops, args));
  const worktree = opts["-worktree"]
    ? await fn.fnamemodify(denops, opts["-worktree"], ":p") as string
    : await getWorktree(denops);
  const bname = bufname.format({
    scheme: "ginstatus",
    expr: worktree,
    params: {
      ...opts,
      _: undefined,
    },
  });
  await buffer.open(denops, bname.toString());
}

export async function read(denops: Denops): Promise<void> {
  const [bufnr, bname] = await batch.gather(denops, async (denops) => {
    await fn.bufnr(denops, "%");
    await fn.bufname(denops, "%");
  }) as [number, string];
  const { expr, params } = bufname.parse(bname);
  const args = [
    "status",
    "--porcelain=v2",
    "--branch",
    "--ahead-behind",
    "-z",
    ...toStringArgs(params, "untracked-files"),
    ...toStringArgs(params, "ignore-submodules"),
    ...toStringArgs(params, "ignored"),
    ...toBooleanArgs(params, "renames", {
      flagFalse: "--no-renames",
    }),
    ...toStringArgs(params, "find-renames"),
    ...toStringArgs(params, "--", { flag: "--" }),
  ];
  const stdout = await execute(args, {
    noOptionalLocks: true,
    cwd: expr,
  });
  const result = parse(stdout);
  // Sort entries by its path
  result.entries.sort((a, b) =>
    a.path == b.path ? 0 : a.path > b.path ? 1 : -1
  );
  const content = render(result);
  await registerGatherer(denops, getCandidates);
  await batch.batch(denops, async (denops) => {
    await bind(denops, bufnr);
    await option.filetype.setLocal(denops, "gin-status");
    await option.modifiable.setLocal(denops, false);
    await vars.b.set(denops, "gin_status_result", result);
    await denops.call("gin#internal#feat#status#core#init");
  });
  await buffer.replace(denops, bufnr, content);
  await buffer.concrete(denops, bufnr);
}

async function getCandidates(
  denops: Denops,
  [start, end]: Range,
): Promise<Candidate[]> {
  const result = await vars.b.get(denops, "gin_status_result") as
    | GitStatusResult
    | null;
  if (!result) {
    return [];
  }
  start = Math.max(start, 2);
  end = Math.max(end, 2);
  return result.entries.slice(start - 2, end - 2 + 1).map((entry) => ({
    ...entry,
    value: entry.path,
  }));
}

function parseArgs(
  args: string[],
): flags.Args {
  return flags.parse(args, {
    "--": true,
    string: [
      "-worktree",
    ],
    boolean: true,
    alias: {
      "u": "untracked-files",
    },
  });
}
