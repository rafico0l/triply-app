import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  UserGroupIcon,
  Calendar01Icon,
  Money01Icon,
  PlusIcon,
  Add01Icon,
} from "@hugeicons/core-free-icons";
import { fmt } from "../../lib/format";
import CATEGORY_META from "../../lib/categoryMeta";
import { Avatar } from "../../components/shared/Avatar";
import type { Member, Expense } from "../../domain/types";
import type { Trip } from "../../domain/trip";
import type { Tour } from "./components/TripCard";
import { computeTotalSpent, computeBudgetStats, toMajorUnits, toMinorUnits } from "../../domain/finance";

export interface TripDetailsViewProps {
  trip: Trip;
  onBack: () => void;
  onSeeAllExpenses?: (tripId: string) => void;
  onTapExpense?: (expenseId: string, expense: Expense) => void;
  onTapMember?: (memberId: string, member: Member) => void;
  onInvite?: () => void;
}

export default function TripDetailsView({
  trip,
  onBack,
  onSeeAllExpenses,
  onTapExpense,
  onTapMember,
  onInvite,
}: TripDetailsViewProps) {
  const totalSpentMinor = computeTotalSpent(trip.expenses);
  const totalSpent = toMajorUnits(totalSpentMinor);
  const budgetStats = computeBudgetStats(totalSpentMinor, trip.budget ? toMinorUnits(trip.budget) : undefined);
  const hasBudget = budgetStats !== null;
  const spentPct = budgetStats ? budgetStats.spentPercentage : 0;
  const remaining = budgetStats ? toMajorUnits(budgetStats.remainingMinor) : 0;
  const budget = trip.budget ?? 0;

  const travelerCount = trip.travelerCount ?? trip.members.length;
  const durationDays = trip.durationDays ?? 1;

  return (
    <div className="bg-[#F8FAFC] min-h-full pb-10">
      {/* ── 1. Hero / Cover Section ────────────────────────────────────────── */}
      <div className="relative w-full aspect-[4/3] max-h-[380px] bg-[#0F172A] overflow-hidden">
        {trip.coverImage ? (
          <img
            src={trip.coverImage}
            alt={trip.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#0A86A0] to-[#043E4B]" />
        )}

        {/* Dark bottom gradient overlay for legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/85" />

        {/* Back button */}
        <div className="absolute top-0 left-0 right-0 p-4 safe-top z-10">
          <button
            onClick={onBack}
            className="pressable w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-black/60 transition-colors"
            aria-label="Go back to trips"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={22}
              color="currentColor"
              strokeWidth={2}
            />
          </button>
        </div>

        {/* Trip Identity / Status / Dates */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          <h1 className="text-[26px] font-800 text-white tracking-tight leading-tight mb-2 text-shadow-sm">
            {trip.name}
          </h1>
          <div className="flex items-center gap-2.5">
            {trip.status === "active" && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-700 bg-[#E0F2FE] text-[#0284C7] shadow-sm">
                Active
              </span>
            )}
            {trip.status === "upcoming" && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-700 bg-[#FEF3C7] text-[#D97706] shadow-sm">
                Upcoming
              </span>
            )}
            {trip.status === "completed" && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-700 bg-white/20 text-white/90 backdrop-blur-sm shadow-sm">
                Completed
              </span>
            )}
            <span className="text-[13px] font-500 text-white/90">
              {trip.dates}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-20 space-y-4 max-w-[600px] mx-auto">
        {/* ── 2. Summary Stats Card ─────────────────────────────────────────── */}
        <div className="bg-white rounded-[18px] border border-[#E2E8F0] shadow-sm py-3.5 px-3 flex items-center divide-x divide-[#F1F5F9]">
          {/* Travelers */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
            <span className="text-[#0A86A0] mb-1">
              <HugeiconsIcon icon={UserGroupIcon} size={20} strokeWidth={1.75} />
            </span>
            <span className="text-[14px] font-700 text-[#0F172A] leading-tight">
              {trip.travelerCount} Travelers
            </span>
          </div>

          {/* Days */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
            <span className="text-[#0A86A0] mb-1">
              <HugeiconsIcon icon={Calendar01Icon} size={20} strokeWidth={1.75} />
            </span>
            <span className="text-[14px] font-700 text-[#0F172A] leading-tight">
              {trip.durationDays} Days
            </span>
          </div>

          {/* Total Spent */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
            <span className="text-[#0A86A0] mb-1">
              <HugeiconsIcon icon={Money01Icon} size={20} strokeWidth={1.75} />
            </span>
            <span className="text-[14px] font-700 text-[#0F172A] leading-tight">
              {fmt(totalSpent)} Spent
            </span>
          </div>
        </div>

        {/* ── 3. Trip Spending / Budget Card ─────────────────────────────────── */}
        <div className="bg-white rounded-[18px] border border-[#E2E8F0] shadow-sm p-4">
          {hasBudget ? (
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[14px] font-600 text-[#64748B]">
                  Trip spending
                </span>
                <span className="text-[14px] font-700 text-[#0F172A]">
                  {fmt(totalSpent)} of {fmt(budget)}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2.5 bg-[#E2E8F0] rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-[#0A86A0] rounded-full transition-all duration-300"
                  style={{ width: `${spentPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[12px] font-500 text-[#94A3B8]">
                <span>{spentPct}% spent</span>
                <span>{fmt(remaining)} remaining</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[14px] font-600 text-[#64748B]">
                  Trip spending
                </span>
                <span className="text-[18px] font-800 text-[#0F172A]">
                  {fmt(totalSpent)}
                </span>
              </div>
              <p className="text-[12px] font-500 text-[#94A3B8]">
                Pay as you go
              </p>
            </div>
          )}
        </div>

        {/* ── 4. Members Section ────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[16px] font-700 text-[#0F172A]">
              Members ({trip.members.length})
            </h2>
            {trip.status !== "completed" && (
              <button
                onClick={onInvite}
                className="pressable inline-flex items-center gap-1 text-[13px] font-700 text-[#0A86A0] hover:text-[#087288]"
              >
                <span>Invite</span>
                <span className="text-[15px] font-700 leading-none">+</span>
              </button>
            )}
          </div>

          <div className="bg-white rounded-[18px] border border-[#E2E8F0] shadow-sm p-4">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar py-1">
              {trip.members.map((member) => (
                <button
                  key={member.id}
                  onClick={() => onTapMember?.(member.id, member)}
                  className="pressable flex flex-col items-center shrink-0 w-[58px] text-center"
                >
                  <div className="relative mb-1.5">
                    <Avatar
                      member={{
                        initials: member.initials,
                        color: member.color,
                      }}
                      size={44}
                    />
                    {member.role === "guest" && (
                      <span className="absolute -bottom-1 -right-1 px-1 rounded bg-[#F1F5F9] text-[#64748B] text-[9px] font-600 border border-[#E2E8F0]">
                        G
                      </span>
                    )}
                  </div>
                  <span className="text-[12px] font-600 text-[#0F172A] truncate w-full leading-tight">
                    {member.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── 5. Expenses Preview Section ───────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[16px] font-700 text-[#0F172A]">Expenses</h2>
            {trip.expenses.length > 0 && (
              <button
                onClick={() => onSeeAllExpenses?.(trip.id)}
                className="pressable text-[13px] font-700 text-[#0A86A0] hover:text-[#087288]"
              >
                See all
              </button>
            )}
          </div>

          {trip.expenses.length === 0 ? (
            <div className="bg-white rounded-[18px] border border-[#E2E8F0] shadow-sm p-6 text-center">
              <p className="text-[14px] font-600 text-[#0F172A] mb-1">
                No expenses yet
              </p>
              <p className="text-[13px] text-[#94A3B8]">
                Expenses added to this trip will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {trip.expenses.slice(0, 4).map((expense) => {
                const cat = CATEGORY_META[expense.category] ?? CATEGORY_META.other;
                const payer = trip.members.find((m) => m.id === expense.paidBy);
                const payerLabel = payer?.isMe
                  ? "You paid"
                  : payer
                  ? `${payer.name.replace(/ \(You\)/g, "")} paid`
                  : "Paid";

                return (
                  <button
                    key={expense.id}
                    onClick={() => onTapExpense?.(expense.id, expense)}
                    className="pressable w-full text-left bg-white rounded-[18px] border border-[#E2E8F0] shadow-sm px-4 py-3.5 flex items-center gap-3.5 hover:border-[#CBD5E1] transition-colors"
                  >
                    {/* Category Icon */}
                    <div
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cat.bg, color: cat.fg }}
                    >
                      <div className="scale-110">{cat.icon}</div>
                    </div>

                    {/* Description and metadata */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-700 text-[#0F172A] leading-snug truncate">
                        {expense.title}
                      </p>
                      <p className="text-[12px] text-[#94A3B8] font-500 mt-0.5 truncate">
                        {expense.date} · {cat.label} · {payerLabel}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <span className="num text-[15px] font-700 text-[#0F172A]">
                        {fmt(expense.amount)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
