export type Flags = Record<string, string | string[]>;
export type Opts = Record<string, string>;

export const builtinOpts = [
  "ff",
  "fileformat",
  "enc",
  "encoding",
  "bin",
  "binary",
  "nobin",
  "nobinary",
  "bad",
  "edit",
];

const optPattern = /^\+\+([a-zA-Z0-9-]+)(?:=(.*))?/;
const longPattern = /^--([a-zA-Z0-9-]+)(?:=(.*))?/;
const shortPattern = /^-([a-zA-Z0-9])(.*)/;

export function parseArgs(args: string[]): [Opts, Flags, string[]] {
  const [opts, intermediate] = parseOpts(args);
  const [flags, residue] = parseFlags(intermediate);
  return [opts, flags, residue];
}

export function parseOpts(args: string[]): [Opts, string[]] {
  const opts: Opts = {};
  const residue: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--") {
      residue.push(...args.slice(i));
      break;
    }
    const r = parsePattern(arg, optPattern);
    if (r) {
      const [k, v] = r;
      if (k in opts) {
        throw new Error(
          `An option '++${k}' is specified more than twice in '${args}'`,
        );
      }
      opts[k] = v;
      continue;
    }
    residue.push(arg);
  }
  return [opts, residue];
}

export function parseFlags(args: string[]): [Flags, string[]] {
  const patterns = [longPattern, shortPattern];
  const flags: Flags = {};
  const residue: string[] = [];
  loop:
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--") {
      residue.push(...args.slice(i));
      break;
    }
    for (const pattern of patterns) {
      const r = parsePattern(arg, pattern);
      if (r) {
        const [k, v] = r;
        if (k in flags) {
          const b = flags[k];
          flags[k] = Array.isArray(b) ? [...b, v] : [b, v];
        } else {
          flags[k] = v;
        }
        continue loop;
      }
    }
    residue.push(arg);
  }
  return [flags, residue];
}

export function validateOpts(opts: Opts, knownAttributes: string[]): void {
  Object.keys(opts).forEach((v) => {
    if (!knownAttributes.includes(v)) {
      throw new Error(`Unknown option '++${v}' is specified.`);
    }
  });
}

export function validateFlags(flags: Flags, knownAttributes: string[]): void {
  Object.keys(flags).forEach((v) => {
    if (!knownAttributes.includes(v)) {
      if (v.length === 1) {
        throw new Error(`Unknown flag '-${v}' is specified.`);
      } else {
        throw new Error(`Unknown flag '--${v}' is specified.`);
      }
    }
  });
}

export function formatOpt(key: string, value: string): string {
  return value ? `++${key}=${value}` : `++${key}`;
}

export function formatFlag(
  key: string,
  value: string | string[] | undefined,
): string[] {
  if (value == null) {
    return [];
  }
  value = Array.isArray(value) ? value : [value];
  if (key.length === 1) {
    return value.map((v) => v ? `-${key}${v}` : `-${key}`);
  } else {
    return value.map((v) => v ? `--${key}=${v}` : `--${key}`);
  }
}

export function formatBuiltinOpts(opts: Opts): string {
  const vs: string[] = [];
  for (const opt of builtinOpts) {
    if (opt in opts) {
      vs.push(formatOpt(opt, opts[opt]));
    }
  }
  return vs.join(" ");
}

function parsePattern(arg: string, pattern: RegExp): [string, string] | null {
  const m = arg.match(pattern);
  if (!m) {
    return null;
  }
  return [m[1], m[2] ?? ""];
}
