export type BufnameParams = Record<string, unknown>;

export type Bufname = {
  // Scheme part of a remote buffer name. Note that Vim supports only letters, number, and underscore in scheme part.
  scheme: string;
  // Path part of a remote buffer name. Note that '<>|?*' are not supported in Vim on Windows.
  path: string;
  // Params part of a remote buffer name. While '?' is not supported, the params part are splitted by ';' instead.
  params?: BufnameParams;
};

// Vim on Windows does not support following characters in bufname
const bufnameUnusablePattern = /["<>\|\?\*]/g;

// % encoded character
const encodedCharacterPattern = /(?:%[0-9a-fA-F]{2})+/g;

// Vim only supports alphabet characters in the scheme part of a remote buffer name.
// That behavior has slightly improved from Vim 8.2.3153 but we suppor Vim 8.1.2424
// thus we need to stack old behavior or ignore Windows.
// https://github.com/vim/vim/pull/8299
const protocolUnusablePattern = /[^a-zA-Z]/;

// Vim assumes a bufname is REMOTE when it starts with "name://"
// https://github.com/vim/vim/blob/36698e34aacee4186e6f5f87f431626752fcb337/src/misc1.c#L2567-L2580
const schemePattern = /^(\S+):\/\//;

/**
 * Encode unusable characters to percent-encoded characters.
 */
export function encode(expr: string): string {
  expr = expr.replaceAll(
    bufnameUnusablePattern,
    (c) => `%${c.codePointAt(0)!.toString(16)}`,
  );
  return expr;
}

/**
 * Decode all percent-encoded characters.
 */
export function decode(expr: string): string {
  expr = expr.replaceAll(
    encodedCharacterPattern,
    (m) => decodeURIComponent(m),
  );
  return expr;
}

/**
 * Format Bufname instance to construct Vim's buffer name.
 */
export function format({ scheme, path, params }: Bufname): string {
  if (protocolUnusablePattern.test(scheme)) {
    throw new Error(
      `Scheme '${scheme}' contains unusable characters. Only alphabets are allowed.`,
    );
  }
  const suffix = params
    ? `;${encode(toURLSearchParams(params).toString())}`
    : "";
  return `${scheme}://${encode(path)}${suffix}`;
}

/**
 * Parse Vim's buffer name to construct Bufname instance.
 */
export function parse(expr: string): Bufname {
  if (bufnameUnusablePattern.test(expr)) {
    throw new Error(
      `Expression '${expr}' contains unusable characters. Vim (on Windows) does not support '<>|?*' in a buffer name.`,
    );
  }
  // Check if the bufname is remote
  const m = expr.match(schemePattern);
  if (!m) {
    throw new Error(`Expression '${expr}' is not a remote buffer name.`);
  }
  const scheme = m[1];
  // Vim only supports letters, numbers, and underscore in protocol
  if (protocolUnusablePattern.test(scheme)) {
    throw new Error(
      `Scheme '${scheme}' contains unusable characters. Only alphabets are allowed.`,
    );
  }
  const remain = decode(expr.substring(`${scheme}://`.length));
  const [path, query] = remain.split(";", 2);
  if (!query) {
    return { scheme, path };
  }
  const params = fromURLSearchParams(new URLSearchParams(query));
  return { scheme, path, params };
}

function toURLSearchParams(params: BufnameParams): URLSearchParams {
  return new URLSearchParams(Object.fromEntries(
    Object.entries(params).filter(([_k, v]) => v != undefined).map((
      [k, v],
    ) => [k, JSON.stringify(v)]),
  ));
}

function fromURLSearchParams(search: URLSearchParams): BufnameParams {
  return Object.fromEntries([...search].map(([k, v]) => [k, JSON.parse(v)]));
}
