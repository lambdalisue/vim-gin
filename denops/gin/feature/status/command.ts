import { batch, bufname, Denops, flags, fn, option, vars } from "../../deps.ts";
import * as buffer from "../../util/buffer.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import {
  Entry,
  execStatus,
  GitStatusResult,
  render,
  StatusOptions,
} from "../../git/command/status/mod.ts";
import { find } from "../../git/finder.ts";
import { bind } from "../native/command.ts";
import {
  Candidate as CandidateBase,
  Range,
  register as registerGatherer,
} from "../action/registry.ts";

type Candidate = Entry & CandidateBase;

export async function command(
  denops: Denops,
  ...args: string[]
): Promise<void> {
  const opts = flags.parse(await normCmdArgs(denops, args));
  const options: StatusOptions = {
    untrackedFiles: opts["untracked-files"] ?? "all",
    ignoreSubmodules: opts["ignore-submodules"],
    ignored: opts["ignored"],
    renames: opts["renames"],
    findRenames: opts["findRenames"],
  };
  const cwd = (opts._[0] ?? await fn.getcwd(denops, 0)) as string;
  const worktree = await find(cwd);
  const bname = bufname.format({
    scheme: "ginstatus",
    expr: worktree,
    params: toBufnameParams(options),
  });
  await buffer.open(denops, bname.toString());
}

export async function read(denops: Denops): Promise<void> {
  const [bufnr, bname] = await batch.gather(denops, async (denops) => {
    await fn.bufnr(denops, "%");
    await fn.bufname(denops, "%");
  }) as [number, string];
  const { expr, params } = bufname.parse(bname);
  const options = fromBufnameParams(params ?? {});
  const result = await execStatus({ ...options, cwd: expr });
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
    await denops.call("gin#internal#feature#status#core#init");
  });
  await buffer.replace(denops, bufnr, content);
  await buffer.concrete(denops, bufnr);
}

function toBufnameParams(options: StatusOptions): bufname.BufnameParams {
  return Object.fromEntries(
    Object.entries(options).map(([k, v]) => {
      if (typeof v === "boolean") {
        return v ? [k, ""] : [k, undefined];
      } else if (typeof v === "number") {
        return [k, v.toString()];
      }
      return [k, v];
    }),
  );
}

function fromBufnameParams(params: bufname.BufnameParams): StatusOptions {
  return { ...params } as unknown as StatusOptions;
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
