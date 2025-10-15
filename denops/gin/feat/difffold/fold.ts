import type { Denops } from "jsr:@denops/std@^7.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import * as option from "jsr:@denops/std@^7.0.0/option";
import { parse } from "./parser.ts";

/**
 * Initialize fold functionality for a diff buffer
 *
 * Creates folds for each file section in the unified diff output.
 *
 * @param denops - Denops instance
 * @param bufnr - Buffer number
 *
 * @example
 * ```typescript,ignore
 * // In a buffer with diff content
 * await init(denops, bufnr);
 * // Folds are created for each file section
 * ```
 */
export async function init(denops: Denops, bufnr: number): Promise<void> {
  const content = await fn.getbufline(denops, bufnr, 1, "$");
  const sections = parse(content);

  if (sections.length === 0) {
    return;
  }

  await batch.batch(denops, async (denops) => {
    // Set fold method to manual
    await option.foldmethod.setLocal(denops, "manual");

    // Create folds for each file section
    for (const section of sections) {
      await fn.execute(
        denops,
        `${section.start},${section.end}fold`,
      );
    }
  });
}
