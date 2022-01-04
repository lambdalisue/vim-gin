import { bufname, Denops, flags, fn } from "../deps.ts";
import { find } from "../git/finder.ts";

const GIN_FILE_BUFFER_PROTOCOLS = [
  "gindiff://",
  "ginshow://",
];

export async function normCmdArgs(
  denops: Denops,
  args: string[],
): Promise<string[]> {
  // To reduce RPC, cache result of an arg which starts from '%' or '#'
  const cache: Map<string, Promise<string>> = new Map();
  return await Promise.all(args.map((arg) => normCmdArg(denops, arg, cache)));
}

async function normCmdArg(
  denops: Denops,
  arg: string,
  cache: Map<string, Promise<string>>,
): Promise<string> {
  if (cache.has(arg)) {
    return await cache.get(arg)!;
  }
  if (arg.startsWith("%") || arg.startsWith("#")) {
    const p = expand(denops, arg);
    cache.set(arg, p);
    return await p;
  }
  return arg.replaceAll(/^\\(%|#)/g, "$1");
}

export async function expand(denops: Denops, expr: string): Promise<string> {
  const bname = await denops.call(
    "gin#internal#util#cmd#expand",
    expr,
  ) as string;
  for (const protocol of GIN_FILE_BUFFER_PROTOCOLS) {
    if (bname.startsWith(protocol)) {
      const { fragment } = bufname.parse(bname);
      return fragment ?? bname;
    }
  }
  return bname;
}

export async function getOrFindWorktree(
  denops: Denops,
  opts: flags.Args,
): Promise<string> {
  if (opts["-worktree"]) {
    return await fn.fnamemodify(denops, opts["-worktree"], ":p") as string;
  } else {
    const cwd = await fn.getcwd(denops) as string;
    return await find(cwd);
  }
}
