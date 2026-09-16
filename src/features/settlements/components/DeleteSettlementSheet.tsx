import { useState } from "react";
import Sheet from "../../../components/shared/Sheet";
import { fmt } from "../../../lib/format";
import { getSupabase } from "../../../lib/supabase";
import type { Member, RecordedSettlement } from "../../../domain/types";
import { Avatar } from "../../../components/shared/Avatar";
import { IconTrash } from "../../../components/shared/icons";

export default function DeleteSettlementSheet({
  settlement, members, onRequested, onClose,
}: {
  settlement: RecordedSettlement; members: Member[];
  onRequested: () => void; onClose: () => void;
}) {
  const from = members.find((m) => m.id === settlement.from);
  const to   = members.find((m) => m.id === settlement.to);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleRequest() {
    setLoading(true);
    setError(null);
    try {
      const sb = getSupabase();
      const { error: rpcError } = await sb.rpc("create_settlement_request", {
        p_settlement_id: settlement.id,
        p_request_type: "delete",
        p_proposed_amount_minor: null,
      });
      if (rpcError) throw rpcError;
      onRequested();
    } catch (err: unknown) {
      const e = err as Record<string, unknown>;
      const msg = typeof e.message === "string" ? e.message : "Something went wrong.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[12px] bg-[#FFF5F5] flex items-center justify-center text-[#DC2626] shrink-0">
            <IconTrash size={18} />
          </div>
          <div>
            <p className="text-[16px] font-700 text-[#0F172A]">Delete settlement?</p>
            <p className="text-[13px] font-500 text-[#94A3B8] mt-0.5">
              {from?.isMe ? "You" : from?.name.split(" ")[0]} → {to?.isMe ? "you" : to?.name.split(" ")[0]} · {fmt(settlement.amount)}
            </p>
          </div>
        </div>
        <div className="bg-[#FFF5F5] border border-[#FECACA] rounded-[12px] px-4 py-3 mb-4">
          <p className="text-[13px] font-500 text-[#DC2626] leading-relaxed">
            This will send a deletion request for approval. The settlement will remain active until the request is approved.
          </p>
        </div>

        {error && (
          <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-[12px] px-4 py-3 mb-4">
            <p className="text-[13px] font-600 text-[#DC2626]">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} disabled={loading}
            className="pressable flex-1 h-12 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-700 text-[15px]">
            Cancel
          </button>
          <button onClick={handleRequest} disabled={loading}
            className="pressable flex-1 h-12 rounded-[13px] bg-[#DC2626] text-white font-700 text-[15px] flex items-center justify-center gap-2">
            {loading ? "Requesting\u2026" : "Request deletion"}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
