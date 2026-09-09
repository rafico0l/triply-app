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
