import type { Denops } from "https://deno.land/x/denops_std@v3.7.1/mod.ts";
import * as autocmd from "https://deno.land/x/denops_std@v3.7.1/autocmd/mod.ts";
import * as batch from "https://deno.land/x/denops_std@v3.7.1/batch/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.7.1/function/mod.ts";
import * as helper from "https://deno.land/x/denops_std@v3.7.1/helper/mod.ts";
import * as option from "https://deno.land/x/denops_std@v3.7.1/option/mod.ts";
import {
  parseOpts,
  validateOpts,
} from "https://deno.land/x/denops_std@v3.7.1/argument/mod.ts";
import { expand, normCmdArgs } from "../../util/cmd.ts";
import * as buffer from "https://deno.land/x/denops_std@v3.7.1/buffer/mod.ts";
import {
  buildDecorationsFromAnsiEscapeCode,
  removeAnsiEscapeCode,
} from "../../util/ansi_escape_code.ts";
import {
  findWorktreeFromSuspects,
  listWorktreeSuspectsFromDenops,
} from "../../util/worktree.ts";
import { decodeUtf8 } from "../../util/text.ts";
import { run } from "../../git/process.ts";

export type Options = {
  worktree?: string;
  buffer?: boolean | string;
  monochrome?: boolean;
  fileformat?: string;
  encoding?: string;
};

export async function command(
  denops: Denops,
  args: string[],
): Promise<void> {
  const [opts, residue] = parseOpts(await normCmdArgs(denops, args));
  validateOpts(opts, [
    "worktree",
    "buffer",
    "monochrome",
    "ff",
    "fileformat",
    "enc",
    "encoding",
  ]);
  const buffer = opts["buffer"] === "" ? true : opts["buffer"];
  const options = {
    worktree: opts["worktree"],
    buffer,
    monochrome: "monochrome" in opts,
    fileformat: opts["ff"] ?? opts["fileformat"],
    encoding: opts["enc"] ?? opts["encoding"],
  };
  await exec(denops, residue, options);
}

export async function exec(
  denops: Denops,
  args: string[],
  options: Options = {},
): Promise<void> {
  const [env, verbose, eventignore] = await batch.gather(
    denops,
    async (denops) => {
      await fn.environ(denops);
      await option.verbose.get(denops);
      await option.eventignore.get(denops);
    },
  ) as [Record<string, string>, number, string];

  const enableColor = options.buffer && !options.monochrome;
  const cmd = [
    ...(enableColor ? ["-c", "color.ui=always"] : []),
    ...args,
  ];
  const worktree = await findWorktreeFromSuspects(
    options.worktree
      ? [await expand(denops, options.worktree)]
      : await listWorktreeSuspectsFromDenops(denops, !!verbose),
    !!verbose,
  );
  const proc = run(cmd, {
    printCommand: !!verbose,
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
    noOptionalLocks: true,
    cwd: worktree,
    env,
  });
  const [status, stdout, stderr] = await Promise.all([
    proc.status(),
    proc.output(),
    proc.stderrOutput(),
  ]);
  proc.close();
  const result = new Uint8Array([...stdout, ...stderr]);
  if (options.buffer) {
    let bufnr: number;
    if (typeof options.buffer === "string") {
      bufnr = await fn.bufnr(denops, options.buffer);
      if (bufnr === -1) {
        bufnr = await fn.bufnr(denops, Number(options.buffer));
      }
      await fn.bufload(denops, bufnr);
    } else {
      await denops.cmd("noswapfile enew");
      bufnr = await fn.bufnr(denops);
    }
    const { content, fileformat, fileencoding } = await buffer.decode(
      denops,
      bufnr,
      result,
      {
        fileformat: options.fileformat,
        fileencoding: options.encoding,
      },
    );
    const [trimmed, decorations] = buildDecorationsFromAnsiEscapeCode(content);
    await buffer.replace(denops, bufnr, trimmed, {
      fileformat,
      fileencoding,
    });
    await buffer.decorate(denops, bufnr, decorations);
    await buffer.concrete(denops, bufnr);
    await batch.batch(denops, async (denops) => {
      await fn.setbufvar(denops, bufnr, "&modifiable", 0);
    });
    if (denops.meta.host === "vim") {
      await denops.cmd("redraw");
    }
  } else {
    if (status.success) {
      await helper.echo(
        denops,
        removeAnsiEscapeCode(decodeUtf8(result)),
      );
    } else {
      await helper.echoerr(
        denops,
        removeAnsiEscapeCode(decodeUtf8(result)),
      );
    }
  }
  if (status.success && !eventignore.includes("all")) {
    await autocmd.emit(denops, "User", "GinCommandPost", {
      nomodeline: true,
    });
  }
}

export async function bind(denops: Denops, bufnr: number): Promise<void> {
  await autocmd.group(denops, `gin_bare_command_bind_${bufnr}`, (helper) => {
    helper.remove();
    helper.define(
      "User",
      "GinCommandPost",
      `call gin#util#reload(${bufnr})`,
    );
  });
}
