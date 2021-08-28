import { batch, Denops, mapping } from "../deps.ts";
import * as action from "../core/action.ts";
import * as buffer from "../core/buffer.ts";
import type { Aggregator } from "./types.ts";

type Item = {
  path: string;
};

export async function initActions(
  denops: Denops,
  aggregator: Aggregator<Item>,
): Promise<void> {
  await batch.batch(denops, async (denops) => {
    await action.register(denops, {
      "open:edit": (denops, range) => actionOpen(denops, range, aggregator, {}),
      "open:split": (denops, range) =>
        actionOpen(denops, range, aggregator, { opener: "split" }),
      "open:vsplit": (denops, range) =>
        actionOpen(denops, range, aggregator, { opener: "vsplit" }),
      "open:tabedit": (denops, range) =>
        actionOpen(denops, range, aggregator, { opener: "tabedit" }),
    });
    await mapping.map(
      denops,
      "<Plug>(gin-action-open)",
      "<Plug>(gin-action-open:edit)",
      {
        mode: ["n", "x"],
      },
    );
  });
}

async function actionOpen(
  denops: Denops,
  range: action.Range,
  aggregator: Aggregator<{ path: string }>,
  options: {
    opener?: string;
  },
): Promise<void> {
  const vs = await aggregator(denops, range);
  const ps = vs.map((c) => c.path);
  if (!ps.length) {
    return;
  }
  await batch.batch(denops, async (denops) => {
    for (const p of ps) {
      if (options.opener) {
        await denops.cmd(options.opener);
      }
      await buffer.open(denops, p);
    }
  });
}
