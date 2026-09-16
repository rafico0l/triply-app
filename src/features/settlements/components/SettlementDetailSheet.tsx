import { useState, useEffect } from "react";
import Sheet from "../../../components/shared/Sheet";
import { Avatar } from "../../../components/shared/Avatar";
import { fmt } from "../../../lib/format";
import type { Member, RecordedSettlement } from "../../../domain/types";
import { IconArrowRight, IconTrash, IconInfo, IconEdit } from "../../../components/shared/icons";
import { getSupabase } from "../../../lib/supabase";
import { toMinorUnits, toMajorUnits } from "../../../domain/finance";

export default function SettlementDetailSheet({
  settlement, members, me, canDelete, onDelete, onClose, onEdit, refreshKey,
}: {
  settlement: RecordedSettlement; members: Member[]; me?: Member; canDelete: boolean;
  onDelete: () => void; onClose: () => void; onEdit?: () => void; refreshKey?: number;
}) {
  const from     = members.find((m) => m.id === settlement.from);
  const to       = members.find((m) => m.id === settlement.to);
  const recorder = members.find((m) => m.id === settlement.recordedBy);

  // ── Production pending-request state ──────────────────────────────────────────
  const [pendingRequest, setPendingRequest] = useState<{
    id: string;
    requestType: "edit" | "delete";
    originalAmountMinor: number;
    proposedAmountMinor: number | null;
    approverName: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function checkPending() {
      try {
        const sb = getSupabase();
        const { data: requests } = await sb
          .from("settlement_requests")
          .select("id, request_type, original_amount_minor, proposed_amount_minor")
          .eq("settlement_id", settlement.id)
          .eq("status", "pending");
        if (cancelled) return;
        if (!requests || requests.length === 0) { setPendingRequest(null); return; }

        const request = requests[0];
        const { data: approvals } = await sb
          .from("settlement_request_approvals")
          .select("approver_id")
          .eq("request_id", request.id)
          .eq("status", "pending");
        if (cancelled) return;

        const approverIds = approvals?.map((a: { approver_id: string }) => a.approver_id) ?? [];
        const approverNames = approverIds
          .map((id) => members.find((m) => m.id === id)?.name)
          .filter(Boolean);
        const approverLabel = approverNames.length > 0
          ? approverNames.join(" and ")
          : "approval";

        setPendingRequest({
          id:                 request.id,
          requestType:        request.request_type,
          originalAmountMinor: request.original_amount_minor,
          proposedAmountMinor: request.proposed_amount_minor,
          approverName:       approverLabel,
        });
      } catch { /* non-critical — ignore */ }
    }
    checkPending();
    return () => { cancelled = true; };
  }, [settlement.id, members, refreshKey]);

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

        {/* Pending request state — production */}
        {pendingRequest && pendingRequest.requestType === "edit" && (
          <div className="bg-[#FFF8E1] border border-[#FDE68A] rounded-[12px] px-4 py-3 mb-3">
            <p className="text-[13px] font-700 text-[#92400E] mb-1">Change pending</p>
            <p className="text-[13px] font-500 text-[#92400E]">
              Current: {fmt(toMajorUnits(pendingRequest.originalAmountMinor))}
            </p>
            <p className="text-[13px] font-500 text-[#92400E]">
              Requested: {fmt(toMajorUnits(pendingRequest.proposedAmountMinor ?? 0))}
            </p>
            <p className="text-[12px] font-500 text-[#B45309] mt-1">
              Waiting for {pendingRequest.approverName}
            </p>
          </div>
        )}

        {pendingRequest && pendingRequest.requestType === "delete" && (
          <div className="bg-[#FFF8E1] border border-[#FDE68A] rounded-[12px] px-4 py-3 mb-3">
            <p className="text-[13px] font-700 text-[#92400E] mb-1">Deletion pending</p>
            <p className="text-[12px] font-500 text-[#B45309]">
              Waiting for {pendingRequest.approverName}
            </p>
          </div>
        )}

        {/* Production: Edit settlement — hidden while any request is pending */}
        {!pendingRequest && onEdit && me && (
          <button
            onClick={onEdit}
            className="pressable w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-left hover:bg-[#F0F9FF] border border-[#E1E7EF] mb-3"
          >
            <div className="w-8 h-8 rounded-[9px] bg-[#EFF9FB] flex items-center justify-center text-[#0A86A0] shrink-0">
              <IconEdit size={15} />
            </div>
            <div>
              <p className="text-[15px] font-600 text-[#0F172A]">Edit settlement</p>
              <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">
                Request an amount change
              </p>
            </div>
          </button>
        )}

        {/* Delete / info — hidden while any request is pending */}
        {!pendingRequest && canDelete ? (
          <button onClick={onDelete} className="pressable w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-left hover:bg-[#FFF5F5] mb-3">
            <div className="w-8 h-8 rounded-[9px] bg-[#FFF5F5] flex items-center justify-center text-[#DC2626] shrink-0">
              <IconTrash size={15} />
            </div>
            <div>
              <p className="text-[15px] font-600 text-[#DC2626]">Delete settlement</p>
              <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">Request deletion approval</p>
            </div>
          </button>
        ) : !pendingRequest && !canDelete ? (
          <div className="flex items-start gap-3 px-4 py-3 mb-3">
            <div className="w-8 h-8 rounded-[9px] bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] shrink-0 mt-0.5">
              <IconInfo size={14} />
            </div>
            <p className="text-[13px] font-500 text-[#475569] leading-relaxed">
              Only the person who recorded this or the Tour Owner can request deletion.
            </p>
          </div>
        ) : null}

        <button onClick={onClose} className="pressable w-full h-11 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-600 text-[14px]">Close</button>
      </div>
    </Sheet>
  );
}
