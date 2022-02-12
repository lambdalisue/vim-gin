import { Denops, autocmd, path, helper } from "../../deps.ts";
import * as flags from "../../util/flags.ts";
import { normCmdArgs } from "../../util/cmd.ts";
import { getWorktreeFromOpts } from "../../util/worktree.ts";
import { run, execute } from "../../git/process.ts";

export async function command(
  denops: Denops,
  args: string[],
): Promise<void> {
  await autocmd.emit(denops, "User", "GinCommandPre", {
    nomodeline: true,
  });
  const [opts, abspaths] = parseArgs(
    await normCmdArgs(denops, args),
  );
  const worktree = await getWorktreeFromOpts(denops, opts);
  const relpaths = abspaths.map(v => path.relative(worktree, v));


  const message = [
    `Are you sure to discard changes on the following files?`,
    "",
    ...relpaths.map(p => ` - ${p}`),
    "",
    "Type 'yes' to continue: ",
  ].join("\n");
  const v = await helper.input(denops, {
    prompt: message,
  });
  if (v !== "yes") {
    helper.echo(denops, "Cancel");
    return;
  }

  for (const relpath of relpaths) {
    const proc = run(["show", `:${relpath}`], {
      stdin: "null",
      stdout: "null",
      stderr: "null",
    });
    const status = await proc.status();
    if (status) {
      await Deno.remove(path.join(worktree, relpath));
    } else {
      await execute(["restore", relpath]);
    }
  }
  await autocmd.emit(denops, "User", "GinCommandPost", {
    nomodeline: true,
  });
}

function parseArgs(
  args: string[],
): [flags.Args, string[]] {
  const opts = flags.parse(args, []);
  return [opts, opts._.map(v => v.toString())];
}
