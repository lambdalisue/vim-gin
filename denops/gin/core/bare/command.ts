import { autocmd, batch, Denops, flags, fn, option } from "../../deps.ts";
import { echo, echoerr } from "../../util/helper.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import * as buffer from "../../util/buffer.ts";
import { getWorktreeFromOpts } from "../../util/worktree.ts";
import { decodeUtf8 } from "../../util/text.ts";
import { run } from "../../git/process.ts";

export async function command(
  denops: Denops,
  args: string[],
): Promise<void> {
  await autocmd.emit(denops, "User", "GinCommandPre", {
    nomodeline: true,
  });
  const opts = parseArgs(await normCmdArgs(denops, args));
  const worktree = await getWorktreeFromOpts(denops, opts);
  const env = await fn.environ(denops) as Record<string, string>;
  const proc = run(await normCmdArgs(denops, opts._.map((v) => v.toString())), {
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
  if (opts["-buffer"]) {
    await denops.cmd("enew");
    const bufnr = await fn.bufnr(denops);
    await buffer.ensure(denops, bufnr, async () => {
      await batch.batch(denops, async (denops) => {
        await option.modifiable.setLocal(denops, false);
        await denops.cmd("execute 'lcd' fnameescape(cwd)", { cwd: worktree });
      });
      await buffer.editData(denops, new Uint8Array([...stdout, ...stderr]), {
        silent: true,
        keepalt: true,
        keepjumps: true,
      });
    });
    await buffer.concrete(denops, bufnr);
  } else {
    if (status.success) {
      await echo(denops, decodeUtf8(stdout) + decodeUtf8(stderr));
    } else {
      await echoerr(denops, decodeUtf8(stdout) + decodeUtf8(stderr));
    }
  }
  if (status.success) {
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
      {
        nested: true,
      },
    );
  });
}

function parseArgs(args: string[]): flags.Args {
  const opts: flags.Args = {
    "_": [],
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--") {
      opts._.push(...args.slice(i));
      break;
    }
    if (arg.startsWith("---worktree=")) {
      opts["-worktree"] = arg.replace(/^---worktree=/, "");
      continue;
    }
    if (arg === "---buffer") {
      opts["-buffer"] = true;
      continue;
    }
    opts._.push(arg);
  }
  return opts;
}
