export function toNumber(value: unknown): number {
  return Number(value)
}

export function toNullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value)
}
