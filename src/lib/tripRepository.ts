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
  invite_code: string;
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
    inviteCode: dbTrip.invite_code,
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
    invite_code: generateInviteCode(),
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

// ── Update mutation ───────────────────────────────────────────────────────────

export interface UpdateTripInput {
  name: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
}

/**
 * Update an existing trip.
 *
 * Only mutable schema-backed fields are persisted.
 * Returns the mapped canonical Trip on success.
 * Throws TripRepositoryError on failure.
 */
export async function updateTrip(
  tripId: string,
  patch: UpdateTripInput
): Promise<Trip> {
  const sb = getSupabase();

  if (!tripId) {
    throw new TripRepositoryError("Missing trip ID", "UNAUTHENTICATED");
  }

  const updatePayload: Record<string, unknown> = {
    name: patch.name.trim(),
    destination: patch.destination?.trim() || null,
    start_date: patch.startDate || null,
    end_date: patch.endDate || null,
    budget_minor: patch.budget && patch.budget > 0 ? toMinorUnits(patch.budget) : null,
  };

  const { data: trip, error: tripError } = await sb
    .from("trips")
    .update(updatePayload)
    .eq("id", tripId)
    .select("*")
    .single();

  if (tripError) {
    console.error("[tripRepository] trip update failed:", {
      message: tripError.message,
      code: tripError.code,
      details: tripError.details,
      hint: tripError.hint,
    });
    throw new TripRepositoryError(
      "Failed to update trip",
      "FETCH_FAILED",
      tripError
    );
  }

  if (!trip) {
    throw new TripRepositoryError(
      "Trip not found after update",
      "FETCH_FAILED"
    );
  }

  // Reload related facts to return a complete canonical Trip
  const [membersResult, expensesResult, settlementsResult] =
    await Promise.all([
      sb.from("trip_members").select("*").eq("trip_id", trip.id),
      sb.from("expenses").select("*").eq("trip_id", trip.id),
      sb.from("settlements").select("*").eq("trip_id", trip.id),
    ]);

  if (membersResult.error) {
    throw new TripRepositoryError(
      "Failed to reload members after update",
      "FETCH_FAILED",
      membersResult.error
    );
  }
  if (expensesResult.error) {
    throw new TripRepositoryError(
      "Failed to reload expenses after update",
      "FETCH_FAILED",
      expensesResult.error
    );
  }
  if (settlementsResult.error) {
    throw new TripRepositoryError(
      "Failed to reload settlements after update",
      "FETCH_FAILED",
      settlementsResult.error
    );
  }

  const dbMembers = membersResult.data ?? [];
  const dbExpenses = expensesResult.data ?? [];
  const dbSettlements = settlementsResult.data ?? [];

  let dbParticipants: DbExpenseParticipant[] = [];
  if (dbExpenses.length > 0) {
    const expenseIds = dbExpenses.map((e) => e.id);
    const { data: participants, error: participantsError } = await sb
      .from("expense_participants")
      .select("*")
      .in("expense_id", expenseIds);

    if (participantsError) {
      throw new TripRepositoryError(
        "Failed to reload expense participants after update",
        "FETCH_FAILED",
        participantsError
      );
    }

    dbParticipants = participants ?? [];
  }

  const membersByTrip = buildMap(dbMembers, "trip_id");
  const expensesByTrip = buildMap(dbExpenses, "trip_id");
  const participantsByExpense = buildMap(dbParticipants, "expense_id");
  const settlementsByTrip = buildMap(dbSettlements, "trip_id");

  return mapTrip(
    trip,
    membersByTrip,
    expensesByTrip,
    participantsByExpense,
    settlementsByTrip,
    (trip.created_by)
  );
}

// ── Delete mutation ───────────────────────────────────────────────────────────

/**
 * Delete a trip by ID.
 *
 * Uses existing DB cascade relationships.
 * Throws TripRepositoryError on failure.
 */
export async function deleteTrip(tripId: string): Promise<void> {
  const sb = getSupabase();

  if (!tripId) {
    throw new TripRepositoryError("Missing trip ID", "UNAUTHENTICATED");
  }

  const { error } = await sb
    .from("trips")
    .delete()
    .eq("id", tripId);

  if (error) {
    console.error("[tripRepository] trip delete failed:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new TripRepositoryError(
      "Failed to delete trip",
      "FETCH_FAILED",
      error
    );
  }
}

// ── Member mutations ───────────────────────────────────────────────────────────

export interface AddGuestInput {
  tripId: string;
  name: string;
}

/**
 * Add a guest member to a trip.
 *
 * Creates a trip_members row with user_id = NULL and role = "member".
 * Returns the created Member on success.
 * Throws TripRepositoryError on failure.
 */
export async function addGuest(input: AddGuestInput): Promise<Member> {
  const sb = getSupabase();

  if (!input.tripId) {
    throw new TripRepositoryError("Missing trip ID", "UNAUTHENTICATED");
  }

  const name = input.name.trim();
  if (!name) {
    throw new TripRepositoryError("Guest name is required", "PARSE_FAILED");
  }

  const initials = deriveInitials(name);

  const memberInsert = {
    trip_id: input.tripId,
    user_id: null,
    name,
    initials,
    color: "#64748B",
    role: "member" as const,
  };

  const { data: member, error: memberError } = await sb
    .from("trip_members")
    .insert(memberInsert)
    .select("*")
    .single();

  if (memberError) {
    console.error("[tripRepository] add guest failed:", {
      message: memberError.message,
      code: memberError.code,
      details: memberError.details,
      hint: memberError.hint,
    });
    throw new TripRepositoryError(
      "Failed to add guest",
      "FETCH_FAILED",
      memberError
    );
  }

  if (!member) {
    throw new TripRepositoryError(
      "Guest not created",
      "FETCH_FAILED"
    );
  }

  return {
    id: member.id,
    name: member.name,
    initials: member.initials ?? "",
    color: member.color ?? "#64748B",
    balance: 0,
    paid: 0,
    isMe: false,
    role: member.role as Member["role"],
  };
}

export interface RenameMemberInput {
  tripId: string;
  memberId: string;
  name: string;
}

/**
 * Rename an existing member (typically a guest).
 *
 * Only mutable fields are persisted.
 * Throws TripRepositoryError on failure.
 */
export async function renameMember(input: RenameMemberInput): Promise<Member> {
  const sb = getSupabase();

  if (!input.tripId || !input.memberId) {
    throw new TripRepositoryError("Missing trip or member ID", "UNAUTHENTICATED");
  }

  const name = input.name.trim();
  if (!name) {
    throw new TripRepositoryError("Member name is required", "PARSE_FAILED");
  }

  const initials = deriveInitials(name);

  const { data: member, error: memberError } = await sb
    .from("trip_members")
    .update({
      name,
      initials,
    })
    .eq("id", input.memberId)
    .eq("trip_id", input.tripId)
    .select("*")
    .single();

  if (memberError) {
    console.error("[tripRepository] rename member failed:", {
      message: memberError.message,
      code: memberError.code,
      details: memberError.details,
      hint: memberError.hint,
    });
    throw new TripRepositoryError(
      "Failed to rename member",
      "FETCH_FAILED",
      memberError
    );
  }

  if (!member) {
    throw new TripRepositoryError(
      "Member not found after rename",
      "FETCH_FAILED"
    );
  }

  return {
    id: member.id,
    name: member.name,
    initials: member.initials ?? "",
    color: member.color ?? "#64748B",
    balance: 0,
    paid: 0,
    isMe: false,
    role: member.role as Member["role"],
  };
}

/**
 * Remove a member from a trip by member ID.
 *
 * WARNING: This is a hard delete. Use only after financial-history checks.
 * Throws TripRepositoryError on failure.
 */
export async function removeMember(tripId: string, memberId: string): Promise<void> {
  const sb = getSupabase();

  if (!tripId || !memberId) {
    throw new TripRepositoryError("Missing trip or member ID", "UNAUTHENTICATED");
  }

  const { error } = await sb
    .from("trip_members")
    .delete()
    .eq("id", memberId)
    .eq("trip_id", tripId);

  if (error) {
    console.error("[tripRepository] remove member failed:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new TripRepositoryError(
      "Failed to remove member",
      "FETCH_FAILED",
      error
    );
  }
}

// ── Invite / Join ──────────────────────────────────────────────────────────────

export interface JoinTripResult {
  tripId: string;
  memberId: string;
  role: Member["role"];
  isNewMember: boolean;
}

/**
 * Join a trip using an invite code.
 *
 * Calls the secure RPC `join_trip_by_invite` which:
 * - validates the invite
 * - returns existing membership if already joined
 * - otherwise creates a new member row
 *
 * Returns the trip/member info on success.
 * Throws TripRepositoryError on failure.
 */
export async function joinTripByInvite(inviteToken: string): Promise<JoinTripResult> {
  const sb = getSupabase();

  if (!inviteToken.trim()) {
    throw new TripRepositoryError("Missing invite code", "PARSE_FAILED");
  }

  const { data, error } = await sb.rpc("join_trip_by_invite", {
    invite_token: inviteToken.trim(),
  });

  if (error) {
    console.error("[tripRepository] join trip failed:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new TripRepositoryError(
      "Failed to join trip",
      "FETCH_FAILED",
      error
    );
  }

  if (!data || data.length === 0) {
    throw new TripRepositoryError("Invite not found", "PARSE_FAILED");
  }

  const row = data[0];
  return {
    tripId: row.trip_id,
    memberId: row.member_id,
    role: row.role as Member["role"],
    isNewMember: true,
  };
}

/**
 * Generate a unique invite code.
 */
export function generateInviteCode(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

// ── Expense mutations ──────────────────────────────────────────────────────────

export interface CreateExpenseInput {
  tripId: string;
  title: string;
  amount: number;
  category: string;
  dateIso: string;
  paidBy: string;
  splitIds: string[];
  addedBy: string;
  note?: string;
}

/**
 * Create a new expense and its participants.
 *
 * Atomicity: if participant insert fails, the expense row is deleted.
 * Returns the created Expense on success.
 * Throws TripRepositoryError on failure.
 */
export async function createExpense(input: CreateExpenseInput): Promise<Expense> {
  const sb = getSupabase();

  if (!input.tripId) {
    throw new TripRepositoryError("Missing trip ID", "UNAUTHENTICATED");
  }

  const expenseInsert = {
    trip_id: input.tripId,
    paid_by: input.paidBy,
    added_by: input.addedBy,
    title: input.title.trim(),
    amount_minor: toMinorUnits(input.amount),
    category: input.category,
    date_iso: input.dateIso,
    note: input.note ?? null,
  };

  const { data: expense, error: expenseError } = await sb
    .from("expenses")
    .insert(expenseInsert)
    .select("*")
    .single();

  if (expenseError) {
    console.error("[tripRepository] expense insert failed:", {
      message: expenseError.message,
      code: expenseError.code,
      details: expenseError.details,
      hint: expenseError.hint,
    });
    throw new TripRepositoryError(
      "Failed to create expense",
      "FETCH_FAILED",
      expenseError
    );
  }

  if (!expense) {
    throw new TripRepositoryError(
      "Expense not created",
      "FETCH_FAILED"
    );
  }

  // Insert participants
  const participantRows = input.splitIds.map((memberId) => ({
    expense_id: expense.id,
    member_id: memberId,
  }));

  const { error: participantsError } = await sb
    .from("expense_participants")
    .insert(participantRows);

  if (participantsError) {
    console.error("[tripRepository] expense participants insert failed:", {
      message: participantsError.message,
      code: participantsError.code,
      details: participantsError.details,
      hint: participantsError.hint,
    });

    // Rollback: delete the expense
    const { error: deleteError } = await sb
      .from("expenses")
      .delete()
      .eq("id", expense.id);

    if (deleteError) {
      console.error("[tripRepository] expense rollback delete failed:", deleteError);
    }

    throw new TripRepositoryError(
      "Failed to save expense participants",
      "FETCH_FAILED",
      participantsError
    );
  }

  return mapDbExpense(expense);
}

export interface UpdateExpenseInput {
  tripId: string;
  expenseId: string;
  title: string;
  amount: number;
  category: string;
  dateIso: string;
  paidBy: string;
  splitIds: string[];
  note?: string;
}

/**
 * Update an existing expense and synchronize its participants.
 *
 * Replaces all participant rows for the expense.
 * Returns the updated Expense on success.
 * Throws TripRepositoryError on failure.
 */
export async function updateExpense(input: UpdateExpenseInput): Promise<Expense> {
  const sb = getSupabase();

  if (!input.tripId || !input.expenseId) {
    throw new TripRepositoryError("Missing trip or expense ID", "UNAUTHENTICATED");
  }

  const updatePayload: Record<string, unknown> = {
    title: input.title.trim(),
    amount_minor: toMinorUnits(input.amount),
    category: input.category,
    date_iso: input.dateIso,
    paid_by: input.paidBy,
    note: input.note ?? null,
  };

  const { data: expense, error: expenseError } = await sb
    .from("expenses")
    .update(updatePayload)
    .eq("id", input.expenseId)
    .eq("trip_id", input.tripId)
    .select("*")
    .single();

  if (expenseError) {
    console.error("[tripRepository] expense update failed:", {
      message: expenseError.message,
      code: expenseError.code,
      details: expenseError.details,
      hint: expenseError.hint,
    });
    throw new TripRepositoryError(
      "Failed to update expense",
      "FETCH_FAILED",
      expenseError
    );
  }

  if (!expense) {
    throw new TripRepositoryError(
      "Expense not found after update",
      "FETCH_FAILED"
    );
  }

  // Synchronize participants: delete all and re-insert
  const { error: deleteParticipantsError } = await sb
    .from("expense_participants")
    .delete()
    .eq("expense_id", input.expenseId);

  if (deleteParticipantsError) {
    console.error("[tripRepository] expense participants delete failed:", {
      message: deleteParticipantsError.message,
      code: deleteParticipantsError.code,
      details: deleteParticipantsError.details,
      hint: deleteParticipantsError.hint,
    });
    throw new TripRepositoryError(
      "Failed to update expense participants",
      "FETCH_FAILED",
      deleteParticipantsError
    );
  }

  const participantRows = input.splitIds.map((memberId) => ({
    expense_id: input.expenseId,
    member_id: memberId,
  }));

  const { error: insertParticipantsError } = await sb
    .from("expense_participants")
    .insert(participantRows);

  if (insertParticipantsError) {
    console.error("[tripRepository] expense participants re-insert failed:", {
      message: insertParticipantsError.message,
      code: insertParticipantsError.code,
      details: insertParticipantsError.details,
      hint: insertParticipantsError.hint,
    });
    throw new TripRepositoryError(
      "Failed to update expense participants",
      "FETCH_FAILED",
      insertParticipantsError
    );
  }

  return mapDbExpense(expense);
}

/**
 * Delete an expense by ID.
 *
 * Uses existing DB cascade for expense_participants.
 * Throws TripRepositoryError on failure.
 */
export async function deleteExpense(tripId: string, expenseId: string): Promise<void> {
  const sb = getSupabase();

  if (!tripId || !expenseId) {
    throw new TripRepositoryError("Missing trip or expense ID", "UNAUTHENTICATED");
  }

  const { error } = await sb
    .from("expenses")
    .delete()
    .eq("id", expenseId)
    .eq("trip_id", tripId);

  if (error) {
    console.error("[tripRepository] expense delete failed:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });
    throw new TripRepositoryError(
      "Failed to delete expense",
      "FETCH_FAILED",
      error
    );
  }
}

// ── Settlement mutations ──────────────────────────────────────────────────────

export interface CreateSettlementInput {
  tripId: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  recordedBy: string;
}

/**
 * Record a new settlement.
 *
 * Returns the persisted RecordedSettlement on success.
 * Throws TripRepositoryError on failure.
 */
export async function createSettlement(input: CreateSettlementInput): Promise<RecordedSettlement> {
  const sb = getSupabase();

  if (!input.tripId) {
    throw new TripRepositoryError("Missing trip ID", "UNAUTHENTICATED");
  }

  if (!input.fromMemberId || !input.toMemberId) {
    throw new TripRepositoryError("Missing from/to member", "PARSE_FAILED");
  }

  if (input.fromMemberId === input.toMemberId) {
    throw new TripRepositoryError("From and To must be different members", "PARSE_FAILED");
  }

  if (!input.recordedBy) {
    throw new TripRepositoryError("Missing recorded-by member", "UNAUTHENTICATED");
  }

  const amountNum = parseFloat(String(input.amount));
  if (isNaN(amountNum) || amountNum <= 0) {
    throw new TripRepositoryError("Settlement amount must be greater than 0", "PARSE_FAILED");
  }

  const settlementInsert = {
    trip_id: input.tripId,
    from_member_id: input.fromMemberId,
    to_member_id: input.toMemberId,
    recorded_by: input.recordedBy,
    amount_minor: toMinorUnits(amountNum),
  };

  const { data: settlement, error: settlementError } = await sb
    .from("settlements")
    .insert(settlementInsert)
    .select("*")
    .single();

  if (settlementError) {
    console.error("[tripRepository] settlement insert failed:", {
      message: settlementError.message,
      code: settlementError.code,
      details: settlementError.details,
      hint: settlementError.hint,
    });
    throw new TripRepositoryError(
      "Failed to record settlement",
      "FETCH_FAILED",
      settlementError
    );
  }

  if (!settlement) {
    throw new TripRepositoryError(
      "Settlement not created",
      "FETCH_FAILED"
    );
  }

  return mapDbSettlement(settlement);
}

// ── Mapping helpers ──────────────────────────────────────────────────────────

function mapDbExpense(db: DbExpense): Expense {
  return {
    id: db.id,
    title: db.title,
    amount: toMajorUnits(db.amount_minor),
    category: db.category as Expense["category"],
    paidBy: db.paid_by,
    splitIds: [],
    date: db.date_iso,
    dateIso: db.date_iso,
    note: db.note ?? undefined,
    addedBy: db.added_by,
    addedAt: db.created_at,
  };
}

function mapDbSettlement(db: DbSettlement): RecordedSettlement {
  return {
    id: db.id,
    from: db.from_member_id,
    to: db.to_member_id,
    amount: toMajorUnits(db.amount_minor),
    date: db.created_at.split("T")[0] ?? db.created_at,
    dateIso: db.created_at.split("T")[0] ?? db.created_at,
    recordedBy: db.recorded_by,
  };
}
