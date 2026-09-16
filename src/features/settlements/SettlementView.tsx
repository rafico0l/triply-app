import { useState, useEffect } from "react";
import type { Member, Expense, RecordedSettlement } from "../../domain/types";
import { fmt } from "../../lib/format";
import { Avatar } from "../../components/shared/Avatar";
import { IconArrowRight, IconChevronRight, IconCheckCircle2, IconHistory } from "../../components/shared/icons";
import { computeSuggestedPayments } from "./settlementUtils";
import SettlementToast from "./components/SettlementToast";
import RecordPaymentSheet from "./components/RecordPaymentSheet";

export default function SettlementView({
  members, expenses, recordedSettlements, me, isCurrentUserOwner,
  onRecordSettlement, onOpenHistory, error, onClearError, onAddExpense,
}: {
  members: Member[];
  expenses: Expense[];
  recordedSettlements: RecordedSettlement[];
  me: Member | undefined;
  isCurrentUserOwner: boolean;
  onRecordSettlement: (from: string, to: string, amount: number) => void;
  onOpenHistory: () => void;
  error?: string | null;
  onClearError?: () => void;
  onAddExpense?: () => void;
}) {
  const [recordPayment, setRecordPayment] = useState<{ fromId: string; toId: string; amount: number } | null>(null);
  const [showManual,    setShowManual]    = useState(false);
  const [toast,         setToast]         = useState<{ from: string; to: string; amount: number } | null>(null);

  useEffect(() => {
    if (!recordPayment && !showManual && onClearError) {
      onClearError();
    }
  }, [recordPayment, showManual, onClearError]);

  const suggestedPayments = computeSuggestedPayments(members, expenses, recordedSettlements);
  const isFullySettled    = suggestedPayments.length === 0;
  const nothingToSettle   = expenses.length === 0 && recordedSettlements.length === 0;

  function handleRecord(from: string, to: string, amount: number) {
    onRecordSettlement(from, to, amount);
    const f = members.find((m) => m.id === from);
    const t = members.find((m) => m.id === to);
    setToast({ from: f?.isMe ? "You" : (f?.name.split(" ")[0] ?? from), to: t?.isMe ? "you" : (t?.name.split(" ")[0] ?? to), amount });
    setRecordPayment(null);
    setShowManual(false);
  }

  const sorted = [...members].sort((a, b) => b.balance - a.balance);

  // ── Nothing to settle yet ─────────────────────────────────────────────────────
  if (nothingToSettle) {
    return (
      <div>
        {error && (
          <div className="px-4 pt-4 pb-1">
            <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-[12px] px-4 py-3 flex items-center justify-between">
              <p className="text-[13px] font-600 text-[#DC2626]">{error}</p>
              {onClearError && <button onClick={onClearError} className="text-[#DC2626] font-700 text-[13px]">Dismiss</button>}
            </div>
          </div>
        )}
        <div className="flex flex-col items-center justify-center px-8 pt-12 pb-6 text-center">
          <div className="w-16 h-16 rounded-full bg-[#F1F5F9] border-2 border-[#E1E7EF] flex items-center justify-center text-[#94A3B8] mb-5">
            <IconCheckCircle2 size={30} />
          </div>
          <p className="text-[22px] font-800 text-[#0F172A] mb-2">Nothing to settle yet</p>
          <p className="text-[15px] font-500 text-[#94A3B8] leading-relaxed max-w-[260px]">Balances will appear once you add shared expenses.</p>
          {onAddExpense && (
            <button
              onClick={onAddExpense}
              className="pressable mt-4 flex items-center gap-1.5 px-5 h-11 rounded-[12px] bg-[#0A86A0] text-white font-700 text-[14px] shadow-[0_2px_8px_rgba(10,134,160,0.18)]"
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Add expense
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Fully settled state ──────────────────────────────────────────────────────
  if (isFullySettled) {
    return (
      <div>
        {error && (
          <div className="px-4 pt-4 pb-1">
            <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-[12px] px-4 py-3 flex items-center justify-between">
              <p className="text-[13px] font-600 text-[#DC2626]">{error}</p>
              {onClearError && <button onClick={onClearError} className="text-[#DC2626] font-700 text-[13px]">Dismiss</button>}
            </div>
          </div>
        )}
        <div className="px-4 pt-3 pb-1">
          <div className="flex items-center gap-3 bg-[#F0FDF4] border border-[#BBF7D0] rounded-[14px] px-4 py-3">
            <div className="w-9 h-9 rounded-full bg-[#DCFCE7] flex items-center justify-center text-[#15803D] shrink-0">
              <IconCheckCircle2 size={18} />
            </div>
            <div>
              <p className="text-[14px] font-700 text-[#15803D]">All settled up</p>
              <p className="text-[13px] font-500 text-[#16A34A]">Everyone's balance is settled.</p>
            </div>
          </div>
        </div>

        {/* Member balances */}
        <div className="px-4 pt-3 pb-2">
          <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-1 mb-2">Member balances</p>
          <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
            {sorted.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar member={m} size="sm" />
                <p className="text-[14px] font-600 text-[#0F172A] flex-1 truncate">{m.name}</p>
                <span className="text-[13px] font-600 text-[#94A3B8]">Settled</span>
              </div>
            ))}
          </div>
        </div>

        {/* Secondary actions */}
        <div className="px-4 pt-2 pb-2 space-y-2">
          <button
            onClick={() => setShowManual(true)}
            className="pressable w-full flex items-center justify-between px-4 h-11 rounded-[13px] bg-white border border-[#E1E7EF] text-[#0F172A] font-600 text-[14px]"
          >
            <span>Record payment manually</span>
            <span className="text-[#94A3B8]"><IconChevronRight size={15} /></span>
          </button>
          {recordedSettlements.length > 0 && (
            <button
              onClick={onOpenHistory}
              className="pressable w-full flex items-center justify-between px-4 h-11 rounded-[13px] bg-white border border-[#E1E7EF] text-[#475569] font-500 text-[14px]"
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

  // ── Normal state (payments remaining) ────────────────────────────────────────
  return (
    <div>
      {error && (
        <div className="px-4 pt-4 pb-1">
          <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-[12px] px-4 py-3 flex items-center justify-between">
            <p className="text-[13px] font-600 text-[#DC2626]">{error}</p>
            {onClearError && <button onClick={onClearError} className="text-[#DC2626] font-700 text-[13px]">Dismiss</button>}
          </div>
        </div>
      )}

      {/* Suggested payments */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-1 mb-2">
          {suggestedPayments.length === 1 ? "Suggested payment" : "Suggested payments"}
        </p>

        {suggestedPayments.length === 1 ? (
          /* ── Single payment: rich card ──────────────────────────────── */
          (() => {
            const p   = suggestedPayments[0];
            const from = members.find((m) => m.id === p.from);
            const to   = members.find((m) => m.id === p.to);
            if (!from || !to) return null;
            return (
              <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden">
                <div className="flex items-center gap-3 px-4 pt-3.5 pb-2.5">
                  <div className="flex items-center shrink-0">
                    <Avatar member={from} size="sm" />
                    <span className="mx-2 text-[#C9D4DF]"><IconArrowRight size={13} /></span>
                    <Avatar member={to} size="sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-500 text-[#64748B]">
                      {from.isMe ? "You" : from.name.split(" ")[0]} → {to.isMe ? "you" : to.name.split(" ")[0]}
                    </p>
                    <p className="num text-[20px] font-800 text-[#0A86A0] leading-tight">{fmt(p.amount)}</p>
                  </div>
                </div>
                <div className="px-4 pb-3">
                  <button
                    onClick={() => setRecordPayment({ fromId: p.from, toId: p.to, amount: p.amount })}
                    className="pressable w-full h-10 rounded-[11px] bg-[#0A86A0] text-white font-700 text-[14px] shadow-[0_2px_8px_rgba(10,134,160,0.18)] transition-colors hover:bg-[#097490]"
                  >
                    Record payment
                  </button>
                </div>
              </div>
            );
          })()
        ) : (
          /* ── Multiple payments: compact list ────────────────────────── */
          <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden">
            {suggestedPayments.map((p, i) => {
              const from = members.find((m) => m.id === p.from);
              const to   = members.find((m) => m.id === p.to);
              if (!from || !to) return null;
              return (
                <button
                  key={i}
                  onClick={() => setRecordPayment({ fromId: p.from, toId: p.to, amount: p.amount })}
                  className={`pressable w-full flex items-center gap-3 px-4 py-3.5 text-left ${i > 0 ? "border-t border-[#F4F6F9]" : ""}`}
                >
                  <div className="flex items-center shrink-0">
                    <Avatar member={from} size={26} />
                    <span className="mx-1.5 text-[#C9D4DF]"><IconArrowRight size={11} /></span>
                    <Avatar member={to} size={26} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] truncate ${from.isMe || to.isMe ? "font-600 text-[#0F172A]" : "font-500 text-[#475569]"}`}>
                      {from.isMe ? "You" : from.name.split(" ")[0]} → {to.isMe ? "you" : to.name.split(" ")[0]}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="num text-[14px] font-700 text-[#0A86A0]">{fmt(p.amount)}</span>
                    <span className="text-[#C9D4DF]"><IconChevronRight size={14} /></span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
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
                <p className="text-[14px] font-600 text-[#0F172A] flex-1 truncate">{m.name}</p>
                <div className="text-right shrink-0">
                  {isEven ? (
                    <p className="text-[14px] font-700 text-[#94A3B8]">৳0</p>
                  ) : (
                    <>
                      <p className={`num text-[14px] font-800 ${isOwed ? "text-[#15803D]" : "text-[#DC2626]"}`}>
                        {isOwed ? `+${fmt(m.balance)}` : fmt(m.balance)}
                      </p>
                      <p className={`text-[11px] font-600 ${isOwed ? "text-[#15803D]" : "text-[#DC2626]"}`}>
                        {isOwed ? "Receive" : "Owes"}
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
      <div className="px-4 pt-2 pb-2 space-y-2">
        <button
          onClick={() => setShowManual(true)}
          className="pressable w-full flex items-center justify-between px-4 h-11 rounded-[13px] bg-white border border-[#E1E7EF] text-[#0F172A] font-600 text-[14px]"
        >
          <span>Record payment manually</span>
          <span className="text-[#94A3B8]"><IconChevronRight size={15} /></span>
        </button>
        {recordedSettlements.length > 0 && (
          <button
            onClick={onOpenHistory}
            className="pressable w-full flex items-center justify-between px-4 h-11 rounded-[13px] bg-white border border-[#E1E7EF] text-[#475569] font-500 text-[14px]"
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
