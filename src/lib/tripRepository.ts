import { getSupabase } from "./supabase";
import { toMajorUnits, toMinorUnits } from "../domain/finance";
import type { Member, Expense, RecordedSettlement } from "../domain/types";
import type { Trip } from "../domain/trip";

// ── Error type ────────────────────────────────────────────────────────────────

export class TripRepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: "FETCH_FAILED" | "PARSE_FAILED" | "UNAUTHENTICATED",
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "TripRepositoryError";
  }
}

// ── Database row shapes ───────────────────────────────────────────────────────

interface DbTrip {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "active" | "upcoming" | "completed";
  budget_minor: number | null;
  cover_image: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface DbTripMember {
  id: string;
  trip_id: string;
  user_id: string | null;
  name: string;
  initials: string | null;
  color: string | null;
  role: "owner" | "member";
  created_at: string;
}

interface DbExpense {
  id: string;
  trip_id: string;
  paid_by: string;
  added_by: string;
  title: string;
  amount_minor: number;
  category: string;
  date_iso: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

interface DbExpenseParticipant {
  expense_id: string;
  member_id: string;
}

interface DbSettlement {
  id: string;
  trip_id: string;
  from_member_id: string;
  to_member_id: string;
  recorded_by: string;
  amount_minor: number;
  created_at: string;
}

// ── Loader ───────────────────────────────────────────────────────────────────

/**
 * Load all trips accessible to the authenticated user, together with
 * their members, expenses, participants, and settlements.
 *
 * Returns an empty array when the user has no trips.
 * Throws TripRepositoryError on Supabase/network failure.
 */
export async function loadTrips(userId: string): Promise<Trip[]> {
  const sb = getSupabase();

  if (!userId) {
    throw new TripRepositoryError("Missing user ID", "UNAUTHENTICATED");
  }

  // 1. Discover trips the user belongs to via trip_members
  const { data: memberRows, error: memberError } = await sb
    .from("trip_members")
    .select("trip_id")
    .eq("user_id", userId);

  if (memberError) {
    throw new TripRepositoryError(
      "Failed to load trip memberships",
      "FETCH_FAILED",
      memberError
    );
  }

  const memberTripIds = new Set((memberRows ?? []).map((r) => r.trip_id));

  // 2. Load trips (owned by user OR user is a member)
  let tripQuery = sb.from("trips").select("*");

  if (memberTripIds.size > 0) {
    const ids = Array.from(memberTripIds).join(",");
    tripQuery = tripQuery.or(`created_by.eq.${userId},id.in.(${ids})`);
  } else {
    tripQuery = tripQuery.eq("created_by", userId);
  }

  const { data: trips, error: tripsError } = await tripQuery;

  if (tripsError) {
    throw new TripRepositoryError(
      "Failed to load trips",
      "FETCH_FAILED",
      tripsError
    );
  }

  if (!trips || trips.length === 0) {
    return [];
  }

  const tripIds = trips.map((t) => t.id);

  // 3. Load related facts in parallel
  const [membersResult, expensesResult, settlementsResult] =
    await Promise.all([
      sb.from("trip_members").select("*").in("trip_id", tripIds),
      sb.from("expenses").select("*").in("trip_id", tripIds),
      sb.from("settlements").select("*").in("trip_id", tripIds),
    ]);

  if (membersResult.error) {
    throw new TripRepositoryError(
      "Failed to load members",
      "FETCH_FAILED",
      membersResult.error
    );
  }
  if (expensesResult.error) {
    throw new TripRepositoryError(
      "Failed to load expenses",
      "FETCH_FAILED",
      expensesResult.error
    );
  }
  if (settlementsResult.error) {
    throw new TripRepositoryError(
      "Failed to load settlements",
      "FETCH_FAILED",
      settlementsResult.error
    );
  }

  const dbMembers = membersResult.data ?? [];
  const dbExpenses = expensesResult.data ?? [];
  const dbSettlements = settlementsResult.data ?? [];

  // 4. Load expense participants (only if expenses exist)
  let dbParticipants: DbExpenseParticipant[] = [];
  if (dbExpenses.length > 0) {
    const expenseIds = dbExpenses.map((e) => e.id);
    const { data: participants, error: participantsError } = await sb
      .from("expense_participants")
      .select("*")
      .in("expense_id", expenseIds);

    if (participantsError) {
      throw new TripRepositoryError(
        "Failed to load expense participants",
        "FETCH_FAILED",
        participantsError
      );
    }

    dbParticipants = participants ?? [];
  }

  // 5. Build lookup structures
  const membersByTrip = buildMap(dbMembers, "trip_id");
  const expensesByTrip = buildMap(dbExpenses, "trip_id");
  const participantsByExpense = buildMap(dbParticipants, "expense_id");
  const settlementsByTrip = buildMap(dbSettlements, "trip_id");

  // 6. Map to canonical domain model
  return trips.map((dbTrip) =>
    mapTrip(
      dbTrip,
      membersByTrip,
      expensesByTrip,
      participantsByExpense,
      settlementsByTrip,
      userId
    )
  );
}

// ── Mapping helpers ──────────────────────────────────────────────────────────

function buildMap<T extends Record<K, string>, K extends string>(
  items: T[],
  key: K
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const value = item[key];
    const arr = map.get(value) ?? [];
    arr.push(item);
    map.set(value, arr);
  }
  return map;
}

function mapTrip(
  dbTrip: DbTrip,
  membersByTrip: Map<string, DbTripMember[]>,
  expensesByTrip: Map<string, DbExpense[]>,
  participantsByExpense: Map<string, DbExpenseParticipant[]>,
  settlementsByTrip: Map<string, DbSettlement[]>,
  currentUserId: string
): Trip {
  const dbMembers = membersByTrip.get(dbTrip.id) ?? [];
  const dbExpenses = expensesByTrip.get(dbTrip.id) ?? [];
  const dbSettlements = settlementsByTrip.get(dbTrip.id) ?? [];

  const members: Member[] = dbMembers.map((m) => ({
    id: m.id,
    name: m.name,
    initials: m.initials ?? "",
    color: m.color ?? "#64748B",
    balance: 0,
    paid: 0,
    isMe: m.user_id === currentUserId,
    role: m.role as Member["role"],
  }));

  const expenses: Expense[] = dbExpenses.map((e) => {
    const participants = participantsByExpense.get(e.id) ?? [];
    return {
      id: e.id,
      title: e.title,
      amount: toMajorUnits(e.amount_minor),
      category: e.category as Expense["category"],
      paidBy: e.paid_by,
      splitIds: participants.map((p) => p.member_id),
      date: e.date_iso,
      dateIso: e.date_iso,
      note: e.note ?? undefined,
      addedBy: e.added_by,
      addedAt: e.created_at,
    };
  });

  const settlements: RecordedSettlement[] = dbSettlements.map((s) => ({
    id: s.id,
    from: s.from_member_id,
    to: s.to_member_id,
    amount: toMajorUnits(s.amount_minor),
    date: s.created_at.split("T")[0] ?? s.created_at,
    dateIso: s.created_at.split("T")[0] ?? s.created_at,
    recordedBy: s.recorded_by,
  }));

  return {
    id: dbTrip.id,
    name: dbTrip.name,
    destination: dbTrip.destination ?? undefined,
    dates: formatTripDates(dbTrip.start_date, dbTrip.end_date),
    startDate: dbTrip.start_date ?? undefined,
    endDate: dbTrip.end_date ?? undefined,
    status: dbTrip.status,
    budget: dbTrip.budget_minor != null ? toMajorUnits(dbTrip.budget_minor) : undefined,
    coverImage: dbTrip.cover_image ?? undefined,
    members,
    expenses,
    settlements,
  };
}

function formatTripDates(start?: string | null, end?: string | null): string {
  const startStr = start
    ? new Date(start + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

  const endStr = end
    ? new Date(end + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  if (!startStr) return "";
  if (!endStr || end === start) return endStr || startStr;
  return `${startStr}–${endStr}`;
}

// ── Create mutation ───────────────────────────────────────────────────────────

export interface CreateTripInput {
  name: string;
  destination: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  coverImageUrl?: string | null;
}

/**
 * Create a new trip and its owner membership.
 *
 * Atomicity: if owner membership creation fails, the trip row is deleted.
 * Returns the mapped canonical Trip on success.
 * Throws TripRepositoryError on failure.
 */
export async function createTrip(
  userId: string,
  input: CreateTripInput,
  ownerName: string
): Promise<Trip> {
  const sb = getSupabase();

  if (!userId) {
    throw new TripRepositoryError("Missing user ID", "UNAUTHENTICATED");
  }

  const tripInsert = {
    name: input.name.trim(),
    destination: input.destination.trim() || null,
    start_date: input.startDate || null,
    end_date: input.endDate || null,
    status: "active" as const,
    budget_minor: input.budget && input.budget > 0 ? toMinorUnits(input.budget) : null,
    cover_image: input.coverImageUrl || null,
    created_by: userId,
  };

  const { data: trip, error: tripError } = await sb
    .from("trips")
    .insert(tripInsert)
    .select("*")
    .single();

  if (tripError) {
    console.error("[tripRepository] trip insert failed:", {
      message: tripError.message,
      code: tripError.code,
      details: tripError.details,
      hint: tripError.hint,
    });
  }

  if (tripError || !trip) {
    throw new TripRepositoryError(
      "Failed to create trip",
      "FETCH_FAILED",
      tripError
    );
  }

  const initials = deriveInitials(ownerName);
  const memberInsert = {
    trip_id: trip.id,
    user_id: userId,
    name: ownerName.trim() || "You",
    initials,
    color: "#0A86A0",
    role: "owner" as const,
  };

  const { data: member, error: memberError } = await sb
    .from("trip_members")
    .insert(memberInsert)
    .select("*")
    .single();

  if (memberError) {
    console.error("[tripRepository] owner member insert failed:", {
      message: memberError.message,
      code: memberError.code,
      details: memberError.details,
      hint: memberError.hint,
    });
  }

  if (memberError || !member) {
    const { error: deleteError } = await sb
      .from("trips")
      .delete()
      .eq("id", trip.id);

    if (deleteError) {
      console.error("[tripRepository] rollback delete failed:", deleteError);
    }

    throw new TripRepositoryError(
      "Failed to add trip owner",
      "FETCH_FAILED",
      memberError
    );
  }

  const membersByTrip = new Map<string, DbTripMember[]>([[trip.id, [member]]]);
  return mapTrip(trip, membersByTrip, new Map(), new Map(), new Map(), userId);
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0]?.slice(0, 2).toUpperCase() ?? "";
}
