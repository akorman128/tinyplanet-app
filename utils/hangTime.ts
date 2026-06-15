// Time helpers for Hangs. A Hang has a single start time and stays active until
// HANG_DURATION_MS after it starts (see the hangs migrations). These formatters
// drive the feed card, map preview, and detail screen.

export const HANG_DURATION_MS = 3 * 60 * 60 * 1000;
/** A Hang can be scheduled at most this far in advance. */
export const HANG_MAX_ADVANCE_MS = 7 * 24 * 60 * 60 * 1000;
/** Grace window so a "now" default doesn't fail validation on submission delay. */
export const HANG_PAST_GRACE_MS = 60 * 1000;

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const timeOfDay = (d: Date) =>
  d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/** Compact "when" for cards/markers: "Today · 5:00 PM" / "Sat · 5:00 PM" / "Jun 12 · 5:00 PM". */
export function formatHangWhen(startsAt: string): string {
  const start = new Date(startsAt);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  let day: string;
  if (isSameDay(start, now)) {
    day = "Today";
  } else if (isSameDay(start, tomorrow)) {
    day = "Tomorrow";
  } else {
    const withinWeek =
      start.getTime() - now.getTime() < 6 * 24 * 60 * 60 * 1000;
    day = withinWeek
      ? start.toLocaleDateString("en-US", { weekday: "short" })
      : start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return `${day} · ${timeOfDay(start)}`;
}

/** Long date for the detail screen: "Thursday, June 12". */
export function formatHangDateLong(startsAt: string): string {
  return new Date(startsAt).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** Time range + remaining for the detail screen: "5:00 – 8:00 PM · ends in 2h". */
export function formatHangTimeRange(startsAt: string): string {
  const start = new Date(startsAt);
  const end = new Date(start.getTime() + HANG_DURATION_MS);
  const range = `${timeOfDay(start)} – ${timeOfDay(end)}`;

  const msLeft = end.getTime() - Date.now();
  if (msLeft <= 0) return `${range} · ended`;

  const hoursLeft = Math.floor(msLeft / (60 * 60 * 1000));
  const minsLeft = Math.round((msLeft % (60 * 60 * 1000)) / (60 * 1000));
  const remaining =
    hoursLeft > 0
      ? `${hoursLeft}h${minsLeft > 0 ? ` ${minsLeft}m` : ""}`
      : `${minsLeft}m`;
  return `${range} · ends in ${remaining}`;
}

/** True once the hang's active window (start + duration) has passed. */
export function isHangExpired(startsAt: string): boolean {
  return new Date(startsAt).getTime() + HANG_DURATION_MS < Date.now();
}
