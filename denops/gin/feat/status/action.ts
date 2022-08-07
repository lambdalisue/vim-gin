import type { Denops } from "https://deno.land/x/denops_std@v3.8.1/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.8.1/function/mod.ts";
import {
  Candidate as CandidateBase,
  Range,
} from "../../core/action/registry.ts";
import { Entry, parse as parseStatus } from "./parser.ts";

export type Candidate = Entry & CandidateBase;

export async function getCandidates(
  denops: Denops,
  bufnr: number,
  [start, end]: Range,
): Promise<Candidate[]> {
  const content = await fn.getbufline(
    denops,
    bufnr,
    Math.max(start, 1),
    Math.max(end, 1),
  );
  const result = parseStatus(content);
  return result.entries.map((entry) => ({
    ...entry,
    value: entry.path,
  }));
}
