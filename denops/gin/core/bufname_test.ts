import { assertEquals, assertThrows } from "../deps_test.ts";
import { decode, encode, format, parse } from "./bufname.ts";

Deno.test("encode does nothing on alphabet characters", () => {
  const src = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
  const dst = encode(src);
  const exp = src;
  assertEquals(dst, exp);
});
Deno.test("encode does nothing on numeric characters", () => {
  const src = "1234567890";
  const dst = encode(src);
  const exp = src;
  assertEquals(dst, exp);
});
Deno.test('encode encodes some symbol characters ("<>|?*)', () => {
  const src = " !\"#$%&'()*+,-./:;<=>?@[\\]^`{|}~";
  const dst = encode(src);
  const exp = " !%22#$%&'()%2a+,-./:;%3c=%3e%3f@[\\]^`{%7c}~";
  assertEquals(dst, exp);
});
Deno.test("encode does nothing on 日本語", () => {
  const src = "いろはにへへとちりぬるをわかよたれそつねならむうゐのおくやまけふこえてあさきゆめみしゑひもせす";
  const dst = encode(src);
  const exp = src;
  assertEquals(dst, exp);
});
Deno.test("encode does nothing on emoji (🥃)", () => {
  const src = "🥃";
  const dst = encode(src);
  const exp = src;
  assertEquals(dst, exp);
});

Deno.test("decode does nothing on alphabet characters", () => {
  const src = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
  const dst = decode(src);
  const exp = src;
  assertEquals(dst, exp);
});
Deno.test("decode does nothing on numeric characters", () => {
  const src = "1234567890";
  const dst = decode(src);
  const exp = src;
  assertEquals(dst, exp);
});
Deno.test('decode decodes encoded characters ("<>|?*)', () => {
  const src = " !%22#$%&'()%2a+,-./:;%3c=%3e%3f@[\\]^`{%7c}~";
  const dst = decode(src);
  const exp = " !\"#$%&'()*+,-./:;<=>?@[\\]^`{|}~";
  assertEquals(dst, exp);
});
Deno.test("decode does nothing on 日本語", () => {
  const src = "いろはにへへとちりぬるをわかよたれそつねならむうゐのおくやまけふこえてあさきゆめみしゑひもせす";
  const dst = decode(src);
  const exp = src;
  assertEquals(dst, exp);
});
Deno.test("decode does nothing on emoji (🥃)", () => {
  const src = "🥃";
  const dst = decode(src);
  const exp = src;
  assertEquals(dst, exp);
});
Deno.test("decode decodes encoded 日本語", () => {
  const src = encodeURIComponent(
    "いろはにへへとちりぬるをわかよたれそつねならむうゐのおくやまけふこえてあさきゆめみしゑひもせす",
  );
  const dst = decode(src);
  const exp = "いろはにへへとちりぬるをわかよたれそつねならむうゐのおくやまけふこえてあさきゆめみしゑひもせす";
  assertEquals(dst, exp);
});
Deno.test("decode decodes encoded emoji (🥃)", () => {
  const src = encodeURIComponent("🥃");
  const dst = decode(src);
  const exp = "🥃";
  assertEquals(dst, exp);
});

Deno.test("format throws exception when 'scheme' contains unusable characters", () => {
  assertThrows(
    () =>
      format({
        scheme: "gin0number",
        path: "/absolute/path/to/worktree",
      }),
    undefined,
    "contains unusable characters",
  );
  assertThrows(
    () =>
      format({
        scheme: "gin+plus",
        path: "/absolute/path/to/worktree",
      }),
    undefined,
    "contains unusable characters",
  );
  assertThrows(
    () =>
      format({
        scheme: "gin-minus",
        path: "/absolute/path/to/worktree",
      }),
    undefined,
    "contains unusable characters",
  );
  assertThrows(
    () =>
      format({
        scheme: "gin.dot",
        path: "/absolute/path/to/worktree",
      }),
    undefined,
    "contains unusable characters",
  );
  assertThrows(
    () =>
      format({
        scheme: "gin_underscore",
        path: "/absolute/path/to/worktree",
      }),
    undefined,
    "contains unusable characters",
  );
});
Deno.test("format returns buffer name string from Bufname instance", () => {
  const src = {
    scheme: "gin",
    path: "/absolute/path/to/worktree",
  };
  const dst = format(src);
  const exp = "gin:///absolute/path/to/worktree";
  assertEquals(dst, exp);
});
Deno.test("format encodes unusable characters in 'path'", () => {
  const src = {
    scheme: "gin",
    path: "<>|?*",
  };
  const dst = format(src);
  const exp = "gin://%3c%3e%7c%3f%2a";
  assertEquals(dst, exp);
});
Deno.test("format returns buffer name string from Bufname instance (with URLSearchParams)", () => {
  const src = {
    scheme: "gin",
    path: "/absolute/path/to/worktree",
    params: {
      foo: "foo",
      bar: ["bar", "bar"],
      hoge: undefined,
    },
  };
  const dst = format(src);
  const exp =
    "gin:///absolute/path/to/worktree;foo=%22foo%22&bar=%5B%22bar%22%2C%22bar%22%5D";
  assertEquals(dst, exp);
});
Deno.test("format encodes unusable characters in 'params'", () => {
  const src = {
    scheme: "gin",
    path: "/absolute/path/to/worktree",
    params: {
      foo: "<>|?*",
    },
  };
  const dst = format(src);
  const exp = "gin:///absolute/path/to/worktree;foo=%22%3C%3E%7C%3F%2a%22";
  assertEquals(dst, exp);
});

Deno.test("parse throws exception when 'expr' contains unusable characters", () => {
  const src = "gin://<>|?*";
  assertThrows(
    () => {
      parse(src);
    },
    undefined,
    "contains unusable characters",
  );
});
Deno.test("parse throws exception when scheme part of 'expr' contains unusable characters", () => {
  assertThrows(
    () => parse("gin0number://absolute/path/to/worktree"),
    undefined,
    "contains unusable characters",
  );
  assertThrows(
    () => parse("gin+plus://absolute/path/to/worktree"),
    undefined,
    "contains unusable characters",
  );
  assertThrows(
    () => parse("gin+minus://absolute/path/to/worktree"),
    undefined,
    "contains unusable characters",
  );
  assertThrows(
    () => parse("gin.dot://absolute/path/to/worktree"),
    undefined,
    "contains unusable characters",
  );
  assertThrows(
    () => parse("gin_underscore://absolute/path/to/worktree"),
    undefined,
    "contains unusable characters",
  );
});
Deno.test("parse returns Bufname instance from buffer name", () => {
  const src = "gin:///absolute/path/to/worktree";
  const dst = parse(src);
  const exp = {
    scheme: "gin",
    path: "/absolute/path/to/worktree",
  };
  assertEquals(dst, exp);
});
Deno.test("parse decodes percent-encoded characters in 'path'", () => {
  const src = "gin://%3c%3e%7c%3f%2a";
  const dst = parse(src);
  const exp = {
    scheme: "gin",
    path: "<>|?*",
  };
  assertEquals(dst, exp);
});
Deno.test("parse returns Bufname instance from buffer name (with params)", () => {
  const src =
    "gin:///absolute/path/to/worktree;foo=%22foo%22&bar=%5B%22bar%22%2C%22bar%22%5D";
  const dst = parse(src);
  const exp = {
    scheme: "gin",
    path: "/absolute/path/to/worktree",
    params: {
      foo: "foo",
      bar: ["bar", "bar"],
    },
  };
  assertEquals(dst, exp);
});
Deno.test("parse decodes percent-encoded characters in 'params'", () => {
  const src = "gin:///absolute/path/to/worktree;foo=%22%3C%3E%7C%3F%2a%22";
  const dst = parse(src);
  const exp = {
    scheme: "gin",
    path: "/absolute/path/to/worktree",
    params: {
      foo: "<>|?*",
    },
  };
  assertEquals(dst, exp);
});
