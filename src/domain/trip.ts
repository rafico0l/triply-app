/**
 * Canonical Trip aggregate.
 *
 * This is the owning container for a trip's financial records.
 *
 * IMPORTANT:
 * - No derived financial values are stored here (no totalSpent, balance, etc.).
 * - Financial truth comes from src/domain/finance.ts.
 * - Member compatibility fields (paid, balance) remain on Member temporarily
 *   because the UI has not been fully migrated yet.
 */

import type { Member, Expense, RecordedSettlement } from "./types";

export interface Trip {
  id: string;
  name: string;
  destination?: string;
  dates: string;
  startDate?: string;
  endDate?: string;
  status: "active" | "upcoming" | "completed";
  budget?: number; // undefined / absent = pay-as-you-go
  coverImage?: string;
  travelerCount?: number;
  durationDays?: number;
  inviteCode?: string;
  joinCode?: string;
  members: Member[];
  expenses: Expense[];
  settlements: RecordedSettlement[];
}

/**
 * Compute the effective lifecycle status of a trip from its dates.
 *
 * The persisted `status` field is unreliable (always set to "active" on
 * creation and never transitioned). This function derives the true status
 * from the trip's date range relative to today.
 *
 * Falls back to the persisted status when no dates are available.
 */
export function computeTripStatus(
  trip: { startDate?: string; endDate?: string; status: Trip["status"] }
): Trip["status"] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = trip.startDate ? new Date(trip.startDate) : null;
  const end = trip.endDate ? new Date(trip.endDate) : null;

  if (start) start.setHours(0, 0, 0, 0);
  if (end) end.setHours(0, 0, 0, 0);

  if (start && end) {
    if (today >= start && today <= end) return "active";
    if (today < start) return "upcoming";
    return "completed";
  }

  if (start && !end) {
    return today >= start ? "active" : "upcoming";
  }

  if (!start && end) {
    return today <= end ? "active" : "completed";
  }

  return trip.status;
}

/**
 * Compute inclusive calendar-day duration from trip dates.
 *
 * Counts both start and end dates:
 *   Sep 10 → Sep 10 = 1 Day
 *   Sep 10 → Sep 11 = 2 Days
 *   Sep 10 → Sep 13 = 4 Days
 *
 * Uses calendar-day math (not elapsed hours) so timezone/time-of-day
 * differences cannot turn a multi-day trip into an incorrect duration.
 *
 * Falls back to the persisted `durationDays` field if dates are missing.
 * Returns undefined only if neither dates nor durationDays are available.
 */
export function computeDurationDays(trip: {
  startDate?: string;
  endDate?: string;
  durationDays?: number;
}): number | undefined {
  const start = trip.startDate ? new Date(trip.startDate) : null;
  const end = trip.endDate ? new Date(trip.endDate) : null;

  if (start) start.setHours(0, 0, 0, 0);
  if (end) end.setHours(0, 0, 0, 0);

  if (start && end) {
    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;
  }

  return trip.durationDays;
}

/**
 * localStorage key for persisting the user's last selected trip.
 */
export const LAST_SELECTED_TRIP_KEY = "triply:lastSelectedTripId";

/**
 * Resolve the default current trip from a list of accessible trips.
 *
 * Priority:
 * 1. Active trip (most recent start date)
 * 2. Nearest upcoming trip (earliest start date)
 * 3. Most recently completed trip (latest end date)
 * 4. null (no trips)
 *
 * Deterministic tie-breaking uses lexicographic trip.id comparison.
 * Uses computeTripStatus() for lifecycle determination.
 */
export function resolveDefaultTripId(trips: Trip[]): string | null {
  if (trips.length === 0) return null;

  const dated = trips.map((t) => ({
    trip: t,
    status: computeTripStatus(t),
    startDate: t.startDate ? new Date(t.startDate) : null,
    endDate: t.endDate ? new Date(t.endDate) : null,
  }));

  // Active trips: most recent start date first
  const active = dated
    .filter((d) => d.status === "active")
    .sort((a, b) => {
      if (a.startDate && b.startDate) {
        const diff = b.startDate.getTime() - a.startDate.getTime();
        if (diff !== 0) return diff;
      } else if (a.startDate) return -1;
      else if (b.startDate) return 1;
      return a.trip.id.localeCompare(b.trip.id);
    });

  if (active.length > 0) return active[0].trip.id;

  // Upcoming trips: earliest start date first
  const upcoming = dated
    .filter((d) => d.status === "upcoming")
    .sort((a, b) => {
      if (a.startDate && b.startDate) {
        const diff = a.startDate.getTime() - b.startDate.getTime();
        if (diff !== 0) return diff;
      } else if (a.startDate) return -1;
      else if (b.startDate) return 1;
      return a.trip.id.localeCompare(b.trip.id);
    });

  if (upcoming.length > 0) return upcoming[0].trip.id;

  // Completed trips: most recent end date first
  const completed = dated
    .filter((d) => d.status === "completed")
    .sort((a, b) => {
      if (a.endDate && b.endDate) {
        const diff = b.endDate.getTime() - a.endDate.getTime();
        if (diff !== 0) return diff;
      } else if (a.endDate) return -1;
      else if (b.endDate) return 1;
      return a.trip.id.localeCompare(b.trip.id);
    });

  if (completed.length > 0) return completed[0].trip.id;

  return null;
}
