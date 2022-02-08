import { bufname } from "../deps.ts";

export type ToStringArgsOptions = {
  flag?: string;
  noEqual?: boolean;
};

export function toStringArgs(
  params: bufname.BufnameParams | undefined,
  name: string,
  options: ToStringArgsOptions = {},
): string[] {
  const value = params?.[name];
  if (value == null) {
    return [];
  }
  const flag = options.flag ?? `--${name}`;
  if (Array.isArray(value)) {
    return value.map((v) => toStringArgs({ [name]: v }, name, options)).flat();
  }
  return options.noEqual ? [flag, value] : [`${flag}=${value}`];
}

export type ToBooleanArgsOptions = {
  flag?: string;
  flagFalse?: string;
};

export function toBooleanArgs(
  params: bufname.BufnameParams | undefined,
  name: string,
  options: ToBooleanArgsOptions = {},
): string[] {
  const value = params?.[name];
  if (value == null) {
    return [];
  }
  const flag = options.flag ?? `--${name}`;
  if (Array.isArray(value)) {
    return value.map((v) => toBooleanArgs({ [name]: v }, name, options)).flat();
  }
  if (!value || (typeof value === "string" && value === "false")) {
    return options.flagFalse ? [options.flagFalse] : [];
  } else {
    return [flag];
  }
}
