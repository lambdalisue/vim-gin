import { assertEquals } from "jsr:@std/assert@^1.0.0";
import { stripConflicts } from "./util.ts";

// https://github.com/ojacobson/conflicts
Deno.test("stripConflicts", async (t) => {
  await t.step("Simple edit conflict", () => {
    const input = [
      "- Tea",
      "- Eggs",
      "<<<<<<< HEAD",
      "- Bacon",
      "=======",
      "- Beef",
      ">>>>>>> origin/edit-conflict/right",
      "- Coffee",
      "- A week's worth of rubber bands",
    ];
    assertEquals(stripConflicts(input), [
      "- Tea",
      "- Eggs",
      "- Coffee",
      "- A week's worth of rubber bands",
    ]);
  });
  await t.step("Append conflict", () => {
    const input = [
      "- Tea",
      "- Eggs",
      "- Ham",
      "- Coffee",
      "- A week's worth of rubber bands",
      "<<<<<<< HEAD",
      "- Toys for Bob",
      "=======",
      "- Cookies",
      ">>>>>>> origin/append-conflict/right",
    ];
    assertEquals(stripConflicts(input), [
      "- Tea",
      "- Eggs",
      "- Ham",
      "- Coffee",
      "- A week's worth of rubber bands",
    ]);
  });
});
