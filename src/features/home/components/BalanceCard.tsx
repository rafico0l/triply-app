import type { Expense, Member } from "../../../domain/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { MapIcon, Add01Icon, AiSwapIcon, PlusIcon } from "@hugeicons/core-free-icons";
import { fmt } from "../../../lib/format";
import { computeTotalSpent, computeBudgetStats, computeMemberShare, toMajorUnits, toMinorUnits } from "../../../domain/finance";
import EmptyState from "../../../components/shared/EmptyState";

function tripsHaveNoData(expenses: Expense[], members: Member[]): boolean {
  return expenses.length === 0 && members.length === 0;
}

export default function BalanceCard({
  expenses,
  members,
  empty = false,
  onAddExpense,
  onSettle,
  onNewTour,
  onJoinTrip,
  budget,
  tripName,
  tripDates,
}: {
  expenses: Expense[];
  members: Member[];
  empty?: boolean;
  onAddExpense?: () => void;
  onSettle?: () => void;
  onNewTour?: () => void;
  onJoinTrip?: () => void;
  budget?: number;
  tripName?: string;
  tripDates?: string;
}) {
  const totalMinor = computeTotalSpent(expenses);
  const total = toMajorUnits(totalMinor);
  const me = members.find((m) => m.isMe);
  const myBalance = me?.balance ?? 0;
  const hasBudget = budget != null && budget > 0;
  const budgetStats = computeBudgetStats(totalMinor, budget != null ? toMinorUnits(budget) : undefined);
  const remaining = budgetStats ? toMajorUnits(budgetStats.remainingMinor) : (budget ?? 0) - total;
  const progress = budgetStats ? budgetStats.spentPercentage / 100 : Math.min(total / (budget ?? 1), 1);

  const balanceZero = myBalance === 0;
  const balancePositive = myBalance > 0;

  const noTrip = empty && tripsHaveNoData(expenses, members);
  const tripNoExpenses = !noTrip && expenses.length === 0;

  if (noTrip) {
    return (
      <section className="px-4 pt-3 pb-1">
        <div className="bg-white rounded-[20px] border border-[#E1E7EF] overflow-hidden">
          <EmptyState
            icon={<HugeiconsIcon icon={MapIcon} size={28} color="currentColor" strokeWidth={1.5} />}
            title="Your next adventure starts here"
            body="Create a trip, invite your friends, and keep everyone's expenses in one place."
            action={
              <div className="flex flex-col gap-2">
                <button
                  onClick={onNewTour}
                  className="pressable flex items-center justify-center gap-1.5 px-5 h-11 rounded-[12px] bg-[#0A86A0] text-white font-700 text-[14px] shadow-[0 2px_8px_rgba(10,134,160,0.18)]"
                >
                  <HugeiconsIcon icon={PlusIcon} size={16} color="currentColor" strokeWidth={2.5} />
                  Create your first trip
                </button>
                {onJoinTrip && (
                  <button
                    onClick={onJoinTrip}
                    className="pressable flex items-center justify-center gap-1.5 px-5 h-11 rounded-[12px] bg-white text-[#0A86A0] font-700 text-[14px] border border-[#A3DFE9]"
                  >
                    Have an invite? Join a trip
                  </button>
                )}
              </div>
            }
          />
        </div>
      </section>
    );
  }

  if (tripNoExpenses) {
    const myShare = me ? toMajorUnits(computeMemberShare(me.id, expenses)) : 0;
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
                <p className="text-[15px] font-700 text-[#0F172A] truncate leading-snug">{tripName ?? "Trip"}</p>
                <p className="text-[12px] text-[#94A3B8] font-500 mt-0.5">
                  {tripDates ?? ""} · {members.length} {members.length === 1 ? "traveler" : "travelers"}
                </p>
              </div>
            </div>
          </div>

          {/* Financial overview */}
          <div className="px-5 pt-3 pb-4">
            <p className="text-[12px] font-600 text-[#94A3B8] mb-1">Total spent</p>
            <p className="num text-[30px] font-800 text-[#0F172A] leading-tight">৳0</p>
            <div className="flex items-center gap-5 mt-3">
              <div>
                <p className="text-[11px] font-600 text-[#94A3B8] mb-0.5">Your share</p>
                <p className="num text-[15px] font-700 text-[#0F172A]">৳0</p>
              </div>
              <div className="h-[24px] w-px bg-[#E1E7EF]" />
              <div>
                <p className="text-[11px] font-600 text-[#94A3B8] mb-0.5">Your balance</p>
                <p className={`num text-[15px] font-700 ${balanceZero ? "text-[#94A3B8]" : balancePositive ? "text-[#15803D]" : "text-[#DC2626]"}`}>
                  {balanceZero ? "৳0" : balancePositive ? `+${fmt(myBalance)}` : `-${fmt(myBalance)}`}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-4">
            <button
              onClick={onAddExpense}
              className="pressable inline-flex items-center gap-1.5 px-4 h-9 rounded-[10px] bg-[#0A86A0] text-white font-700 text-[13px] shadow-[0_2px_8px_rgba(10,134,160,0.18)] active:scale-[0.97] transition-all"
            >
              <HugeiconsIcon icon={PlusIcon} size={14} color="currentColor" strokeWidth={2.5} />
              Add expense
            </button>
          </div>
        </div>
      </section>
    );
  }

  const displayName = tripName ?? "Trip";
  const displayDates = tripDates ?? "";

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
              <p className="text-[15px] font-700 text-[#0F172A] truncate leading-snug">{displayName}</p>
              <p className="text-[12px] text-[#94A3B8] font-500 mt-0.5">
                {displayDates} · {members.length} travelers
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
          <p className="text-[12px] font-600 text-[#94A3B8] mb-1.5">Your balance</p>
          <div className="flex items-baseline justify-between">
            <span
              className={`num text-[30px] font-800 leading-tight ${
                balanceZero
                  ? "text-[#94A3B8]"
                  : balancePositive
                    ? "text-[#15803D]"
                    : "text-[#0F172A]"
              }`}
            >
              {balanceZero ? "৳0" : balancePositive ? `+${fmt(myBalance)}` : `-${fmt(myBalance)}`}
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

        {/* Trip spending */}
        <div className="px-5 py-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] font-600 text-[#94A3B8]">Total spent</p>
            <span className="num text-[13px] font-700 text-[#0F172A]">
              {hasBudget ? `${fmt(total)} of ${fmt(budget ?? 0)}` : fmt(total)}
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
