import { anonymous, autocmd, Denops, fn } from "../../deps.ts";
import type { Range } from "./action.ts";

export type { Range };

export type Candidate = {
  value: string;
};

export type Gatherer<T extends Candidate> = (
  denops: Denops,
  range: Range,
) => Promise<T[]>;

export async function register<T extends Candidate>(
  denops: Denops,
  gatherer: Gatherer<T>,
): Promise<void> {
  const bufnr = await fn.bufnr(denops);
  const pat = `<buffer=${bufnr}>`;
  const [id] = anonymous.once(denops, () => {
    registry.delete(bufnr);
  });
  await autocmd.group(
    denops,
    "gin_feat_action_registry_internal",
    (helper) => {
      helper.remove("*", pat);
      helper.define(
        "BufUnload",
        pat,
        `call denops#notify('gin', '${id}', [])`,
        {
          once: true,
        },
      );
    },
  );
  registry.set(bufnr, gatherer);
}

export async function gatherCandidates<T extends Candidate>(
  denops: Denops,
  range: Range,
): Promise<T[]> {
  const bufnr = await fn.bufnr(denops);
  const gatherer = registry.get(bufnr);
  if (!gatherer) {
    throw new Error(`No gatherer is registered on a buffer ${bufnr}`);
  }
  return await gatherer(denops, range) as T[];
}

// Global registry
const registry: Map<number, Gatherer<Candidate>> = new Map();
