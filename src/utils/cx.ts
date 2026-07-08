/** Tiny classNames helper. Filters falsy values and joins with spaces. */
export type ClassValue = string | number | false | null | undefined;

export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}
