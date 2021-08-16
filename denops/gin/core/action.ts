import {
  anonymous,
  batch,
  Denops,
  fn,
  helper,
  mapping,
  unknownutil,
  vars,
} from "../deps.ts";

export type Action = {
  name: string;
  lhs: string;
  rhs: string;
};

export type Range = [number, number];

export type Callback = (denops: Denops, range: Range) => void | Promise<void>;

export async function init(denops: Denops): Promise<void> {
  await helper.load(denops, new URL("./action.vim", import.meta.url));
  const [hasChoice, hasChoiceX, hasRepeat, hasRepeatX, hasHelp] = await batch
    .gather(
      denops,
      async (denops) => {
        await fn.hasmapto(denops, `<Plug>(gin-action-choice)`, "n");
        await fn.hasmapto(denops, `<Plug>(gin-action-choice)`, "x");
        await fn.hasmapto(denops, `<Plug>(gin-action-repeat)`, "n");
        await fn.hasmapto(denops, `<Plug>(gin-action-repeat)`, "x");
        await fn.hasmapto(denops, `<Plug>(gin-action-help)`, "n");
      },
    );
  await batch.batch(denops, async (denops) => {
    await register(denops, {
      choice: actionChoice,
      repeat: actionRepeat,
      help: actionHelp,
      "help:all": actionHelp,
    });
    if (!hasChoice) {
      await mapping.map(denops, "a", "<Plug>(gin-action-choice)", {
        mode: "n",
        buffer: true,
        nowait: true,
      });
    }
    if (!hasChoiceX) {
      await mapping.map(denops, "a", "<Plug>(gin-action-choice)", {
        mode: "x",
        buffer: true,
        nowait: true,
      });
    }
    if (!hasRepeat) {
      await mapping.map(denops, ".", "<Plug>(gin-action-repeat)", {
        mode: "n",
        buffer: true,
        nowait: true,
      });
    }
    if (!hasRepeatX) {
      await mapping.map(denops, ".", "<Plug>(gin-action-repeat)", {
        mode: "x",
        buffer: true,
        nowait: true,
      });
    }
    if (!hasHelp) {
      await mapping.map(denops, "?", "<Plug>(gin-action-help)", {
        mode: "n",
        buffer: true,
        nowait: true,
      });
    }
  });
}

export async function register(
  denops: Denops,
  actions: Record<string, Callback>,
) {
  await batch.batch(denops, async (denops) => {
    for (const [name, callback] of Object.entries(actions)) {
      const [id] = anonymous.add(denops, (range: unknown) => {
        unknownutil.ensureLike([0, 0] as const as [number, number], range);
        return callback(denops, range);
      });
      await mapping.map(
        denops,
        `<Plug>(gin-action-${name})`,
        `:<C-u>call GinCoreActionDo('${denops.name}', '${id}')<CR>`,
        { mode: "n", noremap: true, buffer: true, silent: true },
      );
      await mapping.map(
        denops,
        `<Plug>(gin-action-${name})`,
        `:call GinCoreActionDo('${denops.name}', '${id}')<CR>`,
        { mode: "x", noremap: true, buffer: true, silent: true },
      );
    }
  });
}

export async function call(
  denops: Denops,
  name: string,
  range: Range,
): Promise<void> {
  await denops.call("GinCoreActionCall", name, range);
}

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

async function actionChoice(denops: Denops, range: Range): Promise<void> {
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
  await call(denops, name, range);
  await vars.b.set(denops, "denops_action_previous", name);
}

async function actionRepeat(denops: Denops, range: Range): Promise<void> {
  const name = await vars.b.get(denops, "denops_action_previous", null) as
    | string
    | null;
  if (name == null) {
    await helper.echo(denops, "[gin] Nothing to repeat");
    return;
  }
  await call(denops, name, range);
}

async function actionHelp(denops: Denops, _range: Range): Promise<void> {
  await helper.echo(denops, "[gin] Not implemented yet");
}
