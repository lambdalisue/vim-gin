import { assertEquals } from "https://deno.land/std@0.197.0/testing/asserts.ts";
import { test } from "./testutil.ts";
import { yank } from "./yank.ts";

test("all", "yank", async (denops, t) => {
  await t.step({
    name: "sets the value to v:register",
    fn: async () => {
      await yank(denops, "Hello world");
      assertEquals(await denops.eval("getreg(v:register)"), "Hello world");
    },
  });
});
