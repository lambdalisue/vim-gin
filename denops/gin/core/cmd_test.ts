import { assertEquals, test } from "../deps_test.ts";
import { batch, deadline, fn, path } from "../deps.ts";
import { normCmdArgs } from "./cmd.ts";

test(
  "any",
  "normCmdArgs does nothing on args without '%' or '#'",
  async (denops) => {
    await batch.batch(denops, async (denops) => {
      await denops.cmd("edit dummy1");
      await denops.cmd("file dummy2");
    });
    const src = ["a", "b", "c"];
    const dst = await normCmdArgs(denops, src);
    const exp = src;
    assertEquals(dst, exp);
  },
);
test(
  "any",
  "normCmdArgs does not expand arg starts from '\%' or '\#'",
  async (denops) => {
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
);
test(
  "all",
  "normCmdArgs expands arg starts from '%' or '#'",
  async (denops) => {
    await batch.batch(denops, async (denops) => {
      await denops.cmd("edit dummy1");
      await denops.cmd("file dummy2");
    });
    const cwd = await fn.getcwd(denops) as string;
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
);
test(
  "all",
  "normCmdArgs expands massive args starts from '%' or '#'",
  async (denops) => {
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
);
