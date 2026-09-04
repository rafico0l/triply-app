import { useState } from "react";
import { Avatar } from "../../../components/shared/Avatar";
import { IconChevronLeft, IconChevronRight, IconArrowRight, IconCheck } from "../../../components/shared/icons";
import type { Member } from "../../../domain/types";

export default function RecordPaymentSheet({
  fromId, toId, suggestedAmount, isManual, members, me, onRecord, onClose,
}: {
  fromId?: string; toId?: string; suggestedAmount?: number; isManual?: boolean;
  members: Member[]; me: Member | undefined;
  onRecord: (from: string, to: string, amount: number) => void;
  onClose: () => void;
}) {
  const [selectedFrom, setSelectedFrom] = useState(fromId ?? me?.id ?? "");
  const [selectedTo,   setSelectedTo]   = useState(toId ?? "");
  const [amountStr,    setAmountStr]    = useState(suggestedAmount ? String(suggestedAmount) : "");
  const [page,         setPage]         = useState<"form" | "select-from" | "select-to">("form");
  const [touched,      setTouched]      = useState(false);

  const from   = members.find((m) => m.id === selectedFrom);
  const to     = members.find((m) => m.id === selectedTo);
  const amount = parseFloat(amountStr);
  const canSubmit = !!(selectedFrom && selectedTo && selectedFrom !== selectedTo && !isNaN(amount) && amount > 0);

  const handleBackdrop = () => { if (page !== "form") setPage("form"); else onClose(); };

  if (page === "select-from" || page === "select-to") {
    const isFrom  = page === "select-from";
    const exclude = isFrom ? selectedTo : selectedFrom;
    const current = isFrom ? selectedFrom : selectedTo;
    return (
      <>
        <div className="fixed inset-0 bg-black/30 z-40" onClick={handleBackdrop} />
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-[24px] z-50 safe-bottom" style={{ animation: "sheetUp 240ms cubic-bezier(0.32,0.72,0,1)" }}>
          <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-[#E1E7EF] rounded-full" /></div>
          <div className="px-5 pt-2 pb-3 flex items-center border-b border-[#F4F6F9]">
            <button onClick={() => setPage("form")} className="pressable flex items-center gap-0.5 text-[#0A86A0] font-600 text-[14px] mr-3">
              <IconChevronLeft size={18} /><span>Back</span>
            </button>
            <h3 className="flex-1 text-center text-[15px] font-700 text-[#0F172A]">{isFrom ? "Who paid?" : "Who received?"}</h3>
            <div className="w-16" />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "55dvh" }}>
            <div className="px-3 py-2 space-y-0.5 pb-6">
              {members.filter((m) => m.id !== exclude).map((m) => {
                const sel = m.id === current;
                return (
                  <button key={m.id} onClick={() => { if (isFrom) setSelectedFrom(m.id); else setSelectedTo(m.id); setPage("form"); }}
                    className={`pressable w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-left transition-colors ${sel ? "bg-[#EFF9FB]" : "hover:bg-[#F4F6F9]"}`}
                  >
                    <Avatar member={m} size="sm" />
                    <span className={`flex-1 text-[15px] font-600 ${sel ? "text-[#0A86A0]" : "text-[#0F172A]"}`}>
                      {m.isMe ? "Rafi (You)" : m.name}
                    </span>
                    {sel && <span className="text-[#0A86A0]"><IconCheck size={16} /></span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={handleBackdrop} style={{ animation: "fadeIn 150ms ease" }} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-[24px] z-50 safe-bottom" style={{ animation: "sheetUp 240ms cubic-bezier(0.32,0.72,0,1)" }}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-[#E1E7EF] rounded-full" /></div>
        <div className="px-5 pt-2 pb-2 flex items-center justify-between">
          <h2 className="text-[17px] font-700 text-[#0F172A]">{isManual ? "Record settlement" : "Record payment"}</h2>
          <button onClick={onClose} className="pressable text-[14px] font-600 text-[#94A3B8]">Cancel</button>
        </div>
        <div className="px-5 pb-6 space-y-4">
          {/* From / To block */}
          <div className="bg-[#F8FAFC] rounded-[14px] border border-[#E1E7EF] overflow-hidden">
            <button onClick={isManual ? () => setPage("select-from") : undefined} disabled={!isManual}
              className={`w-full flex items-center gap-3 px-4 py-3.5 border-b border-[#E1E7EF] ${isManual ? "pressable" : ""}`}
            >
              <span className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wide w-10 shrink-0">From</span>
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {from ? (
                  <><Avatar member={from} size="sm" /><span className="text-[15px] font-600 text-[#0F172A] truncate">{from.isMe ? "Rafi (You)" : from.name}</span></>
                ) : (
                  <span className="text-[15px] font-500 text-[#C9D4DF]">Select member…</span>
                )}
              </div>
              {isManual && <span className="text-[#94A3B8] shrink-0"><IconChevronRight /></span>}
            </button>
            <div className="flex items-center gap-3 px-4 py-1.5 border-b border-[#E1E7EF]">
              <div className="w-10 shrink-0" />
              <span className="text-[#C9D4DF]"><IconArrowRight size={14} /></span>
            </div>
            <button onClick={isManual ? () => setPage("select-to") : undefined} disabled={!isManual}
              className={`w-full flex items-center gap-3 px-4 py-3.5 ${isManual ? "pressable" : ""}`}
            >
              <span className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wide w-10 shrink-0">To</span>
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {to ? (
                  <><Avatar member={to} size="sm" /><span className="text-[15px] font-600 text-[#0F172A] truncate">{to.isMe ? "Rafi (You)" : to.name}</span></>
                ) : (
                  <span className="text-[15px] font-500 text-[#C9D4DF]">Select member…</span>
                )}
              </div>
              {isManual && <span className="text-[#94A3B8] shrink-0"><IconChevronRight /></span>}
            </button>
          </div>

          {touched && selectedFrom && selectedTo && selectedFrom === selectedTo && (
            <p className="text-[12px] font-600 text-[#DC2626] -mt-1">From and To must be different members.</p>
          )}

          {/* Amount */}
          <div>
            <label className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wide block mb-2">Amount</label>
            <div className={`flex items-center gap-2 rounded-[13px] border h-[54px] px-4 transition-colors ${
              touched && (isNaN(amount) || amount <= 0) ? "border-[#FECACA] bg-[#FFF5F5]" : "bg-[#F8FAFC] border-[#E1E7EF] focus-within:border-[#0A86A0] focus-within:bg-white"
            }`}>
              <span className="text-[20px] font-700 text-[#94A3B8]">৳</span>
              <input
                type="number" inputMode="decimal" placeholder="0" value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="flex-1 bg-transparent num text-[24px] font-800 text-[#0F172A] outline-none placeholder:text-[#C9D4DF]"
              />
            </div>
            {touched && (isNaN(amount) || amount <= 0) && (
              <p className="text-[12px] font-600 text-[#DC2626] mt-1">Enter a valid amount.</p>
            )}
          </div>

          <p className="text-[12px] font-500 text-[#94A3B8] leading-relaxed text-center">
            Triply records that this payment happened outside the app. No money is moved.
          </p>

          <button
            onClick={() => { setTouched(true); if (canSubmit) onRecord(selectedFrom, selectedTo, amount); }}
            className={`pressable w-full h-[52px] rounded-[14px] font-700 text-[15px] flex items-center justify-center transition-all ${
              canSubmit ? "bg-[#0A86A0] text-white shadow-[0_4px_16px_rgba(10,134,160,0.20)]" : "bg-[#F1F5F9] text-[#C9D4DF]"
            }`}
          >
            {isManual ? "Record settlement" : "Record payment"}
          </button>
        </div>
      </div>
    </>
  );
}
