import { assertEquals, test } from "../deps_test.ts";
import { fn } from "../deps.ts";
import { concrete, open, replace } from "./buffer.ts";

test("all", "open opens a new buffer", async (denops) => {
  await open(denops, "Hello world");
  const bufname = await fn.bufname(denops);
  assertEquals("Hello world", bufname);
});
test("all", "open opens a new buffer (remote buffer name)", async (denops) => {
  await open(denops, "gin://this-is-valid-remote-buffer-name");
  const bufname = await fn.bufname(denops);
  assertEquals("gin://this-is-valid-remote-buffer-name", bufname);
});
test(
  "all",
  "open opens a new buffer (symobls with percent-encoding)",
  async (denops) => {
    const symbols = " !%22#$%&'()%2a+,-./:;%3c=%3e%3f@[\\]^`{%7c}~";
    await open(denops, `test://${symbols}`);
    const bufname = await fn.bufname(denops);
    assertEquals(`test://${symbols}`, bufname);
  },
);

test("all", "replace replaces content of a buffer", async (denops) => {
  const bufnr = await fn.bufnr(denops);
  await replace(denops, bufnr, [
    "Hello",
    "Darkness",
    "My",
    "Old friend",
  ]);
  assertEquals([
    "Hello",
    "Darkness",
    "My",
    "Old friend",
  ], await fn.getline(denops, 1, "$"));

  await replace(denops, bufnr, [
    "Joking",
  ]);
  assertEquals([
    "Joking",
  ], await fn.getline(denops, 1, "$"));
});
test(
  "all",
  "replace replaces content of an 'unmodifiable' buffer",
  async (denops) => {
    const bufnr = await fn.bufnr(denops);
    await fn.setbufvar(denops, bufnr, "&modifiable", 0);
    await replace(denops, bufnr, [
      "Hello",
      "Darkness",
      "My",
      "Old friend",
    ]);
    assertEquals([
      "Hello",
      "Darkness",
      "My",
      "Old friend",
    ], await fn.getline(denops, 1, "$"));
    assertEquals(0, await fn.getbufvar(denops, bufnr, "&modifiable"));

    await replace(denops, bufnr, [
      "Joking",
    ]);
    assertEquals([
      "Joking",
    ], await fn.getline(denops, 1, "$"));
    assertEquals(0, await fn.getbufvar(denops, bufnr, "&modifiable"));
  },
);

test(
  "all",
  "concrete concretes the buffer and the content become persistent",
  async (denops) => {
    await denops.cmd("edit foobar");
    const bufnr = await fn.bufnr(denops);
    await replace(denops, bufnr, [
      "Hello",
      "Darkness",
      "My",
      "Old friend",
    ]);
    await concrete(denops, bufnr);
    await denops.cmd("edit");
    assertEquals([
      "Hello",
      "Darkness",
      "My",
      "Old friend",
    ], await fn.getbufline(denops, bufnr, 1, "$"));
  },
);
