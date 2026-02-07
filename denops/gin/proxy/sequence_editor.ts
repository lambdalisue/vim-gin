#!/usr/bin/env -S deno run --no-check --allow-env=GIN_SPLIT_TARGET --allow-read --allow-write
// Rewrite `pick <hash>` to `edit <hash>` in the rebase todo file.
// Used by the commit:split action to mark a specific commit for editing.

const target = Deno.env.get("GIN_SPLIT_TARGET");
if (!target) {
  console.error("GIN_SPLIT_TARGET environment variable is required");
  Deno.exit(1);
}

const todoFile = Deno.args[0];
if (!todoFile) {
  console.error("No filename specified");
  Deno.exit(1);
}

let content = await Deno.readTextFile(todoFile);

// Match short hash at the beginning of a pick line
const shortHash = target.substring(0, 7);
const pattern = new RegExp(`^pick (${shortHash}\\S*)`, "m");
if (!pattern.test(content)) {
  console.error(`Could not find commit ${shortHash} in rebase todo`);
  Deno.exit(1);
}

content = content.replace(pattern, "edit $1");
await Deno.writeTextFile(todoFile, content);
