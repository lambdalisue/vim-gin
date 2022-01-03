export type ToStringArgsOptions = {
  useEqual?: boolean;
};

export function toStringArgs(
  flag: string,
  value: unknown,
  options: ToStringArgsOptions = {},
): string[] {
  if (value == null) {
    return [];
  } else if (typeof value === "boolean") {
    return value ? [flag] : [];
  }
  return options.useEqual ? [`${flag}=${value}`] : [flag, `${value}`];
}

export type ToBooleanArgsOptions = {
  falseFlag?: string;
};

export function toBooleanArgs(
  flag: string,
  value: unknown,
  options: ToBooleanArgsOptions = {},
): string[] {
  if (value) {
    return [flag];
  } else {
    return options.falseFlag ? [options.falseFlag] : [];
  }
}
