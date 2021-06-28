import { GitStatusResult, parse } from "./parser.ts";
import { execute } from "../../process.ts";

export type StatusOptions = {
  untrackedFiles?: "no" | "normal" | "all" | true;
  ignoreSubmodules?: "none" | "untracked" | "dirty" | "all" | true;
  ignored?: "traditional" | "no" | "matching" | true;
  renames?: boolean;
  findRenames?: number;
  cwd?: string;
};

export async function execStatus(
  options: StatusOptions = {},
): Promise<GitStatusResult> {
  const args = [
    "status",
    "--porcelain=v2",
    "--branch",
    "--ahead-behind",
    "-z",
  ];
  if (options.untrackedFiles) {
    if (typeof options.untrackedFiles === "boolean") {
      args.push("--untracked-files");
    } else {
      args.push(`--untracked-files=${options.untrackedFiles}`);
    }
  }
  if (options.ignoreSubmodules) {
    if (typeof options.ignoreSubmodules === "boolean") {
      args.push("--ignore-submodules");
    } else {
      args.push(`--ignore-submodules=${options.ignoreSubmodules}`);
    }
  }
  if (options.ignored) {
    if (typeof options.ignored === "boolean") {
      args.push("--ignored");
    } else {
      args.push(`--ignored=${options.ignored}`);
    }
  }
  if (options.renames) {
    args.push("--renames");
  }
  if (options.findRenames != undefined) {
    args.push("--find-renames", options.findRenames.toString());
  }
  const stdout = await execute(args, {
    noOptionalLocks: true,
    cwd: options.cwd,
  });
  return parse(stdout);
}
