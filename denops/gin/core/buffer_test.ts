import { assertEquals, test } from "../deps_test.ts";
import { fn, path } from "../deps.ts";
import { concrete, open, replace } from "./buffer.ts";

const runtimepath = path.resolve(
  path.fromFileUrl(`${import.meta.url}/../../../..`),
);

test({
  mode: "all",
  name: "open opens a new buffer",
  fn: async (denops) => {
    await open(denops, "Hello world");
    const bufname = await fn.bufname(denops);
    assertEquals("Hello world", bufname);
  },
  prelude: [`set runtimepath^=${runtimepath}`],
});
test({
  mode: "all",
  name: "open opens a new buffer (remote buffer name)",
  fn: async (denops) => {
    await open(denops, "gin://this-is-valid-remote-buffer-name");
    const bufname = await fn.bufname(denops);
    assertEquals("gin://this-is-valid-remote-buffer-name", bufname);
  },
  prelude: [`set runtimepath^=${runtimepath}`],
});
test({
  mode: "all",
  name: "open opens a new buffer (symobls with percent-encoding)",
  fn: async (denops) => {
    const symbols = " !%22#$%&'()%2a+,-./:;%3c=%3e%3f@[\\]^`{%7c}~";
    await open(denops, `test://${symbols}`);
    const bufname = await fn.bufname(denops);
    assertEquals(`test://${symbols}`, bufname);
  },
  prelude: [`set runtimepath^=${runtimepath}`],
});

test({
  mode: "all",
  name: "replace replaces content of a buffer",
  fn: async (denops) => {
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
  },
  prelude: [`set runtimepath^=${runtimepath}`],
});
test({
  mode: "all",
  name: "replace replaces content of an 'unmodifiable' buffer",
  fn: async (denops) => {
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
  prelude: [`set runtimepath^=${runtimepath}`],
});

test({
  mode: "all",
  name: "concrete concretes the buffer and the content become persistent",
  fn: async (denops) => {
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
  prelude: [`set runtimepath^=${runtimepath}`],
});
