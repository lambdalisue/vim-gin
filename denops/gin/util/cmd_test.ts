import { assertEquals } from "jsr:@std/assert@^1.0.0";
import * as batch from "jsr:@denops/std@^7.0.0/batch";
import * as fn from "jsr:@denops/std@^7.0.0/function";
import * as path from "jsr:@std/path@^1.0.0";
import { deadline } from "jsr:@std/async@^1.0.0";
import { test } from "./testutil.ts";
import { normCmdArgs } from "./cmd.ts";

test("all", "cmd", async (denops, t) => {
  await t.step({
    name: "normCmdArgs does nothing on args without '%' or '#'",
    fn: async () => {
      await denops.cmd("%bwipeout!");
      await batch.batch(denops, async (denops) => {
        await denops.cmd("edit dummy1");
        await denops.cmd("file dummy2");
      });
      const src = ["a", "b", "c"];
      const dst = await normCmdArgs(denops, src);
      const exp = src;
      assertEquals(dst, exp);
    },
  });
  await t.step({
    name: "normCmdArgs does not expand arg starts from '\%' or '\#'",
    fn: async () => {
      await denops.cmd("%bwipeout!");
      await batch.batch(denops, async (denops) => {
        await denops.cmd("edit dummy1");
        await denops.cmd("file dummy2");
      });
      const src = ["\\%", "\\%:p", "\\%hello", "\\#", "\\#:p", "\\#hello"];
      const dst = await normCmdArgs(denops, src);
      const exp = [
        "%",
        "%:p",
        "%hello",
        "#",
        "#:p",
        "#hello",
      ];
      assertEquals(dst, exp);
    },
  });
  await t.step({
    name: "normCmdArgs expands arg starts from '%' or '#'",
    fn: async () => {
      await denops.cmd("%bwipeout!");
      await batch.batch(denops, async (denops) => {
        await denops.cmd("edit dummy1");
        await denops.cmd("file dummy2");
      });
      const cwd = await fn.getcwd(denops);
      const src = ["%", "%:p", "%hello", "#", "#:p", "#hello"];
      const dst = await normCmdArgs(denops, src);
      const exp = [
        "dummy2",
        path.join(cwd, "dummy2"),
        "dummy2",
        "dummy1",
        path.join(cwd, "dummy1"),
        "dummy1",
      ];
      assertEquals(dst, exp);
    },
  });
  await t.step({
    name: "normCmdArgs expands massive args starts from '%' or '#'",
    fn: async () => {
      await denops.cmd("%bwipeout!");
      await batch.batch(denops, async (denops) => {
        await denops.cmd("edit dummy1");
        await denops.cmd("file dummy2");
      });
      const src = [
        ...Array(10000).fill("%"),
        ...Array(10000).fill("#"),
      ];
      const dst = await deadline(normCmdArgs(denops, src), 1000);
      const exp = [
        ...Array(10000).fill("dummy2"),
        ...Array(10000).fill("dummy1"),
      ];
      assertEquals(dst, exp);
    },
  });
});
