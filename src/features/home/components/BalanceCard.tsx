import { useState } from "react";
import type { Expense, Member } from "../../../domain/types";
import type { Trip } from "../../../domain/trip";
import { HugeiconsIcon } from "@hugeicons/react";
import { MapIcon, Add01Icon, AiSwapIcon, PlusIcon, ChevronDownIcon } from "@hugeicons/core-free-icons";
import { fmt } from "../../../lib/format";
import {
  computeTotalSpent,
  computeBudgetStats,
  computeMemberShare,
  toMajorUnits,
  toMinorUnits,
} from "../../../domain/finance";
import { computeTripStatus } from "../../../domain/trip";
import EmptyState from "../../../components/shared/EmptyState";
import TripSwitcherSheet from "./TripSwitcherSheet";

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
  startDate,
  endDate,
  trips,
  currentTripId,
  onSwitchTrip,
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
  startDate?: string;
  endDate?: string;
  trips?: Trip[];
  currentTripId?: string;
  onSwitchTrip?: (id: string) => void;
}) {
  const [switcherOpen, setSwitcherOpen] = useState(false);

  const totalMinor = computeTotalSpent(expenses);
  const total = toMajorUnits(totalMinor);
  const me = members.find((m) => m.isMe);
  const myBalance = me?.balance ?? 0;
  const myShare = me ? toMajorUnits(computeMemberShare(me.id, expenses)) : 0;
  const myShareRounded = Math.round(myShare);
  const hasBudget = budget != null && budget > 0;
  const budgetStats = computeBudgetStats(totalMinor, budget != null ? toMinorUnits(budget) : undefined);
  const progress = budgetStats ? budgetStats.spentPercentage / 100 : 0;

  const balanceZero = myBalance === 0;
  const balancePositive = myBalance > 0;

  const effectiveStatus = computeTripStatus({ startDate, endDate, status: "active" as const });
  const statusLabel =
    effectiveStatus === "active"
      ? "Active"
      : effectiveStatus === "upcoming"
        ? "Upcoming"
        : "Completed";

  const noTrip = empty && tripsHaveNoData(expenses, members);
  const tripNoExpenses = !noTrip && expenses.length === 0;
  const hasSwitcher = trips != null && currentTripId != null && onSwitchTrip != null;

  const openSwitcher = () => { if (hasSwitcher) setSwitcherOpen(true); };

  // ── No trips state ──────────────────────────────────────────────────────
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
                  className="pressable flex items-center justify-center gap-1.5 px-5 h-11 rounded-[12px] bg-[#0A86A0] text-white font-700 text-[14px] shadow-[0_2px_8px_rgba(10,134,160,0.18)]"
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

  // ── Trip with no expenses yet ───────────────────────────────────────────
  if (tripNoExpenses) {
    return (
      <section className="px-4 pt-3 pb-1">
        <div className="bg-white rounded-[20px] border border-[#E1E7EF] overflow-hidden">
          {/* Trip identity */}
          <div className="px-5 pt-4 pb-3">
            <button onClick={openSwitcher} className="pressable w-full flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-[12px] bg-[#EFF9FB] flex items-center justify-center text-[#0A86A0] shrink-0">
                <HugeiconsIcon icon={MapIcon} size={20} color="currentColor" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-700 text-[#0F172A] truncate leading-snug">
                  {tripName ?? "Trip"}
                </p>
                <p className="text-[12px] text-[#94A3B8] font-500 mt-0.5 truncate">
                  {tripDates ?? ""} · {members.length} {members.length === 1 ? "traveler" : "travelers"} · {statusLabel}
                </p>
              </div>
              {hasSwitcher && (
                <span className="text-[#C9D4DF] shrink-0">
                  <HugeiconsIcon icon={ChevronDownIcon} size={16} color="currentColor" strokeWidth={2} />
                </span>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="px-5 border-b border-[#F1F5F9]" />

          {/* Balance */}
          <div className="px-5 pt-4 pb-3">
            <p className="text-[12px] font-600 text-[#94A3B8] mb-0.5">Your balance</p>
            <p className="num text-[30px] font-800 text-[#94A3B8] leading-tight">৳0</p>
          </div>

          {/* Secondary metrics */}
          <div className="px-5 pb-3 flex items-baseline justify-between gap-4">
            <div>
              <p className="text-[12px] font-600 text-[#94A3B8]">My share</p>
              <p className="num text-[15px] font-700 text-[#0F172A] mt-0.5">৳0</p>
            </div>
            <div className="text-right">
              <p className="text-[12px] font-600 text-[#94A3B8]">Total spent</p>
              <p className="num text-[15px] font-700 text-[#0F172A] mt-0.5">৳0</p>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-4 pt-1">
            <button
              onClick={onAddExpense}
              className="pressable inline-flex items-center gap-1.5 px-4 h-10 rounded-[12px] bg-[#0A86A0] text-white font-700 text-[13px] shadow-[0_2px_8px_rgba(10,134,160,0.18)] active:scale-[0.97] transition-all"
            >
              <HugeiconsIcon icon={PlusIcon} size={14} color="currentColor" strokeWidth={2.5} />
              Add expense
            </button>
          </div>
        </div>
      </section>
    );
  }

  // ── Main card with expenses ─────────────────────────────────────────────
  const displayName = tripName ?? "Trip";
  const displayDates = tripDates ?? "";

  return (
    <section className="px-4 pt-3 pb-1">
      <div className="bg-white rounded-[20px] border border-[#E1E7EF] overflow-hidden">
        {/* ── Trip identity ──────────────────────────────────────────────── */}
        <div className="px-5 pt-4 pb-3">
          <button onClick={openSwitcher} className="pressable w-full flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-[12px] bg-[#EFF9FB] flex items-center justify-center text-[#0A86A0] shrink-0">
                <HugeiconsIcon icon={MapIcon} size={20} color="currentColor" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-700 text-[#0F172A] truncate leading-snug">
                  {displayName}
                </p>
                <p className="text-[12px] text-[#94A3B8] font-500 mt-0.5 truncate">
                  {displayDates} · {members.length} travelers · {statusLabel}
                </p>
              </div>
              {hasSwitcher && (
                <span className="text-[#C9D4DF] shrink-0">
                  <HugeiconsIcon icon={ChevronDownIcon} size={16} color="currentColor" strokeWidth={2} />
                </span>
              )}
            </button>
        </div>

        {/* ── Divider ────────────────────────────────────────────────────── */}
        <div className="px-5 border-b border-[#F1F5F9]" />

        {/* ── Your Balance (PRIMARY) ──────────────────────────────────────── */}
        <div className="px-5 pt-4 pb-3">
          <p className="text-[12px] font-600 text-[#94A3B8] mb-0.5">Your balance</p>
          <p
            className={`num text-[30px] font-800 leading-tight ${
              balanceZero
                ? "text-[#94A3B8]"
                : balancePositive
                  ? "text-[#15803D]"
                  : "text-[#DC2626]"
            }`}
          >
            {balanceZero ? "৳0" : balancePositive ? `+${fmt(myBalance)}` : `-${fmt(myBalance)}`}
          </p>
        </div>

        {/* ── Secondary metrics: My share / Total spent ──────────────────── */}
        <div className="px-5 pb-3 flex items-baseline justify-between gap-4">
          <div>
            <p className="text-[12px] font-600 text-[#94A3B8]">My share</p>
            <p className="num text-[15px] font-700 text-[#0F172A] mt-0.5">{fmt(myShareRounded)}</p>
          </div>
          <div className="text-right">
            <p className="text-[12px] font-600 text-[#94A3B8]">Total spent</p>
            <p className="num text-[15px] font-700 text-[#0F172A] mt-0.5">{fmt(total)}</p>
          </div>
        </div>

        {/* ── Budget progress (optional) ─────────────────────────────────── */}
        {hasBudget && budgetStats && (
          <>
            <div className="px-5 border-b border-[#F1F5F9]" />
            <div className="px-5 py-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[12px] font-600 text-[#94A3B8]">Budget</p>
                <p className="num text-[12px] font-600 text-[#475569]">
                  {fmt(total)} of {fmt(budget ?? 0)}
                </p>
              </div>
              <div className="h-[4px] bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0A86A0] rounded-full transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <p className="num text-[11px] font-600 text-[#94A3B8] mt-1 text-right">
                {budgetStats.spentPercentage}%
              </p>
            </div>
          </>
        )}

        {/* ── Actions ────────────────────────────────────────────────────── */}
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

      {/* ── Trip Switcher ─────────────────────────────────────────────── */}
      {hasSwitcher && (
        <TripSwitcherSheet
          open={switcherOpen}
          onClose={() => setSwitcherOpen(false)}
          trips={trips}
          currentTripId={currentTripId}
          onSelectTrip={onSwitchTrip}
          onCreateTrip={() => { setSwitcherOpen(false); onNewTour?.(); }}
          onJoinTrip={onJoinTrip ? () => { setSwitcherOpen(false); onJoinTrip(); } : undefined}
        />
      )}
    </section>
  );
}
