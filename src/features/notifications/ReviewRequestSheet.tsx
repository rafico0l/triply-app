import { useState } from "react";
import Sheet from "../../components/shared/Sheet";
import { Avatar } from "../../components/shared/Avatar";
import { fmt } from "../../lib/format";
import { getSupabase } from "../../lib/supabase";
import { toMajorUnits } from "../../domain/finance";
import { IconArrowRight } from "../../components/shared/icons";
import type { Member } from "../../domain/types";
import type { NotificationItem } from "./notificationLoader";

export default function ReviewRequestSheet({
  request,
  me,
  onClose,
  onComplete,
}: {
  request: NotificationItem;
  me: Member;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [responding, setResponding] = useState(false);
  const [result, setResult] = useState<"approved" | "rejected" | null>(null);
  const [remainingApprovals, setRemainingApprovals] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  async function handleRespond(response: "approved" | "rejected") {
    setResponding(true);
    setError(null);
    try {
      const sb = getSupabase();
      const { data, error: rpcErr } = await sb.rpc("respond_to_settlement_request", {
        p_request_id: request.requestId,
        p_response: response,
      });
      if (rpcErr) throw rpcErr;
      const row = Array.isArray(data) ? data[0] : data;
      const status = row?.status ?? response;
      const remaining = (request.totalApprovalRows - request.approvalCount - (response === "approved" ? 1 : 0));
      setRemainingApprovals(response === "approved" ? Math.max(0, remaining) : 0);
      setResult(status === "approved" && remaining > 0 ? "approved" : status === "approved" ? "approved" : "rejected");
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      const parts: string[] = [];
      if (typeof e.message === "string") parts.push(e.message);
      if (typeof e.code === "string" || typeof e.code === "number") parts.push(`Code: ${e.code}`);
      if (typeof e.details === "string" && e.details) parts.push(`Details: ${e.details}`);
      if (typeof e.hint === "string" && e.hint) parts.push(`Hint: ${e.hint}`);
      setError(parts.length > 0 ? parts.join("\n") : "Something went wrong.");
    } finally {
      setResponding(false);
    }
  }

  if (result) {
    return (
      <Sheet onClose={onClose}>
        <div className="px-5 pt-2 pb-6">
          <div className="flex flex-col items-center py-8">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
              result === "approved" ? "bg-[#F0FDF4] text-[#16A34A]" : "bg-[#FFF5F5] text-[#DC2626]"
            }`}>
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {result === "approved" ? (
                  <polyline points="20 6 9 17 4 12" />
                ) : (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                )}
              </svg>
            </div>
            <p className="text-[16px] font-700 text-[#0F172A] mb-1">
              {result === "approved" ? "Approval submitted" : "Request rejected"}
            </p>
            <p className="text-[13px] font-500 text-[#94A3B8] text-center">
              {result === "approved" && remainingApprovals > 0
                ? `Waiting for another approval.`
                : result === "approved"
                ? "Request approved."
                : "Original settlement remains unchanged."}
            </p>
          </div>
          <button onClick={onClose} className="pressable w-full h-11 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-600 text-[14px]">Done</button>
        </div>
      </Sheet>
    );
  }

  const dateLabel = new Date(request.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-1 pb-5">
        <h2 className="text-[16px] font-700 text-[#0F172A] mb-1">Review request</h2>

        <p className="text-[13px] font-500 text-[#475569] mb-0.5">
          {request.requesterName} wants to {request.requestType === "edit" ? "change" : "delete"} this settlement.
        </p>
        <p className="text-[12px] font-500 text-[#94A3B8] mb-4">
          {request.tripName} · {dateLabel}
        </p>

        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Avatar member={{ initials: request.fromMember.initials, color: request.fromMember.color }} size={32} />
            <span className="text-[14px] font-600 text-[#0F172A]">{request.fromMember.name}</span>
          </div>
          <div className="text-[#C9D4DF]"><IconArrowRight size={16} /></div>
          <div className="flex items-center gap-2">
            <Avatar member={{ initials: request.toMember.initials, color: request.toMember.color }} size={32} />
            <span className="text-[14px] font-600 text-[#0F172A]">{request.toMember.name}</span>
          </div>
        </div>

        {request.requestType === "edit" ? (
          <div className="bg-[#F8FAFC] rounded-[12px] border border-[#E1E7EF] px-4 py-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="text-[10px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">Current</p>
                <p className="text-[14px] font-600 text-[#475569]">{fmt(toMajorUnits(request.originalAmountMinor))}</p>
              </div>
              <div className="text-[#C9D4DF]"><IconArrowRight size={14} /></div>
              <div className="text-center">
                <p className="text-[10px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">Requested</p>
                <p className="text-[16px] font-700 text-[#0F172A]">{fmt(toMajorUnits(request.proposedAmountMinor ?? 0))}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <p className="text-[12px] font-600 text-[#94A3B8] mb-1">Settlement amount</p>
            <p className="text-[18px] font-700 text-[#0F172A] mb-2">{fmt(toMajorUnits(request.originalAmountMinor))}</p>
            <div className="bg-[#FFF8E1] border border-[#FDE68A] rounded-[10px] px-3 py-2.5">
              <p className="text-[12px] font-500 text-[#92400E]">
                Approving will remove this settlement and update the trip balances.
              </p>
            </div>
          </div>
        )}

        {request.totalApprovalRows > 1 && (
          <p className="text-[12px] font-500 text-[#94A3B8] mb-4">
            This request requires {request.totalApprovalRows} approvals. {request.approvalCount} of {request.totalApprovalRows} submitted so far.
          </p>
        )}

        {error && (
          <div className="bg-[#FFF5F5] border border-[#FECACA] rounded-[12px] px-4 py-3 mb-4">
            <p className="text-[13px] font-500 text-[#DC2626] whitespace-pre-wrap">{error}</p>
          </div>
        )}

        <div className="flex gap-3 mb-3">
          <button
            onClick={() => handleRespond("approved")}
            disabled={responding}
            className="pressable flex-1 h-11 rounded-[13px] bg-[#0A86A0] text-white font-600 text-[14px] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {responding && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            Approve
          </button>
          <button
            onClick={() => handleRespond("rejected")}
            disabled={responding}
            className="pressable flex-1 h-11 rounded-[13px] bg-[#F4F6F9] text-[#DC2626] font-600 text-[14px] border border-[#E1E7EF] flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {responding && <div className="w-4 h-4 border-2 border-[#DC2626] border-t-transparent rounded-full animate-spin" />}
            Reject
          </button>
        </div>

        <button onClick={onClose} disabled={responding} className="pressable w-full text-center text-[13px] font-600 text-[#94A3B8] py-1.5">Not now</button>
      </div>
    </Sheet>
  );
}
