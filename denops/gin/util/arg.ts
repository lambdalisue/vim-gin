export type ToArgsOptions = {
  flagForFalse?: string;
};

/**
 * Convert optional value to command arguments.
 */
export function toArgs(
  flag: string,
  value: unknown,
  options: ToArgsOptions = {},
): string[] {
  if (value == null) {
    return [];
  }
  if (typeof value === "boolean") {
    return value ? [flag] : options.flagForFalse ? [options.flagForFalse] : [];
  } else if (typeof value === "string") {
    return [flag, value];
  } else if (Array.isArray(value)) {
    return value.map((v) => toArgs(flag, v)).flat();
  }
  throw new Error(`Unknown value is specified: ${JSON.stringify(value)}`);
}
