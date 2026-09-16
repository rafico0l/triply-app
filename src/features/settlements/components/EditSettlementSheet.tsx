import { useState } from "react";
import Sheet from "../../../components/shared/Sheet";
import { Avatar } from "../../../components/shared/Avatar";
import { fmt } from "../../../lib/format";
import { toMinorUnits } from "../../../domain/finance";
import { getSupabase } from "../../../lib/supabase";
import type { Member, RecordedSettlement } from "../../../domain/types";
import { IconArrowRight } from "../../../components/shared/icons";

export default function EditSettlementSheet({
  settlement, members, onClose, onRequested,
}: {
  settlement: RecordedSettlement;
  members: Member[];
  onClose: () => void;
  onRequested: () => void;
}) {
  const from = members.find((m) => m.id === settlement.from);
  const to   = members.find((m) => m.id === settlement.to);

  const [amountStr, setAmountStr] = useState(String(settlement.amount));
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [touched,  setTouched]  = useState(false);

  const amount  = parseFloat(amountStr);
  const changed = !isNaN(amount) && amount > 0 && amount !== settlement.amount;
  const canSubmit = changed && !loading;

  async function handleSubmit() {
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const sb = getSupabase();
      const { error: rpcError } = await sb.rpc("create_settlement_request", {
        p_settlement_id: settlement.id,
        p_request_type: "edit",
        p_proposed_amount_minor: toMinorUnits(amount),
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
      <div className="px-5 pt-2 pb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[17px] font-700 text-[#0F172A]">Edit settlement</h2>
          <button onClick={onClose} className="pressable text-[14px] font-600 text-[#94A3B8]">Cancel</button>
        </div>

        {/* From → To — compact horizontal */}
        <div className="bg-[#F8FAFC] rounded-[12px] border border-[#E1E7EF] px-4 py-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-[10px] font-700 text-[#94A3B8] uppercase tracking-wide mb-1.5">From</p>
              <div className="flex items-center gap-2">
                {from && <Avatar member={{ initials: from.initials, color: from.color }} size={28} />}
                <div className="flex flex-col">
                  <span className="text-[14px] font-600 text-[#0F172A] leading-tight">{from?.name}</span>
                  {from?.isMe && <span className="text-[11px] font-500 text-[#94A3B8]">You</span>}
                </div>
              </div>
            </div>
            <div className="text-[#C9D4DF] px-3"><IconArrowRight size={16} /></div>
            <div className="text-right">
              <p className="text-[10px] font-700 text-[#94A3B8] uppercase tracking-wide mb-1.5">To</p>
              <div className="flex items-center gap-2 justify-end">
                <div className="flex flex-col items-end">
                  <span className="text-[14px] font-600 text-[#0F172A] leading-tight">{to?.name}</span>
                  {to?.isMe && <span className="text-[11px] font-500 text-[#94A3B8]">You</span>}
                </div>
                {to && <Avatar member={{ initials: to.initials, color: to.color }} size={28} />}
              </div>
            </div>
          </div>
        </div>

        {/* Amount */}
        <div className="mb-3">
          <label className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wide block mb-1.5">Amount</label>
          <div className={`flex items-center gap-2 rounded-[13px] border h-[50px] px-4 transition-colors ${
            touched && (isNaN(amount) || amount <= 0) ? "border-[#FECACA] bg-[#FFF5F5]" : "bg-[#F8FAFC] border-[#E1E7EF] focus-within:border-[#0A86A0] focus-within:bg-white"
          }`}>
            <span className="text-[18px] font-700 text-[#94A3B8]">৳</span>
            <input
              type="number" inputMode="decimal" placeholder="0" value={amountStr}
              onChange={(e) => { setAmountStr(e.target.value); setTouched(true); }}
              className="flex-1 bg-transparent num text-[22px] font-800 text-[#0F172A] outline-none placeholder:text-[#C9D4DF]"
            />
          </div>
          {touched && (isNaN(amount) || amount <= 0) && (
            <p className="text-[12px] font-600 text-[#DC2626] mt-1">Enter a valid amount.</p>
          )}
          {touched && !isNaN(amount) && amount > 0 && amount === settlement.amount && (
            <p className="text-[12px] font-500 text-[#94A3B8] mt-1">Amount is unchanged.</p>
          )}
        </div>

        <p className="text-[12px] font-500 text-[#94A3B8] mb-4">
          The other participant will need to approve this change.
        </p>

        {error && (
          <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-[12px] px-4 py-3 mb-4">
            <p className="text-[13px] font-600 text-[#DC2626]">{error}</p>
          </div>
        )}

        <button
          onClick={() => { setTouched(true); if (canSubmit) handleSubmit(); }}
          disabled={!canSubmit}
          className={`pressable w-full h-[48px] rounded-[13px] font-700 text-[15px] flex items-center justify-center transition-all ${
            canSubmit ? "bg-[#0A86A0] text-white shadow-[0_4px_16px_rgba(10,134,160,0.20)]" : "bg-[#F1F5F9] text-[#C9D4DF]"
          }`}
        >
          {loading ? "Requesting\u2026" : "Request change"}
        </button>
      </div>
    </Sheet>
  );
}
