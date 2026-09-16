import { getSupabase } from "../../lib/supabase";
import { toMajorUnits } from "../../domain/finance";
import type { Member } from "../../domain/types";

export interface NotificationItem {
  requestId: string;
  requestType: "edit" | "delete";
  settlementId: string;
  tripId: string;
  tripName: string;
  requesterName: string;
  fromMember: { id: string; name: string; initials: string; color: string };
  toMember: { id: string; name: string; initials: string; color: string };
  originalAmountMinor: number;
  proposedAmountMinor: number | null;
  createdAt: string;
  approvalCount: number;
  totalApprovalRows: number;
}

export interface NotificationLoadResult {
  count: number;
  items: NotificationItem[];
}

export interface NotificationLoadError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Resolve ALL trip_member IDs for the authenticated user across all trips.
 * This avoids the single-trip identity assumption that caused badge/list inconsistency.
 */
async function resolveMyMemberIds(): Promise<string[]> {
  const sb = getSupabase();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return [];

  const { data: members } = await sb
    .from("trip_members")
    .select("id")
    .eq("user_id", user.id);
  return members?.map((m: { id: string }) => m.id) ?? [];
}

/**
 * Shared notification loader used by both badge count and NotificationsView.
 * Ensures consistent identity semantics and query logic.
 */
export async function loadPendingNotifications(
  currentMembers: Member[]
): Promise<NotificationLoadResult> {
  const sb = getSupabase();

  const myMemberIds = await resolveMyMemberIds();
  if (myMemberIds.length === 0) {
    return { count: 0, items: [] };
  }

  const { data: approvals, error: apprErr } = await sb
    .from("settlement_request_approvals")
    .select("request_id, approver_id, status")
    .in("approver_id", myMemberIds)
    .eq("status", "pending");
  if (apprErr) throw apprErr;
  if (!approvals || approvals.length === 0) {
    return { count: 0, items: [] };
  }

  const requestIds = [...new Set(approvals.map((a) => a.request_id))];
  const { data: requests, error: reqErr } = await sb
    .from("settlement_requests")
    .select("id, settlement_id, trip_id, requester_id, request_type, original_amount_minor, proposed_amount_minor, status, created_at")
    .in("id", requestIds)
    .eq("status", "pending");
  if (reqErr) throw reqErr;
  if (!requests || requests.length === 0) {
    return { count: 0, items: [] };
  }

  const tripIds = [...new Set(requests.map((r) => r.trip_id))];
  const { data: trips } = await sb
    .from("trips")
    .select("id, name")
    .in("id", tripIds);
  const tripMap = new Map(trips?.map((t: { id: string; name: string }) => [t.id, t.name]) ?? []);

  const requesterIds = [...new Set(requests.map((r) => r.requester_id))];
  const { data: requesterMembers } = await sb
    .from("trip_members")
    .select("id, name")
    .in("id", requesterIds);
  const requesterMap = new Map(requesterMembers?.map((m: { id: string; name: string }) => [m.id, m.name]) ?? []);

  const settlementIds = [...new Set(requests.map((r) => r.settlement_id).filter(Boolean))];
  const { data: settlements } = settlementIds.length > 0
    ? await sb.from("settlements").select("id, from_member_id, to_member_id").in("id", settlementIds)
    : { data: null };
  const settlementMap = new Map(settlements?.map((s: { id: string; from_member_id: string; to_member_id: string }) => [s.id, s]) ?? []);

  // Count ALL approval rows per request (not just pending) to derive required_approvals
  const { data: allApprovals } = await sb
    .from("settlement_request_approvals")
    .select("request_id, status")
    .in("request_id", requestIds);
  const approvalCounts = new Map<string, { pending: number; total: number }>();
  for (const a of allApprovals ?? []) {
    const existing = approvalCounts.get(a.request_id) ?? { pending: 0, total: 0 };
    existing.total++;
    if (a.status === "pending") existing.pending++;
    approvalCounts.set(a.request_id, existing);
  }

  const items: NotificationItem[] = requests.map((req) => {
    const settlement = settlementMap.get(req.settlement_id);
    const fromMember = currentMembers.find((m) => m.id === settlement?.from_member_id);
    const toMember = currentMembers.find((m) => m.id === settlement?.to_member_id);
    const counts = approvalCounts.get(req.id) ?? { pending: 0, total: 0 };
    return {
      requestId: req.id,
      requestType: req.request_type,
      settlementId: req.settlement_id,
      tripId: req.trip_id,
      tripName: tripMap.get(req.trip_id) ?? "Trip",
      requesterName: requesterMap.get(req.requester_id) ?? "Someone",
      fromMember: fromMember
        ? { id: fromMember.id, name: fromMember.name, initials: fromMember.initials, color: fromMember.color }
        : { id: "", name: "Unknown", initials: "??", color: "#94A3B8" },
      toMember: toMember
        ? { id: toMember.id, name: toMember.name, initials: toMember.initials, color: toMember.color }
        : { id: "", name: "Unknown", initials: "??", color: "#94A3B8" },
      originalAmountMinor: req.original_amount_minor,
      proposedAmountMinor: req.proposed_amount_minor,
      createdAt: req.created_at,
      approvalCount: counts.total - counts.pending,
      totalApprovalRows: counts.total,
    };
  });

  return { count: items.length, items };
}

/**
 * Format a notification load error for DEV display.
 */
export function formatNotificationError(err: unknown): NotificationLoadError {
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    return {
      message: typeof e.message === "string" ? e.message : "Unknown error",
      code: typeof e.code === "string" ? e.code : typeof e.code === "number" ? String(e.code) : undefined,
      details: typeof e.details === "string" ? e.details : undefined,
      hint: typeof e.hint === "string" ? e.hint : undefined,
    };
  }
  return { message: String(err) };
}
