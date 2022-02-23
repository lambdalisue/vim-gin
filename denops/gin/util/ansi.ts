// deno-lint-ignore no-control-regex
const pattern = /\x1b\[[\d;]*[ABCDEFGHJKSTfm]/g;

export type Annotation = {
  offset: number;
  value: string;
};

export function parse(expr: string): [string, Annotation[]] {
  const annotations = [...expr.matchAll(pattern)].map((m) => {
    return {
      value: m[0],
      offset: m.index ?? 0,
    };
  });
  for (let i = annotations.length - 1; i >= 0; i--) {
    const n = annotations[i].value.length;
    for (let j = i + 1; j < annotations.length; j++) {
      annotations[j].offset -= n;
    }
  }
  return [expr.replaceAll(pattern, ""), annotations];
}
