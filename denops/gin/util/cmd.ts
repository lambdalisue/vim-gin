import { Denops } from "../deps.ts";
import { parseTreeish } from "../git/treeish.ts";

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
  nested = false,
): Promise<string> {
  if (cache.has(arg)) {
    return await cache.get(arg)!;
  }
  if (arg.startsWith("%") || arg.startsWith("#")) {
    const p = denops.call("gin#internal#util#cmd#expand", arg) as Promise<
      string
    >;
    cache.set(arg, p);
    return await p;
  }
  if (!nested) {
    const [commitish, path] = parseTreeish(arg);
    if (path) {
      arg = `${commitish}:${await normCmdArg(denops, path, cache, true)}`;
    }
  }
  return arg.replaceAll(/^\\(%|#)/g, "$1");
}
