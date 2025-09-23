export const BOM = Uint8Array.from([0xef, 0xbb, 0xbf]);

export function addBom(data: Uint8Array): Uint8Array {
  if (hasBom(data)) {
    return data;
  }
  const withBom = new Uint8Array(data.length + BOM.length);
  withBom.set(BOM, 0);
  withBom.set(data, BOM.length);
  return withBom;
}

export function removeBom(data: Uint8Array): Uint8Array {
  if (!hasBom(data)) {
    return data;
  }
  return data.subarray(BOM.length);
}

export function hasBom(data: Uint8Array): boolean {
  return (
    data.length >= BOM.length &&
    data[0] === BOM[0] &&
    data[1] === BOM[1] &&
    data[2] === BOM[2]
  );
}
