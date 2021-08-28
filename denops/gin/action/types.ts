import type { Denops } from "../deps.ts";
import type { Range } from "../core/action.ts";

export type Aggregator<T> = (denops: Denops, range: Range) => Promise<T[]>;
