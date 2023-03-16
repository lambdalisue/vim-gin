import type { Denops } from "https://deno.land/x/denops_std@v4.0.0/mod.ts";
import { Silent } from "https://deno.land/x/denops_std@v4.0.0/helper/mod.ts";
import { expand } from "./expand.ts";

export function parseDisableDefaultArgs(args: string[]): [boolean, string[]] {
  if (args.at(0) === "&") {
    return [true, args.slice(1)];
  }
  return [false, args];
}

export function parseSilent(mods: string): Silent {
  if (mods.indexOf("silent!") !== -1) {
    return "silent!";
  } else if (mods.indexOf("silent") !== -1) {
    return "silent";
  }
  return "";
}

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
