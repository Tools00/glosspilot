/** Pure date helpers — no Date object semantics, ISO strings throughout. */

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
}

export function addDays(s: string, n: number): string {
  const d = parseISODate(s);
  d.setUTCDate(d.getUTCDate() + n);
  return toISODate(d);
}

/** Monday-first grid that fully covers the given month (always 42 days). */
export function monthGrid(year: number, month: number /* 0-11 */): string[] {
  const first = new Date(Date.UTC(year, month, 1));
  const dayOfWeek = (first.getUTCDay() + 6) % 7; // Mon=0
  const start = new Date(first);
  start.setUTCDate(first.getUTCDate() - dayOfWeek);
  const days: string[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    days.push(toISODate(d));
  }
  return days;
}

export function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 1)).toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Inclusive range check. */
export function inRange(day: string, from: string, to: string): boolean {
  return day >= from && day <= to;
}
