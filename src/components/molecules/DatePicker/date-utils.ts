/** Pure date helpers for the calendar — no locale libraries, ISO-first. */

export const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

/** Format a Date as local `YYYY-MM-DD` (no timezone shift). */
export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse `YYYY-MM-DD` to a local Date, or null if invalid. */
export function parseISO(s: string | undefined): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  // Reject overflow (e.g. 2024-02-31 → March).
  if (date.getMonth() !== Number(mo) - 1 || date.getDate() !== Number(d)) return null;
  return date;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Compare by day only: -1 if a<b, 0 if same day, 1 if a>b. */
export function compareDay(a: Date, b: Date): number {
  const av = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bv = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return av === bv ? 0 : av < bv ? -1 : 1;
}

export interface CalendarCell {
  date: Date;
  inMonth: boolean;
}

/**
 * Build a 6×7 matrix of days for the given month, padded with leading/trailing
 * days so every week is complete. Weeks start on Sunday.
 */
export function buildMonth(year: number, month: number): CalendarCell[][] {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  const weeks: CalendarCell[][] = [];
  const cursor = new Date(start);
  for (let w = 0; w < 6; w++) {
    const row: CalendarCell[] = [];
    for (let d = 0; d < 7; d++) {
      row.push({ date: new Date(cursor), inMonth: cursor.getMonth() === month });
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(row);
  }
  return weeks;
}

export function isDisabled(date: Date, min: Date | null, max: Date | null): boolean {
  if (min && compareDay(date, min) < 0) return true;
  if (max && compareDay(date, max) > 0) return true;
  return false;
}
