import type { Denops } from "https://deno.land/x/denops_std@v5.0.1/mod.ts";
import { unnullish } from "https://deno.land/x/unnullish@v1.0.1/unnullish.ts";
import * as helper from "https://deno.land/x/denops_std@v5.0.1/helper/mod.ts";
import { assert, is } from "https://deno.land/x/unknownutil@v3.9.0/mod.ts#^";
import * as vars from "https://deno.land/x/denops_std@v5.0.1/variable/mod.ts";
import {
  builtinOpts,
  formatOpts,
  parse,
  validateFlags,
  validateOpts,
} from "https://deno.land/x/denops_std@v5.0.1/argument/mod.ts";
import {
  normCmdArgs,
  parseDisableDefaultArgs,
  parseSilent,
} from "../../util/cmd.ts";
import { exec } from "./command.ts";
import { edit } from "./edit.ts";
import { read } from "./read.ts";

export function main(denops: Denops): void {
  denops.dispatcher = {
    ...denops.dispatcher,
    "log:command": (bang, mods, args) => {
      assert(bang, is.String, { name: "bang" });
      assert(mods, is.String, { name: "mods" });
      assert(args, is.ArrayOf(is.String), { name: "args" });
      const [disableDefaultArgs, realArgs] = parseDisableDefaultArgs(args);
      const silent = parseSilent(mods);
      return helper.ensureSilent(denops, silent, () => {
        return helper.friendlyCall(
          denops,
          () =>
            command(denops, bang, mods, realArgs, {
              disableDefaultArgs,
            }),
        );
      });
    },
    "log:edit": (bufnr, bufname) => {
      assert(bufnr, is.Number, { name: "bufnr" });
      assert(bufname, is.String, { name: "bufname" });
      return helper.friendlyCall(denops, () => edit(denops, bufnr, bufname));
    },
    "log:read": (bufnr, bufname) => {
      assert(bufnr, is.Number, { name: "bufnr" });
      assert(bufname, is.String, { name: "bufname" });
      return helper.friendlyCall(denops, () => read(denops, bufnr, bufname));
    },
  };
}

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

type CommandOptions = {
  disableDefaultArgs?: boolean;
};

async function command(
  denops: Denops,
  bang: string,
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
    assert(defaultArgs, is.ArrayOf(is.String), {
      name: "g:gin_log_default_args",
    });
    args = [...defaultArgs, ...args];
  }
  const [opts, flags, residue] = parse(await normCmdArgs(denops, args));
  validateOpts(opts, [
    "worktree",
    "opener",
    "emojify",
    ...builtinOpts,
  ]);
  validateFlags(flags, allowedFlags);
  const [commitish, paths] = parseResidue(residue);
  await exec(denops, {
    worktree: opts.worktree,
    commitish,
    paths,
    flags,
    opener: opts.opener,
    emojify: unnullish(opts.emojify, () => true),
    cmdarg: formatOpts(opts, builtinOpts).join(" "),
    mods,
    bang: bang === "!",
  });
}

function parseResidue(residue: string[]): [string | undefined, string[]] {
  const index = residue.indexOf("--");
  const head = index === -1 ? residue : residue.slice(0, index);
  const tail = index === -1 ? [] : residue.slice(index + 1);
  // GinLog [{options}]
  // GinLog [{options}] {commitish}
  // GinLog [{options}] -- {pathspec}...
  // GinLog [{options}] {commitish} -- {pathspec}...
  switch (head.length) {
    case 0:
      return [undefined, tail];
    case 1:
      return [head[0], tail];
    default:
      throw new Error("Invalid number of arguments");
  }
}
