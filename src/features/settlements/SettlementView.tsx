import { useState } from "react";
import type { Member, RecordedSettlement } from "../../domain/types";
import { fmt } from "../../lib/format";
import { Avatar } from "../../components/shared/Avatar";
import { IconArrowRight, IconChevronRight, IconCheckCircle2, IconHistory } from "../../components/shared/icons";
import { computeSuggestedPayments } from "./settlementUtils";
import SettlementToast from "./components/SettlementToast";
import RecordPaymentSheet from "./components/RecordPaymentSheet";

export default function SettlementView({
  members, recordedSettlements, me, isCurrentUserOwner,
  onRecordSettlement, onOpenHistory,
}: {
  members: Member[];
  recordedSettlements: RecordedSettlement[];
  me: Member | undefined;
  isCurrentUserOwner: boolean;
  onRecordSettlement: (from: string, to: string, amount: number) => void;
  onOpenHistory: () => void;
}) {
  const [recordPayment, setRecordPayment] = useState<{ fromId: string; toId: string; amount: number } | null>(null);
  const [showManual,    setShowManual]    = useState(false);
  const [toast,         setToast]         = useState<{ from: string; to: string; amount: number } | null>(null);

  const suggestedPayments = computeSuggestedPayments(members);
  const totalToSettle     = suggestedPayments.reduce((s, p) => s + p.amount, 0);
  const isFullySettled    = members.every((m) => Math.abs(m.balance) <= 2);

  function handleRecord(from: string, to: string, amount: number) {
    onRecordSettlement(from, to, amount);
    const f = members.find((m) => m.id === from);
    const t = members.find((m) => m.id === to);
    setToast({ from: f?.isMe ? "You" : (f?.name.split(" ")[0] ?? from), to: t?.isMe ? "you" : (t?.name.split(" ")[0] ?? to), amount });
    setRecordPayment(null);
    setShowManual(false);
  }

  const sorted = [...members].sort((a, b) => b.balance - a.balance);

  // ── Fully settled state ──────────────────────────────────────────────────────
  if (isFullySettled) {
    return (
      <div>
        <div className="flex flex-col items-center justify-center px-8 pt-12 pb-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#F0FDF4] border-2 border-[#BBF7D0] flex items-center justify-center text-[#15803D] mb-5">
            <IconCheckCircle2 size={30} />
          </div>
          <p className="text-[22px] font-800 text-[#0F172A] mb-2">{"You're all settled up"}</p>
          <p className="text-[15px] font-500 text-[#94A3B8] leading-relaxed max-w-[240px]">{"Everyone's balance is clear."}</p>
        </div>

        <div className="px-4 pb-3">
          <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-1 mb-2">Members</p>
          <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
            {sorted.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar member={m} size="sm" />
                <p className="text-[14px] font-600 text-[#0F172A] flex-1 truncate">{m.isMe ? "Rafi" : m.name}</p>
                <span className="text-[13px] font-600 text-[#94A3B8]">Settled</span>
              </div>
            ))}
          </div>
        </div>

        {recordedSettlements.length > 0 && (
          <div className="px-4 pb-6">
            <button onClick={onOpenHistory} className="pressable w-full flex items-center justify-between px-4 py-3.5 bg-white rounded-[14px] border border-[#E1E7EF]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[9px] bg-[#F4F6F9] flex items-center justify-center text-[#475569]">
                  <IconHistory size={15} />
                </div>
                <span className="text-[15px] font-600 text-[#0F172A]">Settlement history</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#94A3B8]">
                <span className="num text-[13px] font-500">{recordedSettlements.length}</span>
                <IconChevronRight size={14} />
              </div>
            </button>
          </div>
        )}

        {toast && <SettlementToast fromName={toast.from} toName={toast.to} amount={toast.amount} onHide={() => setToast(null)} />}
      </div>
    );
  }

  // ── Normal state (payments remaining) ────────────────────────────────────────
  return (
    <div>
      {/* Summary banner */}
      <div className="px-4 pt-4 pb-1">
        <div className="bg-[#EFF9FB] border border-[#A3DFE9] rounded-[14px] px-4 py-3.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-700 text-[#0A7490]">
              {suggestedPayments.length} {suggestedPayments.length === 1 ? "payment" : "payments"} remaining
            </p>
            <p className="num text-[13px] font-500 text-[#0A86A0] mt-0.5">{fmt(totalToSettle)} to settle</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/60 border border-[#A3DFE9] flex items-center justify-center text-[#0A86A0] shrink-0">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 16l-4-4 4-4M17 8l4 4-4 4M3 12h18" />
            </svg>
          </div>
        </div>
      </div>

      {/* Suggested payments */}
      <div className="px-4 pt-4 pb-2">
        <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-1 mb-2">Suggested payments</p>
        <div className="space-y-2">
          {suggestedPayments.map((p, i) => {
            const from = members.find((m) => m.id === p.from);
            const to   = members.find((m) => m.id === p.to);
            if (!from || !to) return null;
            return (
              <div key={i} className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden">
                <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                  <div className="flex items-center shrink-0">
                    <Avatar member={from} size="sm" />
                    <span className="mx-2 text-[#C9D4DF]"><IconArrowRight size={13} /></span>
                    <Avatar member={to} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-600 text-[#475569]">
                      {from.isMe ? "You" : from.name.split(" ")[0]} → {to.isMe ? "you" : to.name.split(" ")[0]}
                    </p>
                    <p className="num text-[20px] font-800 text-[#0A86A0] leading-tight">{fmt(p.amount)}</p>
                  </div>
                </div>
                <div className="px-4 pb-3.5">
                  <button
                    onClick={() => setRecordPayment({ fromId: p.from, toId: p.to, amount: p.amount })}
                    className="pressable w-full h-9 rounded-[10px] bg-[#EFF9FB] text-[#0A86A0] font-700 text-[13px] border border-[#A3DFE9] transition-colors hover:bg-[#D1EFF5]"
                  >
                    Record payment
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Member balances */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-1 mb-2">Member balances</p>
        <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
          {sorted.map((m) => {
            const isOwed = m.balance > 2;
            const isEven = Math.abs(m.balance) <= 2;
            return (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar member={m} size="sm" />
                <p className="text-[14px] font-600 text-[#0F172A] flex-1 truncate">{m.isMe ? "Rafi" : m.name}</p>
                <div className="text-right shrink-0">
                  {isEven ? (
                    <span className="text-[13px] font-600 text-[#94A3B8]">Settled</span>
                  ) : (
                    <>
                      <p className={`num text-[12px] font-700 ${isOwed ? "text-[#15803D]" : "text-[#DC2626]"}`}>
                        {isOwed ? "Receive" : "Owes"}
                      </p>
                      <p className={`num text-[14px] font-800 ${isOwed ? "text-[#15803D]" : "text-[#DC2626]"}`}>
                        {fmt(m.balance)}
                      </p>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Secondary actions */}
      <div className="px-4 pt-3 pb-2 space-y-2">
        <button
          onClick={() => setShowManual(true)}
          className="pressable w-full flex items-center justify-between px-4 h-12 rounded-[13px] bg-white border border-[#E1E7EF] text-[#0F172A] font-600 text-[14px]"
        >
          <span>Record settlement</span>
          <span className="text-[#94A3B8]"><IconChevronRight size={15} /></span>
        </button>
        {recordedSettlements.length > 0 && (
          <button
            onClick={onOpenHistory}
            className="pressable w-full flex items-center justify-between px-4 h-12 rounded-[13px] bg-white border border-[#E1E7EF] text-[#475569] font-500 text-[14px]"
          >
            <div className="flex items-center gap-2.5">
              <IconHistory size={15} />
              <span>Settlement history</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#94A3B8]">
              <span className="num text-[13px]">{recordedSettlements.length}</span>
              <IconChevronRight size={13} />
            </div>
          </button>
        )}
      </div>

      <div className="h-4" />

      {/* Sheets */}
      {recordPayment && (
        <RecordPaymentSheet
          fromId={recordPayment.fromId}
          toId={recordPayment.toId}
          suggestedAmount={recordPayment.amount}
          members={members}
          me={me}
          onRecord={handleRecord}
          onClose={() => setRecordPayment(null)}
        />
      )}
      {showManual && (
        <RecordPaymentSheet
          isManual
          members={members}
          me={me}
          onRecord={handleRecord}
          onClose={() => setShowManual(false)}
        />
      )}
      {toast && <SettlementToast fromName={toast.from} toName={toast.to} amount={toast.amount} onHide={() => setToast(null)} />}
    </div>
  );
}