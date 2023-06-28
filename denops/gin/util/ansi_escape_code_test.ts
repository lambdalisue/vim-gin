import { assertSnapshot } from "https://deno.land/std@0.192.0/testing/snapshot.ts";
import { test } from "./testutil.ts";
import { buildDecorationsFromAnsiEscapeCode } from "./ansi_escape_code.ts";

const testText = await Deno.readTextFile(
  new URL("./testdata/ansi_escape_code_content.txt", import.meta.url),
);

test("all", "buildDecorationsFromAnsiEscapeCode", async (denops, t) => {
  await t.step({
    name: "returns proper Decoration[]",
    fn: async () => {
      const content = testText.split("\n");
      const [trimmed, decorations] = await buildDecorationsFromAnsiEscapeCode(
        denops,
        content,
      );
      await assertSnapshot(t, {
        content,
        trimmed,
        decorations,
      });
    },
  });
});
