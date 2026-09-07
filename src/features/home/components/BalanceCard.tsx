import type { Expense, Member } from "../../../domain/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { MapIcon, Add01Icon, AiSwapIcon } from "@hugeicons/core-free-icons";
import { fmt } from "../../../lib/format";
import { TOUR } from "../../../lib/tour";
import { BUDGET } from "../homeConstants";
import { computeTotalSpent, computeBudgetStats, toMajorUnits } from "../../../domain/finance";

export default function BalanceCard({
  expenses,
  members,
  empty = false,
  onAddExpense,
  onSettle,
}: {
  expenses: Expense[];
  members: Member[];
  empty?: boolean;
  onAddExpense?: () => void;
  onSettle?: () => void;
}) {
  const totalMinor = computeTotalSpent(expenses);
  const total = toMajorUnits(totalMinor);
  const me = members.find((m) => m.isMe);
  const myBalance = me?.balance ?? 0;
  const hasBudget = BUDGET != null && BUDGET > 0;
  const budgetStats = computeBudgetStats(totalMinor, BUDGET);
  const remaining = budgetStats ? toMajorUnits(budgetStats.remainingMinor) : BUDGET - total;
  const progress = budgetStats ? budgetStats.spentPercentage / 100 : Math.min(total / BUDGET, 1);

  const balanceZero = myBalance === 0;
  const balancePositive = myBalance > 0;

  return (
    <section className="px-4 pt-3 pb-1">
      <div className="bg-white rounded-[20px] border border-[#E1E7EF] overflow-hidden">
        {/* Trip context */}
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[12px] bg-[#EFF9FB] flex items-center justify-center text-[#0A86A0] shrink-0">
              <HugeiconsIcon icon={MapIcon} size={20} color="currentColor" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-700 text-[#0F172A] truncate leading-snug">{TOUR.name}</p>
              <p className="text-[12px] text-[#94A3B8] font-500 mt-0.5">
                {TOUR.dates} · {members.length} travelers
              </p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-600 bg-[#EFF9FB] text-[#0A86A0] border border-[#A3DFE9] shrink-0">
              Active
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="px-5 border-b border-[#F1F5F9]" />

        {/* Balance */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1.5">
            Your balance
          </p>
          <div className="flex items-baseline justify-between">
            <span
              className={`num text-[32px] font-800 leading-none ${
                balanceZero
                  ? "text-[#94A3B8]"
                  : balancePositive
                    ? "text-[#15803D]"
                    : "text-[#0F172A]"
              }`}
            >
              {balanceZero ? "৳0" : balancePositive ? `+${fmt(myBalance)}` : fmt(myBalance)}
            </span>
            <span
              className={`text-[13px] font-600 ${
                balanceZero
                  ? "text-[#94A3B8]"
                  : balancePositive
                    ? "text-[#15803D]"
                    : "text-[#DC2626]"
              }`}
            >
              {balanceZero
                ? "You're settled up"
                : balancePositive
                  ? "You are owed"
                  : "You owe"}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="px-5 border-b border-[#F1F5F9]" />

        {/* Trip spending */}
        <div className="px-5 py-3.5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide">
              Trip spent
            </p>
            <span className="num text-[12px] font-600 text-[#475569]">
              {hasBudget ? `${fmt(total)} of ${fmt(BUDGET)}` : fmt(total)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-4 pt-1 grid grid-cols-2 gap-2.5">
          <button
            onClick={onAddExpense}
            className="pressable flex items-center justify-center gap-1.5 h-11 rounded-[12px] bg-[#0A86A0] text-white font-700 text-[14px] shadow-[0_2px_8px_rgba(10,134,160,0.18)] active:scale-[0.97] transition-all"
          >
            <HugeiconsIcon icon={Add01Icon} size={16} color="currentColor" strokeWidth={2} />
            Add Expense
          </button>
          <button
            onClick={onSettle}
            className="pressable flex items-center justify-center gap-1.5 h-11 rounded-[12px] bg-[#EFF9FB] text-[#0A86A0] font-700 text-[14px] border border-[#A3DFE9] active:scale-[0.97] transition-all"
          >
            <HugeiconsIcon icon={AiSwapIcon} size={16} color="currentColor" strokeWidth={2} />
            Settle Up
          </button>
        </div>
      </div>
    </section>
  );
}
