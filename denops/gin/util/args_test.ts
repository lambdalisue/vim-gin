import { assertEquals } from "../deps_test.ts";
import { parseArgs, parseFlags, parseOpts } from "./args.ts";

Deno.test("parseArgs", () => {
  const [opts, flags, residue] = parseArgs([
    "Gin",
    "++buffer",
    "status",
    "++ff=mac",
    "-unormal",
    "++enc=utf-8",
    "--ignore-submodules=all",
    "--ignore",
    "-v",
    "autoload/gin.vim",
    "--",
    "++buffer",
    "-v",
    "--ignore",
    "autoload/gin/debug.vim",
  ]);
  assertEquals(opts, {
    buffer: "",
    ff: "mac",
    enc: "utf-8",
  });
  assertEquals(flags, {
    u: "normal",
    "ignore-submodules": "all",
    ignore: "",
    v: "",
  });
  assertEquals(residue, [
    "Gin",
    "status",
    "autoload/gin.vim",
    "--",
    "++buffer",
    "-v",
    "--ignore",
    "autoload/gin/debug.vim",
  ]);
});

Deno.test("parseOpts", () => {
  const [opts, residue] = parseOpts([
    "Gin",
    "++buffer",
    "status",
    "++ff=mac",
    "-unormal",
    "++enc=utf-8",
    "--ignore-submodules=all",
    "--ignore",
    "-v",
    "autoload/gin.vim",
    "--",
    "++buffer",
    "-v",
    "--ignore",
    "autoload/gin/debug.vim",
  ]);
  assertEquals(opts, {
    buffer: "",
    ff: "mac",
    enc: "utf-8",
  });
  assertEquals(residue, [
    "Gin",
    "status",
    "-unormal",
    "--ignore-submodules=all",
    "--ignore",
    "-v",
    "autoload/gin.vim",
    "--",
    "++buffer",
    "-v",
    "--ignore",
    "autoload/gin/debug.vim",
  ]);
});

Deno.test("parseFlags", () => {
  const [flags, residue] = parseFlags([
    "Gin",
    "++buffer",
    "status",
    "++ff=mac",
    "-unormal",
    "++enc=utf-8",
    "--ignore-submodules=all",
    "--ignore",
    "-v",
    "autoload/gin.vim",
    "--",
    "++buffer",
    "-v",
    "--ignore",
    "autoload/gin/debug.vim",
  ]);
  assertEquals(flags, {
    u: "normal",
    "ignore-submodules": "all",
    ignore: "",
    v: "",
  });
  assertEquals(residue, [
    "Gin",
    "++buffer",
    "status",
    "++ff=mac",
    "++enc=utf-8",
    "autoload/gin.vim",
    "--",
    "++buffer",
    "-v",
    "--ignore",
    "autoload/gin/debug.vim",
  ]);
});
