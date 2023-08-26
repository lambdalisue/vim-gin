import { assertSnapshot } from "https://deno.land/std@0.200.0/testing/snapshot.ts";
import { parse } from "./parser.ts";

Deno.test("parse", async function (t): Promise<void> {
  await t.step("returns proper branches", async (t) => {
    const content = await Deno.readTextFile(
      new URL("./testdata/branch.txt", import.meta.url),
    );
    const result = parse(content.split("\n"));
    await assertSnapshot(t, result);
  });
});
