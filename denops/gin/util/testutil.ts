import * as path from "jsr:@std/path@^1.0.0";
import { test as testOri, TestDefinition } from "jsr:@denops/test@^3.0.0";

const runtimepath = path.resolve(
  path.fromFileUrl(new URL("../../..", import.meta.url)),
);

export function test(
  mode: TestDefinition["mode"],
  name: string,
  fn: TestDefinition["fn"],
): void;
export function test(def: TestDefinition): void;
export function test(
  modeOrDef: TestDefinition["mode"] | TestDefinition,
  name?: string,
  fn?: TestDefinition["fn"],
): void {
  if (typeof modeOrDef === "string") {
    if (!name) {
      throw new Error(`'name' attribute is required`);
    }
    if (!fn) {
      throw new Error(`'fn' attribute is required`);
    }
    test({ mode: modeOrDef, name, fn });
    return;
  }
  testOri({
    ...modeOrDef,
    prelude: [
      `set runtimepath^=${runtimepath}`,
      ...(modeOrDef.prelude ?? []),
    ],
  });
}
