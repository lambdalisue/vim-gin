import { batch, Denops, flags, fn, helper, option, vars } from "../../deps.ts";
import * as action from "../../core/action.ts";
import * as buffer from "../../core/buffer.ts";
import { normCmdArgs } from "../../core/cmd.ts";
import {
  Entry,
  execStatus,
  GitStatusResult,
  render,
  StatusOptions,
} from "../../git/command/status/mod.ts";
import { find } from "../../git/finder.ts";
import { BufnameParams, format, parse } from "../../core/bufname.ts";
import { initActions as initIndexActions } from "../../action/index.ts";
import { initActions as initPathActions } from "../../action/path.ts";

export async function command(
  denops: Denops,
  ...args: string[]
): Promise<void> {
  const opts = flags.parse(await normCmdArgs(denops, args));
  const options: StatusOptions = {
    untrackedFiles: opts["untracked-files"],
    ignoreSubmodules: opts["ignore-submodules"],
    ignored: opts["ignored"],
    renames: opts["renames"],
    findRenames: opts["findRenames"],
  };
  const cwd = (opts._[0] ?? await fn.getcwd(denops, 0)) as string;
  const worktree = await find(cwd);
  const bufname = format({
    scheme: "ginstatus",
    path: worktree,
    params: options,
  });
  await buffer.open(denops, bufname.toString());
}

export async function read(denops: Denops): Promise<void> {
  const [bufnr, bufname] = await batch.gather(denops, async (denops) => {
    await fn.bufnr(denops, "%");
    await fn.bufname(denops, "%");
  }) as [number, string];
  const { path, params } = parse(bufname);
  const options = fromBufnameParams(params ?? {});
  const result = await execStatus({ ...options, cwd: path });
  const content = render(result);
  await batch.batch(denops, async (denops) => {
    await option.filetype.setLocal(denops, "gin-status");
    await option.modifiable.setLocal(denops, false);
    await vars.b.set(denops, "gin_status_result", result);
    await action.init(denops);
    await initActions(denops);
  });
  await buffer.replace(denops, bufnr, content);
  await buffer.concrete(denops, bufnr);
}

function fromBufnameParams(params: BufnameParams): StatusOptions {
  return { ...params } as unknown as StatusOptions;
}

async function getCandidates(
  denops: Denops,
  [start, end]: [number, number],
): Promise<Entry[]> {
  const result = await vars.b.get(denops, "gin_status_result") as
    | GitStatusResult
    | null;
  if (!result) {
    return [];
  }
  return result.entries.slice(start - 2, end - 2 + 1);
}

async function initActions(denops: Denops): Promise<void> {
  await initPathActions(denops, getCandidates);
  await initIndexActions(denops, getCandidates);
  await action.register(denops, {
    echo: async (denops, range) => {
      const cs = await getCandidates(denops, range);
      await helper.echo(denops, JSON.stringify(cs, undefined, 2));
    },
  });
}
