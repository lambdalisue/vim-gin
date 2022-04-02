import { assertEquals } from "https://deno.land/std@0.133.0/testing/asserts.ts";
import { FileFormat, findFileFormat, splitText } from "./fileformat.ts";

Deno.test("splitText", async (t) => {
  await t.step("splits POSIX Text File properly (unix)", () => {
    assertEquals(
      splitText("Hello\nWorld\n", "unix"),
      [
        "Hello",
        "World",
      ],
    );
  });
  await t.step("splits POSIX Text File properly (dos)", () => {
    assertEquals(
      splitText("Hello\r\nWorld\r\n", "dos"),
      [
        "Hello",
        "World",
      ],
    );
  });
  await t.step("splits POSIX Text File properly (mac)", () => {
    assertEquals(
      splitText("Hello\rWorld\r", "mac"),
      [
        "Hello",
        "World",
      ],
    );
  });
  await t.step("splits invalid POSIX Text File properly (unix)", () => {
    assertEquals(
      splitText("Hello\nWorld", "unix"),
      [
        "Hello",
        "World",
      ],
    );
  });
  await t.step("splits invalid POSIX Text File properly (dos)", () => {
    assertEquals(
      splitText("Hello\r\nWorld", "dos"),
      [
        "Hello",
        "World",
      ],
    );
  });
  await t.step("splits invalid POSIX Text File properly (mac)", () => {
    assertEquals(
      splitText("Hello\rWorld", "mac"),
      [
        "Hello",
        "World",
      ],
    );
  });
});

Deno.test("findFileFormat", async (t) => {
  const ff: FileFormat[] = ["unix", "dos", "mac"];
  await t.step("finds 'dos' properly", () => {
    assertEquals(
      findFileFormat("Hello\r\nWorld\r\n", ff),
      "dos",
    );
    assertEquals(
      findFileFormat("Hello\rWorld\r\n", ff),
      "dos",
    );
  });
  await t.step("finds 'unix' properly", () => {
    assertEquals(
      findFileFormat("Hello\nWorld\n", ff),
      "unix",
    );
    assertEquals(
      findFileFormat("Hello\r\nWorld\n", ff),
      "unix",
    );
    assertEquals(
      findFileFormat("Hello\rWorld\n", ff),
      "unix",
    );
  });
  await t.step("finds 'mac' properly", () => {
    assertEquals(
      findFileFormat("Hello\rWorld\r", ff),
      "mac",
    );
  });
  await t.step("uses the first fileformat as a fallback", () => {
    assertEquals(
      findFileFormat("Hello", ff),
      "unix",
    );
  });
});
