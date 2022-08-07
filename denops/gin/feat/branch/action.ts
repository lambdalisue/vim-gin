import type { Denops } from "https://deno.land/x/denops_std@v3.8.1/mod.ts";
import * as fn from "https://deno.land/x/denops_std@v3.8.1/function/mod.ts";
import {
  Candidate as CandidateBase,
  Range,
} from "../../core/action/registry.ts";
import { Branch, parse as parseBranch } from "./parser.ts";

export type Candidate = Branch & CandidateBase;

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
  const result = parseBranch(content);
  return result.branches.map((branch) => ({
    ...branch,
    value: branch.branch,
  }));
}
