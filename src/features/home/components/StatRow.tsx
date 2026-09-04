import type { Expense, Member } from "../../../domain/types";
import { fmt } from "../../../lib/format";
import { BUDGET } from "../homeConstants";

export default function StatRow({ expenses, members, empty = false }: { expenses: Expense[]; members: Member[]; empty?: boolean }) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const me = members.find((m) => m.isMe);
  const myShare = me ? expenses.filter((e) => e.splitIds.includes(me.id)).reduce((s, e) => s + e.amount / e.splitIds.length, 0) : 0;
  const myShareRounded = Math.round(myShare);
  const myBalance = me?.balance ?? 0;
  const remaining = BUDGET - total;
  const progress = Math.min(total / BUDGET, 1);

  if (empty || !me) {
    return (
      <div className="px-4 pt-4 pb-3">
        <div className="bg-white rounded-[16px] border border-[#E1E7EF] overflow-hidden">
          <div className="px-5 pt-3 pb-2">
            <p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">Total spent</p>
            <span className="num text-[32px] font-800 text-[#0F172A] leading-none">{fmt(0)}</span>
          </div>
          <div className="px-5 pb-3 border-b border-[#F1F5F9]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="num text-[12px] font-500 text-[#94A3B8]">{fmt(0)} of {fmt(BUDGET)}</span>
              <span className="num text-[12px] font-600 text-[#475569]">{fmt(BUDGET)} remaining</span>
            </div>
            <div className="h-[3px] bg-[#F1F5F9] rounded-full overflow-hidden"><div className="h-full bg-[#0A86A0] rounded-full" style={{ width: "0%" }} /></div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[#F1F5F9]">
            <div className="px-5 py-3"><p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">Your share</p><p className="num text-[18px] font-700 text-[#0F172A] leading-snug">{fmt(0)}</p></div>
            <div className="px-5 py-3"><p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">Your balance</p><p className="num text-[18px] font-700 leading-snug text-[#94A3B8]">Settled</p></div>
          </div>
        </div>
      </div>
    );
  }

  const balanceZero = myBalance === 0;
  const balancePositive = myBalance > 0;
  const balanceColor = balanceZero ? "#94A3B8" : balancePositive ? "#15803D" : "#DC2626";
  const balanceLabel = balanceZero ? "Settled" : balancePositive ? `Receive ${fmt(myBalance)}` : `Owe ${fmt(myBalance)}`;

  return (
    <div className="px-4 pt-4 pb-3">
      <div className="bg-white rounded-[16px] border border-[#E1E7EF] overflow-hidden">
        <div className="px-5 pt-3 pb-2">
          <p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">Total spent</p>
          <span className="num text-[32px] font-800 text-[#0F172A] leading-none">{fmt(total)}</span>
        </div>
        <div className="px-5 pb-3 border-b border-[#F1F5F9]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="num text-[12px] font-500 text-[#94A3B8]">{fmt(total)} of {fmt(BUDGET)}</span>
            <span className="num text-[12px] font-600 text-[#475569]">{fmt(remaining)} remaining</span>
          </div>
          <div className="h-[3px] bg-[#F1F5F9] rounded-full overflow-hidden">
            <div className="h-full bg-[#0A86A0] rounded-full transition-all" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-[#F1F5F9]">
          <div className="px-5 py-3">
            <p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">Your share</p>
            <p className="num text-[18px] font-700 text-[#0F172A] leading-snug">{fmt(myShareRounded)}</p>
            <p className="num text-[11px] text-[#94A3B8] font-500 mt-0.5">Paid {fmt(me.paid)}</p>
          </div>
          <div className="px-5 py-3">
            <p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">Your balance</p>
            <p className="num text-[18px] font-700 leading-snug" style={{ color: balanceColor }}>{balanceLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}