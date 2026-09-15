import { useState } from "react";
import Sheet from "../../../components/shared/Sheet";
import { Avatar } from "../../../components/shared/Avatar";
import { fmt } from "../../../lib/format";
import type { Member, RecordedSettlement } from "../../../domain/types";
import { IconArrowRight, IconTrash, IconInfo } from "../../../components/shared/icons";
import { getSupabase } from "../../../lib/supabase";
import { toMinorUnits } from "../../../domain/finance";

export default function SettlementDetailSheet({
  settlement, members, me, canDelete, onDelete, onClose,
}: {
  settlement: RecordedSettlement; members: Member[]; me?: Member; canDelete: boolean; onDelete: () => void; onClose: () => void;
}) {
  const from     = members.find((m) => m.id === settlement.from);
  const to       = members.find((m) => m.id === settlement.to);
  const recorder = members.find((m) => m.id === settlement.recordedBy);

  const [devLoading, setDevLoading] = useState(false);
  const [devResult, setDevResult] = useState<string | null>(null);

  const [devPendingRequestId, setDevPendingRequestId] = useState<string | null>(null);
  const [devPendingOriginal, setDevPendingOriginal] = useState<number | null>(null);
  const [devPendingProposed, setDevPendingProposed] = useState<number | null>(null);
  const [devApproveLoading, setDevApproveLoading] = useState(false);

  async function handleDevTestEditRequest() {
    setDevLoading(true);
    setDevResult(null);
    try {
      const sb = getSupabase();
      const proposedMajor = settlement.amount + 1;
      const proposedMinor = toMinorUnits(proposedMajor);
      const { data, error } = await sb.rpc("create_settlement_request", {
        p_settlement_id: settlement.id,
        p_request_type: "edit",
        p_proposed_amount_minor: proposedMinor,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      setDevResult(
        `OK — request created\n` +
        `ID: ${row?.id ?? "n/a"}\n` +
        `Current: ${fmt(settlement.amount)}\n` +
        `Proposed: ${fmt(proposedMajor)}`
      );
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      const parts: string[] = [];
      if (typeof e.message === "string") parts.push(e.message);
      if (typeof e.code === "string" || typeof e.code === "number") parts.push(`Code: ${e.code}`);
      if (typeof e.details === "string" && e.details) parts.push(`Details: ${e.details}`);
      if (typeof e.hint === "string" && e.hint) parts.push(`Hint: ${e.hint}`);
      setDevResult(parts.length > 0 ? `ERROR\n${parts.join("\n")}` : `ERROR: ${JSON.stringify(err)}`);
    } finally {
      setDevLoading(false);
    }
  }

  async function handleDevDiscoverPendingRequest() {
    if (!me) return;
    setDevResult(null);
    try {
      const sb = getSupabase();
      const { data: requests, error: reqErr } = await sb
        .from("settlement_requests")
        .select("id, original_amount_minor, proposed_amount_minor")
        .eq("settlement_id", settlement.id)
        .eq("status", "pending");
      if (reqErr) throw reqErr;
      if (!requests || requests.length === 0) {
        setDevResult("No pending request found for this settlement.");
        return;
      }
      const requestIds = requests.map((r: { id: string }) => r.id);
      const { data: approvals, error: apprErr } = await sb
        .from("settlement_request_approvals")
        .select("request_id, approver_id, status")
        .in("request_id", requestIds)
        .eq("approver_id", me.id)
        .eq("status", "pending");
      if (apprErr) throw apprErr;
      if (!approvals || approvals.length === 0) {
        setDevResult(
          `Found ${requests.length} pending request(s) but you are not a pending approver.\n` +
          `Request IDs: ${requestIds.join(", ")}`
        );
        return;
      }
      const match = requests.find((r: { id: string }) =>
        approvals.some((a: { request_id: string }) => a.request_id === r.id)
      );
      if (match) {
        setDevPendingRequestId(match.id);
        setDevPendingOriginal(match.original_amount_minor);
        setDevPendingProposed(match.proposed_amount_minor);
        setDevResult(
          `Found pending request you can approve:\n` +
          `Request ID: ${match.id}\n` +
          `Original: ${fmt(match.original_amount_minor / 100)}\n` +
          `Proposed: ${fmt((match.proposed_amount_minor ?? 0) / 100)}`
        );
      }
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      const parts: string[] = [];
      if (typeof e.message === "string") parts.push(e.message);
      if (typeof e.code === "string" || typeof e.code === "number") parts.push(`Code: ${e.code}`);
      if (typeof e.details === "string" && e.details) parts.push(`Details: ${e.details}`);
      if (typeof e.hint === "string" && e.hint) parts.push(`Hint: ${e.hint}`);
      setDevResult(parts.length > 0 ? `ERROR\n${parts.join("\n")}` : `ERROR: ${JSON.stringify(err)}`);
    }
  }

  async function handleDevRespondRequest(response: "approved" | "rejected") {
    if (!devPendingRequestId) return;
    setDevApproveLoading(true);
    setDevResult(null);
    try {
      const sb = getSupabase();
      const { data, error } = await sb.rpc("respond_to_settlement_request", {
        p_request_id: devPendingRequestId,
        p_response: response,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      setDevResult(
        `SUCCESS\n` +
        `Request ID: ${row?.id ?? devPendingRequestId}\n` +
        `Status: ${row?.status ?? "n/a"}\n` +
        `Original: ${fmt((row?.original_amount_minor ?? 0) / 100)}\n` +
        `Proposed: ${fmt((row?.proposed_amount_minor ?? 0) / 100)}`
      );
      setDevPendingRequestId(null);
      setDevPendingOriginal(null);
      setDevPendingProposed(null);
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      const parts: string[] = [];
      if (typeof e.message === "string") parts.push(e.message);
      if (typeof e.code === "string" || typeof e.code === "number") parts.push(`Code: ${e.code}`);
      if (typeof e.details === "string" && e.details) parts.push(`Details: ${e.details}`);
      if (typeof e.hint === "string" && e.hint) parts.push(`Hint: ${e.hint}`);
      setDevResult(parts.length > 0 ? `ERROR\n${parts.join("\n")}` : `ERROR: ${JSON.stringify(err)}`);
    } finally {
      setDevApproveLoading(false);
    }
  }
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-1 pb-6">
        {/* Avatar pair + amount */}
        <div className="flex items-center justify-center gap-4 py-5 border-b border-[#F4F6F9] mb-4">
          <div className="flex flex-col items-center gap-1.5">
            {from && <Avatar member={from} size="lg" />}
            <p className="text-[12px] font-600 text-[#0F172A]">{from?.isMe ? "You" : from?.name.split(" ")[0]}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-[#C9D4DF]"><IconArrowRight size={20} /></div>
            <p className="num text-[20px] font-800 text-[#0A86A0]">{fmt(settlement.amount)}</p>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            {to && <Avatar member={to} size="lg" />}
            <p className="text-[12px] font-600 text-[#0F172A]">{to?.isMe ? "You" : to?.name.split(" ")[0]}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-[#F8FAFC] rounded-[12px] border border-[#E1E7EF] overflow-hidden mb-4">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F1F5F9]">
            <span className="text-[12px] font-600 text-[#94A3B8] w-24 shrink-0">Date</span>
            <span className="text-[14px] font-600 text-[#0F172A]">{settlement.date}, 2026</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-[12px] font-600 text-[#94A3B8] w-24 shrink-0">Recorded by</span>
            <span className="text-[14px] font-600 text-[#0F172A]">{recorder?.isMe ? "You" : (recorder?.name ?? "Unknown")}</span>
          </div>
        </div>

        {/* Delete / info */}
        {canDelete ? (
          <button onClick={onDelete} className="pressable w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-left hover:bg-[#FFF5F5] mb-3">
            <div className="w-8 h-8 rounded-[9px] bg-[#FFF5F5] flex items-center justify-center text-[#DC2626] shrink-0">
              <IconTrash size={15} />
            </div>
            <div>
              <p className="text-[15px] font-600 text-[#DC2626]">Delete settlement</p>
              <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">Balances will recalculate</p>
            </div>
          </button>
        ) : (
          <div className="flex items-start gap-3 px-4 py-3 mb-3">
            <div className="w-8 h-8 rounded-[9px] bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] shrink-0 mt-0.5">
              <IconInfo size={14} />
            </div>
            <p className="text-[13px] font-500 text-[#475569] leading-relaxed">
              Only the person who recorded this or the Tour Owner can delete it.
            </p>
          </div>
        )}

        {import.meta.env.DEV && (
          <div className="mb-3">
            <button
              onClick={handleDevTestEditRequest}
              disabled={devLoading}
              className="pressable w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-left hover:bg-[#FFF8E1] border border-dashed border-[#F59E0B]"
            >
              <div className="w-8 h-8 rounded-[9px] bg-[#FFF8E1] flex items-center justify-center text-[#D97706] shrink-0 font-700 text-[13px]">
                DEV
              </div>
              <div>
                <p className="text-[15px] font-600 text-[#D97706]">
                  {devLoading ? "Creating request..." : "Test edit request"}
                </p>
                <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">
                  Proposed: {fmt(settlement.amount + 1)}
                </p>
              </div>
            </button>
            {me && !devPendingRequestId && (
              <button
                onClick={handleDevDiscoverPendingRequest}
                className="pressable w-full flex items-center gap-3 px-4 py-3 mt-2 rounded-[12px] text-left hover:bg-[#F0F9FF] border border-dashed border-[#0EA5E9]"
              >
                <div className="w-8 h-8 rounded-[9px] bg-[#F0F9FF] flex items-center justify-center text-[#0284C7] shrink-0 font-700 text-[13px]">
                  DEV
                </div>
                <div>
                  <p className="text-[15px] font-600 text-[#0284C7]">Find pending request</p>
                  <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">
                    Check if you can approve/reject
                  </p>
                </div>
              </button>
            )}
            {me && devPendingRequestId && (
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleDevRespondRequest("approved")}
                  disabled={devApproveLoading}
                  className="pressable flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-[12px] text-left hover:bg-[#F0FDF4] border border-dashed border-[#22C55E]"
                >
                  <div className="w-8 h-8 rounded-[9px] bg-[#F0FDF4] flex items-center justify-center text-[#16A34A] shrink-0 font-700 text-[13px]">
                    DEV
                  </div>
                  <p className="text-[15px] font-600 text-[#16A34A]">
                    {devApproveLoading ? "Approving..." : "Approve request"}
                  </p>
                </button>
                <button
                  onClick={() => handleDevRespondRequest("rejected")}
                  disabled={devApproveLoading}
                  className="pressable flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-[12px] text-left hover:bg-[#FFF5F5] border border-dashed border-[#EF4444]"
                >
                  <div className="w-8 h-8 rounded-[9px] bg-[#FFF5F5] flex items-center justify-center text-[#DC2626] shrink-0 font-700 text-[13px]">
                    DEV
                  </div>
                  <p className="text-[15px] font-600 text-[#DC2626]">
                    {devApproveLoading ? "Rejecting..." : "Reject request"}
                  </p>
                </button>
              </div>
            )}
            {devResult && (
              <pre className="mt-2 px-3 py-2 rounded-[8px] bg-[#F8FAFC] border border-[#E1E7EF] text-[12px] font-500 text-[#0F172A] whitespace-pre-wrap">
                {devResult}
              </pre>
            )}
          </div>
        )}

        <button onClick={onClose} className="pressable w-full h-11 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-600 text-[14px]">Close</button>
      </div>
    </Sheet>
  );
}
