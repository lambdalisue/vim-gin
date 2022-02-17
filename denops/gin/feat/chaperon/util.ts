const beginMarker = `${"<".repeat(7)} `;
const endMarker = `${">".repeat(7)} `;

export function stripConflicts(content: string[]): string[] {
  let inner = false;
  return content.filter((v) => {
    if (v.startsWith(beginMarker)) {
      inner = true;
      return false;
    } else if (v.startsWith(endMarker)) {
      inner = false;
      return false;
    }
    return !inner;
  });
}
