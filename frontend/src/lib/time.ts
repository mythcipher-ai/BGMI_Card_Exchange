// Shared time-formatting helpers used by listing UI.

export type ExpiryTone = "fresh" | "soon" | "urgent" | "expired";

export interface ExpiryInfo {
  label: string;
  tone: ExpiryTone;
}

/**
 * Returns a short human countdown to the given ISO date, plus a "tone" so the
 * UI can color it.
 *
 * Tiers:
 *   - expired: already past
 *   - urgent : under 6 hours left (red)
 *   - soon   : under 24 hours left (amber)
 *   - fresh  : more than a day left (muted)
 */
export function expiresIn(date: string | Date): ExpiryInfo {
  const target = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  const remaining = target - Date.now();

  if (remaining <= 0) return { label: "Expired", tone: "expired" };

  const mins = Math.floor(remaining / 60000);
  if (mins < 60) return { label: `${Math.max(mins, 1)}m left`, tone: "urgent" };

  const hrs = Math.floor(mins / 60);
  if (hrs < 6) return { label: `${hrs}h left`, tone: "urgent" };
  if (hrs < 24) return { label: `${hrs}h left`, tone: "soon" };

  const days = Math.floor(hrs / 24);
  const remHrs = hrs % 24;
  return { label: remHrs > 0 ? `${days}d ${remHrs}h left` : `${days}d left`, tone: "fresh" };
}

export const EXPIRY_TONE_CLASS: Record<ExpiryTone, string> = {
  fresh: "text-muted-foreground",
  soon: "text-amber-400",
  urgent: "text-destructive",
  expired: "text-destructive"
};
