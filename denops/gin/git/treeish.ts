export type Treeish = string;
export type Commitish = string;
export type Path = string;

const treeishPattern = /^(:[0123]|[^:]*):(.*)/;

export function parseTreeish(treeish: Treeish): [Commitish, Path] {
  if (treeish.startsWith(":/")) {
    return [treeish, ""];
  }
  const m = treeish.match(treeishPattern);
  if (!m) {
    return [treeish, ""];
  }
  return [m[1], m[2]];
}
