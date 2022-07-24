import type { Denops } from "https://deno.land/x/denops_std@v3.3.0/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v3.3.0/batch/mod.ts";
import * as bufname from "https://deno.land/x/denops_std@v3.3.0/bufname/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.3.0/function/mod.ts";
import * as option from "https://deno.land/x/denops_std@v3.3.0/option/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v3.3.0/variable/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.0.0/mod.ts";
import {
  formatFlags,
  parse,
  validateFlags,
  validateOpts,
} from "https://deno.land/x/denops_std@v3.3.0/argument/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.3.0/buffer/mod.ts";
import { expand, normCmdArgs } from "../../util/cmd.ts";
import {
  findWorktreeFromSuspects,
  listWorktreeSuspectsFromDenops,
} from "../../util/worktree.ts";
import { execute } from "../../git/process.ts";
import { bind } from "../../core/bare/command.ts";
import { Branch, GitBranchResult, parse as parseBranch } from "./parser.ts";
import { render } from "./render.ts";
import {
  Candidate as CandidateBase,
  Range,
  register as registerGatherer,
} from "../../core/action/registry.ts";

type Candidate = Branch & CandidateBase;

export async function command(denops: Denops, args: string[]): Promise<void> {
  const [verbose] = await batch.gather(
    denops,
    async (denops) => {
      await option.verbose.get(denops);
    },
  );
  unknownutil.assertNumber(verbose);

  const [opts, flags, residues] = parse(await normCmdArgs(denops, args));
  validateOpts(opts, ["worktree"]);
  validateFlags(flags, [
    "a",
    "all",
    "r",
    "remotes",
    "i",
    "ignore-case",
    "abbrev",
    "no-abbrev",
  ]);
  const worktree = await findWorktreeFromSuspects(
    opts["worktree"]
      ? [await expand(denops, opts["worktree"])]
      : await listWorktreeSuspectsFromDenops(denops, !!verbose),
    !!verbose,
  );
  const bname = bufname.format({
    scheme: "ginbranch",
    expr: worktree,
    params: {
      ...flags,
    },
    fragment: residues.join(" "),
  });
  await buffer.open(denops, bname.toString());
}

export async function read(denops: Denops): Promise<void> {
  const [bufnr, bname] = await batch.gather(denops, async (denops) => {
    await fn.bufnr(denops, "%");
    await fn.bufname(denops, "%");
  });
  unknownutil.assertNumber(bufnr);
  unknownutil.assertString(bname);
  const { expr, params, fragment } = bufname.parse(bname);
  const flags = params ?? {};
  const args = [
    "branch",
    "--list",
    "-vv",
    ...formatFlags(flags),
    ...(fragment ? [fragment] : []),
  ];
  const [env, verbose] = await batch.gather(denops, async (denops) => {
    await fn.environ(denops);
    await option.verbose.get(denops);
  });
  unknownutil.assertObject(env, unknownutil.isString);
  unknownutil.assertNumber(verbose);
  const stdout = await execute(args, {
    printCommand: !!verbose,
    noOptionalLocks: true,
    cwd: expr,
    env,
  });
  const result = parseBranch(stdout);
  // Sort branches by its branch name
  result.branches.sort((a, b) =>
    a.target == b.target ? 0 : a.target > b.target ? 1 : -1
  );
  const content = render(result);
  await registerGatherer(denops, bufnr, getCandidates);
  await buffer.ensure(denops, bufnr, async () => {
    await batch.batch(denops, async (denops) => {
      await bind(denops, bufnr);
      await option.filetype.setLocal(denops, "gin-branch");
      await option.bufhidden.setLocal(denops, "unload");
      await option.buftype.setLocal(denops, "nofile");
      await option.swapfile.setLocal(denops, false);
      await option.modifiable.setLocal(denops, false);
      await vars.b.set(denops, "gin_branch_result", result);
      await denops.call("gin#internal#feat#branch#core#init");
    });
  });
  await buffer.replace(denops, bufnr, content);
  await buffer.concrete(denops, bufnr);
}

async function getCandidates(
  denops: Denops,
  bufnr: number,
  [start, end]: Range,
): Promise<Candidate[]> {
  const result = (await fn.getbufvar(denops, bufnr, "gin_branch_result")) as
    | GitBranchResult
    | null;
  if (!result) {
    return [];
  }
  start = Math.max(start, 1);
  end = Math.max(end, 1);
  return result.branches.slice(start - 1, end - 1 + 1).map((branch) => ({
    ...branch,
    value: branch.branch,
  }));
}
