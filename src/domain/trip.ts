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
