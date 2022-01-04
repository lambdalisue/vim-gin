import { Denops, helper, mapping, vars } from "../../deps.ts";

export type Action = {
  name: string;
  lhs: string;
  rhs: string;
};

export type Range = [number, number];

export async function list(denops: Denops): Promise<Action[]> {
  const ms = await mapping.list(denops, "<Plug>(gin-action-", { mode: "n" });
  const cs = ms.flatMap((map) => {
    const m = map.lhs.match(/^<Plug>\(gin-action-(.*)\)$/);
    if (!m) {
      return [];
    }
    return [{
      lhs: map.lhs,
      rhs: map.rhs,
      name: m[1],
    }];
  });
  return cs;
}

export async function actionChoice(
  denops: Denops,
  range: Range,
): Promise<void> {
  const cs = await list(denops);
  const name = await helper.input(denops, {
    prompt: "action: ",
    completion: (
      arglead: string,
      _cmdline: string,
      _cursorpos: number,
    ) => {
      return Promise.resolve(
        cs.filter((c) => c.name.startsWith(arglead)).map((c) => c.name),
      );
    },
  });
  if (name == null) {
    return;
  }
  await denops.call("gin#action#call", name, range);
  await vars.b.set(denops, "denops_action_previous", name);
}

export async function actionRepeat(
  denops: Denops,
  range: Range,
): Promise<void> {
  const name = await vars.b.get(denops, "denops_action_previous", null) as
    | string
    | null;
  if (name == null) {
    await helper.echo(denops, "[gin] Nothing to repeat");
    return;
  }
  await denops.call("gin#action#call", name, range);
}

export async function actionHelp(denops: Denops, _range: Range): Promise<void> {
  await helper.echo(denops, "[gin] Not implemented yet");
}
