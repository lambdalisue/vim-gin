import type { Denops } from "https://deno.land/x/denops_std@v4.0.0/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v1.0.0/mod.ts";
import * as unknownutil from "https://deno.land/x/unknownutil@v2.1.0/mod.ts";
import * as buffer from "https://deno.land/x/denops_std@v4.0.0/buffer/mod.ts";
import * as option from "https://deno.land/x/denops_std@v4.0.0/option/mod.ts";
import * as vars from "https://deno.land/x/denops_std@v4.0.0/variable/mod.ts";
import {
  format as formatBufname,
} from "https://deno.land/x/denops_std@v4.0.0/bufname/mod.ts";
import {
  builtinOpts,
  Flags,
  formatOpts,
  parse,
  validateFlags,
  validateOpts,
} from "https://deno.land/x/denops_std@v4.0.0/argument/mod.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { findWorktreeFromDenops } from "../../util/worktree.ts";

const allowedFlags = [
  "follow",
  "no-decorate",
  "decorate",
  "decorate-refs",
  "decorate-refs-exclude",
  "source",
  "no-mailmap",
  "mailmap",
  "no-use-mailmap",
  "use-mailmap",
  "full-diff",
  "log-size",
  "L",
  "n",
  "max-count",
  "skip",
  "since",
  "after",
  "since-as-filter",
  "until",
  "before",
  "author",
  "committer",
  "grep-reflog",
  "grep",
  "all-match",
  "invert-grep",
  "i",
  "regexp-ignore-case",
  "basic-regexp",
  "E",
  "extended-regexp",
  "F",
  "fixed-strings",
  "P",
  "perl-regexp",
  "remove-empty",
  "merges",
  "no-merges",
  "min-parents",
  "max-parents",
  "no-min-parents",
  "no-max-parents",
  "first-parent",
  "exclude-first-parent-only",
  "not",
  "all",
  "branches",
  "tags",
  "remotes",
  "glob",
  "exclude",
  "reflog",
  "alternate-refs",
  "single-worktree",
  "ignore-missing",
  "bisect",
  "cherry-mark",
  "cherry-pick",
  "left-only",
  "right-only",
  "cherry",
  "g",
  "walk-reflogs",
  "merge",
  "boundary",
  "simplify-by-decoration",
  "show-pulls",
  "full-history",
  "dense",
  "sparse",
  "simplify-merges",
  "ancestry-path",
  "date-order",
  "author-date-order",
  "topo-order",
  "reverse",
  "no-walk",
  "do-walk",
  "pretty",
  "abbrev-commit",
  "no-abbrev-commit",
  "oneline",
  "encoding",
  "expand-tabs",
  "no-expand-tabs",
  "notes",
  "no-notes",
  "show-notes",
  "standard-notes",
  "no-standard-notes",
  "show-signature",
  "relative-date",
  "date",
  "parents",
  "children",
  "left-right",
  "graph",
  "show-linear-break",
  "p",
  "u",
  "patch",
  "s",
  "no-patch",
  "diff-merges",
  "no-diff-merges",
  "combined-all-paths",
  "U",
  "unified",
  "output",
  "output-indicator-new",
  "output-indicator-old",
  "output-indicator-context",
  "raw",
  "patch-with-raw",
  "t",
  "indent-heuristic",
  "no-indent-heuristic",
  "minimal",
  "patience",
  "histogram",
  "anchored",
  "diff-algorithm",
  "stat",
  "compact-summary",
  "numstat",
  "shortstat",
  "X",
  "dirstat",
  "cumulative",
  "dirstat-by-file",
  "summary",
  "patch-with-stat",
  "name-only",
  "name-status",
  "submodule",
  "color-moved",
  "no-color-moved",
  "color-moved-ws",
  "no-color-moved-ws",
  "word-diff",
  "word-diff-regex",
  "color-words",
  "no-renames",
  "rename-empty",
  "no-rename-empty",
  "check",
  "ws-error-highlight",
  "full-index",
  "binary",
  "abbrev",
  "B",
  "break-rewrites",
  "M",
  "find-renames",
  "C",
  "find-copies",
  "find-copies-harder",
  "D",
  "irreversible-delete",
  "l",
  "diff-filter",
  "S",
  "G",
  "find-object",
  "pickaxe-all",
  "pickaxe-regex",
  "O",
  "skip-to",
  "rotate-to",
  "R",
  "relative",
  "no-relative",
  "a",
  "text",
  "ignore-cr-at-eol",
  "ignore-space-at-eol",
  "b",
  "ignore-space-change",
  "w",
  "ignore-all-space",
  "ignore-blank-lines",
  "I",
  "ignore-matching-lines",
  "inter-hunk-context",
  "W",
  "function-context",
  "ext-diff",
  "no-ext-diff",
  "textconv",
  "no-textconv",
  "ignore-submodules",
  "src-prefix",
  "dst-prefix",
  "no-prefix",
  "line-prefix",
  "ita-invisible-in-index",
];

export type CommandOptions = {
  disableDefaultArgs?: boolean;
};

export async function command(
  denops: Denops,
  mods: string,
  args: string[],
  options: CommandOptions = {},
): Promise<void> {
  if (!options.disableDefaultArgs) {
    const defaultArgs = await vars.g.get(
      denops,
      "gin_log_default_args",
      [],
    );
    unknownutil.assertArray(defaultArgs, unknownutil.isString);
    args = [...defaultArgs, ...args];
  }
  const [opts, flags, residue] = parse(await normCmdArgs(denops, args));
  validateOpts(opts, [
    "worktree",
    "opener",
    ...builtinOpts,
  ]);
  validateFlags(flags, allowedFlags);
  await exec(denops, {
    worktree: opts.worktree,
    paths: residue,
    flags,
    opener: opts.opener,
    cmdarg: formatOpts(opts, builtinOpts).join(" "),
    mods,
  });
}

export type ExecOptions = {
  worktree?: string;
  paths?: string[];
  flags?: Flags;
  opener?: string;
  cmdarg?: string;
  mods?: string;
};

export async function exec(
  denops: Denops,
  options: ExecOptions = {},
): Promise<buffer.OpenResult> {
  const verbose = await option.verbose.get(denops);

  const worktree = await findWorktreeFromDenops(denops, {
    worktree: options.worktree,
    verbose: !!verbose,
  });

  const bufname = formatBufname({
    scheme: "ginlog",
    expr: worktree,
    params: {
      ...options.flags ?? {},
    },
    fragment: unnullish(options.paths, (v) => `${JSON.stringify(v)}$`),
  });
  return await buffer.open(denops, bufname, {
    opener: options.opener,
    cmdarg: options.cmdarg,
    mods: options.mods,
  });
}
