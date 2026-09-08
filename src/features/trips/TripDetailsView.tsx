import { useState, useId, useCallback, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  UserGroupIcon,
  Calendar01Icon,
  Money01Icon,
  PlusIcon,
  Add01Icon,
  ArrowRight01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import { fmt } from "../../lib/format";
import CATEGORY_META from "../../lib/categoryMeta";
import { Avatar } from "../../components/shared/Avatar";
import type { Member, Expense } from "../../domain/types";
import type { Trip } from "../../domain/trip";
import type { Tour } from "./components/TripCard";
import { computeTotalSpent, computeBudgetStats, toMajorUnits, toMinorUnits } from "../../domain/finance";
import { IconDots } from "../../components/shared/icons";
import TripOverflowSheet from "./components/TripOverflowSheet";
import DeleteTripSheet from "./components/DeleteTripSheet";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDates(start?: string, end?: string): string {
  if (!start) return "";
  const startStr = new Date(start + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (!end || end === start) return startStr;
  const endStr = new Date(end + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${startStr}\u2013${endStr}`;
}

// ─── Props ───────────────────────────────────────────────────────────────────
export interface TripDetailsViewProps {
  trip: Trip;
  onBack: () => void;
  onSeeAllExpenses?: (tripId: string) => void;
  onTapExpense?: (expenseId: string, expense: Expense) => void;
  onTapMember?: (memberId: string, member: Member) => void;
  onViewMembers?: () => void;
  onInvite?: () => void;
  onSaveTrip?: (patch: { name: string; startDate?: string; endDate?: string; budget?: number }) => void;
  onDeleteTrip?: () => void;
  onGoHome?: () => void;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function TripDetailsView({
  trip,
  onBack,
  onSeeAllExpenses,
  onTapExpense,
  onTapMember,
  onViewMembers,
  onInvite,
  onSaveTrip,
  onDeleteTrip,
  onGoHome,
}: TripDetailsViewProps) {
  // ── Derived (always from canonical trip) ──────────────────────────────────
  const totalSpentMinor = computeTotalSpent(trip.expenses);
  const totalSpent = toMajorUnits(totalSpentMinor);
  const budgetStats = computeBudgetStats(totalSpentMinor, trip.budget ? toMinorUnits(trip.budget) : undefined);
  const hasBudget = budgetStats !== null;
  const spentPct = budgetStats ? budgetStats.spentPercentage : 0;
  const remaining = budgetStats ? toMajorUnits(budgetStats.remainingMinor) : 0;
  const budget = trip.budget ?? 0;

  const travelerCount = trip.travelerCount ?? trip.members.length;
  const durationDays = trip.durationDays ?? 1;

  // ── Sheet state ──────────────────────────────────────────────────────────
  const [showOverflow, setShowOverflow] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Edit mode ────────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(false);
  const [showDiscard, setShowDiscard] = useState(false);

  const nameId = useId();
  const budgetId = useId();
  const startDateId = useId();
  const endDateId = useId();

  const [editName, setEditName] = useState(trip.name);
  const [editStartDate, setEditStartDate] = useState(trip.startDate ?? "");
  const [editEndDate, setEditEndDate] = useState(trip.endDate ?? "");
  const [editHasBudget, setEditHasBudget] = useState(trip.budget != null && trip.budget > 0);
  const [editBudgetStr, setEditBudgetStr] = useState(trip.budget != null && trip.budget > 0 ? String(trip.budget) : "");
  const [touchedName, setTouchedName] = useState(false);

  // Sync form when trip changes (e.g. from canonical update)
  useEffect(() => {
    if (!isEditing) {
      setEditName(trip.name);
      setEditStartDate(trip.startDate ?? "");
      setEditEndDate(trip.endDate ?? "");
      setEditHasBudget(trip.budget != null && trip.budget > 0);
      setEditBudgetStr(trip.budget != null && trip.budget > 0 ? String(trip.budget) : "");
      setTouchedName(false);
    }
  }, [trip, isEditing]);

  const trimmedEditName = editName.trim();
  const editBudgetNum = editHasBudget ? Number(editBudgetStr) : undefined;
  const editBudgetValid = !editHasBudget || (editBudgetStr !== "" && !isNaN(editBudgetNum!) && editBudgetNum! > 0);
  const canSave = trimmedEditName.length > 0 && editBudgetValid;

  const hasChanges =
    trimmedEditName !== trip.name ||
    editStartDate !== (trip.startDate ?? "") ||
    editEndDate !== (trip.endDate ?? "") ||
    editHasBudget !== (trip.budget != null && trip.budget > 0) ||
    (editHasBudget && editBudgetStr !== String(trip.budget ?? ""));

  // ── Handlers ─────────────────────────────────────────────────────────────
  function enterEdit() {
    setEditName(trip.name);
    setEditStartDate(trip.startDate ?? "");
    setEditEndDate(trip.endDate ?? "");
    setEditHasBudget(trip.budget != null && trip.budget > 0);
    setEditBudgetStr(trip.budget != null && trip.budget > 0 ? String(trip.budget) : "");
    setTouchedName(false);
    setIsEditing(true);
  }

  function cancelEdit() {
    if (hasChanges) {
      setShowDiscard(true);
    } else {
      setIsEditing(false);
    }
  }

  function discardAndExit() {
    setShowDiscard(false);
    setIsEditing(false);
    setEditName(trip.name);
    setEditStartDate(trip.startDate ?? "");
    setEditEndDate(trip.endDate ?? "");
    setEditHasBudget(trip.budget != null && trip.budget > 0);
    setEditBudgetStr(trip.budget != null && trip.budget > 0 ? String(trip.budget) : "");
    setTouchedName(false);
  }

  function saveEdit() {
    if (!canSave || !onSaveTrip) return;
    onSaveTrip({
      name: trimmedEditName,
      startDate: editStartDate || undefined,
      endDate: editEndDate || undefined,
      budget: editHasBudget && editBudgetNum && editBudgetNum > 0 ? editBudgetNum : undefined,
    });
    setIsEditing(false);
  }

  const inputBase = "w-full bg-white rounded-[12px] px-4 h-[44px] text-[15px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none border border-[#E1E7EF] focus:border-[#0A86A0] transition-colors";
  const inputError = "border-[#FECACA] bg-[#FFF5F5]";

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

        {/* Header buttons */}
        <div className="absolute top-0 left-0 right-0 p-4 safe-top z-10 flex items-center justify-between">
          {/* Back / Cancel */}
          <button
            onClick={isEditing ? cancelEdit : onBack}
            className="pressable w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-black/60 transition-colors"
            aria-label={isEditing ? "Cancel editing" : "Go back to trips"}
          >
            {isEditing ? (
              <HugeiconsIcon icon={Cancel01Icon} size={20} color="currentColor" strokeWidth={2} />
            ) : (
              <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="currentColor" strokeWidth={2} />
            )}
          </button>

          {/* Right: Save (edit mode) or Overflow (view mode) */}
          {isEditing ? (
            <button
              onClick={saveEdit}
              disabled={!canSave}
              className={`pressable px-4 h-10 rounded-full font-700 text-[14px] transition-all ${
                canSave
                  ? "bg-white text-[#0A86A0] hover:bg-[#EFF9FB]"
                  : "bg-white/40 text-white/60"
              }`}
            >
              Save
            </button>
          ) : onDeleteTrip ? (
            <button
              onClick={() => setShowOverflow(true)}
              className="pressable w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20 hover:bg-black/60 transition-colors"
              aria-label="Trip options"
            >
              <IconDots size={20} />
            </button>
          ) : null}
        </div>

        {/* Trip Identity / Status / Dates */}
        <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
          {isEditing ? (
            <input
              id={nameId}
              type="text"
              placeholder="Trip name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => setTouchedName(true)}
              className={`w-full bg-white/10 backdrop-blur-md text-[26px] font-800 text-white tracking-tight leading-tight placeholder:text-white/40 outline-none border-2 border-white/20 rounded-[12px] px-3 py-2 mb-2 ${
                touchedName && !trimmedEditName ? "border-[#FCA5A5]" : ""
              }`}
              autoFocus
            />
          ) : (
            <h1 className="text-[26px] font-800 text-white tracking-tight leading-tight mb-2 text-shadow-sm">
              {trip.name}
            </h1>
          )}
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
            {!isEditing && (
              <span className="text-[13px] font-500 text-white/90">
                {trip.dates}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 -mt-3 relative z-20 space-y-4 max-w-[600px] mx-auto">
        {/* ── Edit: Dates & Budget ─────────────────────────────────────────── */}
        {isEditing && (
          <div className="bg-white rounded-[18px] border border-[#E2E8F0] shadow-sm p-4 space-y-4">
            <p className="text-[13px] font-700 text-[#475569] uppercase tracking-wide">Edit details</p>

            {/* Dates */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-600 text-[#475569]">Trip dates</span>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-[#F8FAFC] rounded-[12px] border border-[#E1E7EF] focus-within:border-[#0A86A0] transition-colors h-[44px]">
                  <span className="pl-3 text-[#0A86A0] shrink-0">
                    <HugeiconsIcon icon={Calendar01Icon} size={16} color="currentColor" strokeWidth={1.75} />
                  </span>
                  <input
                    id={startDateId}
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="flex-1 bg-transparent pl-2 pr-2 h-full text-[13px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none min-w-0"
                    aria-label="Start date"
                  />
                </div>
                <span className="text-[#94A3B8] shrink-0">
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="currentColor" strokeWidth={1.75} />
                </span>
                <div className="flex-1 flex items-center bg-[#F8FAFC] rounded-[12px] border border-[#E1E7EF] focus-within:border-[#0A86A0] transition-colors h-[44px]">
                  <span className="pl-3 text-[#0A86A0] shrink-0">
                    <HugeiconsIcon icon={Calendar01Icon} size={16} color="currentColor" strokeWidth={1.75} />
                  </span>
                  <input
                    id={endDateId}
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="flex-1 bg-transparent pl-2 pr-2 h-full text-[13px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none min-w-0"
                    aria-label="End date"
                  />
                </div>
              </div>
            </div>

            {/* Spending style */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-600 text-[#475569]">Spending style</span>
              <div className="flex bg-[#F8FAFC] rounded-[12px] p-1 border border-[#E1E7EF]">
                <button
                  type="button"
                  onClick={() => setEditHasBudget(false)}
                  className={`flex-1 h-[38px] rounded-[10px] text-[13px] font-600 transition-all ${
                    !editHasBudget
                      ? "bg-[#EFF9FB] text-[#0A86A0] border border-[#A3DFE9]"
                      : "text-[#64748B] hover:text-[#475569]"
                  }`}
                  aria-pressed={!editHasBudget}
                >
                  Pay as you go
                </button>
                <button
                  type="button"
                  onClick={() => setEditHasBudget(true)}
                  className={`flex-1 h-[38px] rounded-[10px] text-[13px] font-600 transition-all ${
                    editHasBudget
                      ? "bg-[#EFF9FB] text-[#0A86A0] border border-[#A3DFE9]"
                      : "text-[#64748B] hover:text-[#475569]"
                  }`}
                  aria-pressed={editHasBudget}
                >
                  Set a budget
                </button>
              </div>
            </div>

            {/* Budget amount */}
            {editHasBudget && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor={budgetId} className="text-[13px] font-600 text-[#475569]">Trip budget</label>
                <div className={`flex items-center bg-[#F8FAFC] rounded-[12px] border transition-colors h-[44px] ${editBudgetStr !== "" && !editBudgetValid ? inputError : "border-[#E1E7EF] focus-within:border-[#0A86A0]"}`}>
                  <span className="pl-4 text-[16px] font-600 text-[#94A3B8] shrink-0 select-none">৳</span>
                  <input
                    id={budgetId}
                    type="number"
                    inputMode="decimal"
                    placeholder="50,000"
                    value={editBudgetStr}
                    onChange={(e) => setEditBudgetStr(e.target.value.replace(/[^\d]/g, ""))}
                    className="flex-1 bg-transparent pl-1.5 pr-2 h-full text-[14px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none num"
                  />
                </div>
                {editBudgetStr !== "" && !editBudgetValid && (
                  <p className="text-[12px] font-500 text-[#DC2626] flex items-center gap-1">
                    <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                    </svg>
                    Budget must be greater than 0.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 2. Summary Stats Card ─────────────────────────────────────────── */}
        <div className="bg-white rounded-[18px] border border-[#E2E8F0] shadow-sm py-3.5 px-3 flex items-center divide-x divide-[#F1F5F9]">
          {/* Travelers */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
            <span className="text-[#0A86A0] mb-1">
              <HugeiconsIcon icon={UserGroupIcon} size={20} strokeWidth={1.75} />
            </span>
            <span className="text-[14px] font-700 text-[#0F172A] leading-tight">
              {travelerCount} Travelers
            </span>
          </div>

          {/* Days */}
          <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
            <span className="text-[#0A86A0] mb-1">
              <HugeiconsIcon icon={Calendar01Icon} size={20} strokeWidth={1.75} />
            </span>
            <span className="text-[14px] font-700 text-[#0F172A] leading-tight">
              {durationDays} Days
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

        {!isEditing && onGoHome && (
          <button
            onClick={onGoHome}
            className="pressable w-full bg-white rounded-[18px] border border-[#E2E8F0] shadow-sm px-4 py-3.5 flex items-center justify-between"
          >
            <div>
              <p className="text-[14px] font-700 text-[#0A86A0]">Enter trip</p>
              <p className="text-[12px] text-[#94A3B8] mt-0.5">View expenses, balances, and members</p>
            </div>
            <span className="text-[#94A3B8]">
              <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="currentColor" strokeWidth={1.75} />
            </span>
          </button>
        )}

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
        {!isEditing && (
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <button onClick={onViewMembers} className="pressable">
                <span className="text-[16px] font-700 text-[#0F172A]">
                  Members ({trip.members.length})
                </span>
              </button>
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
        )}

        {/* ── 5. Expenses Preview Section ───────────────────────────────────── */}
        {!isEditing && (
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
        )}
      </div>

      {/* ── Sheets ──────────────────────────────────────────────────────────── */}
      {showOverflow && (
        <TripOverflowSheet
          onEdit={enterEdit}
          onDelete={() => { setShowOverflow(false); setShowDeleteConfirm(true); }}
          onClose={() => setShowOverflow(false)}
        />
      )}

      {showDeleteConfirm && (
        <DeleteTripSheet
          trip={trip}
          onConfirm={() => { setShowDeleteConfirm(false); onDeleteTrip?.(); }}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}

      {showDiscard && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowDiscard(false)} style={{ animation: "fadeIn 150ms ease" }} />
          <div className="relative w-full max-w-[480px] bg-white rounded-t-[24px] safe-bottom z-10" style={{ animation: "sheetUp 240ms cubic-bezier(0.32,0.72,0,1)" }}>
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-[#E1E7EF] rounded-full" /></div>
            <div className="px-5 pt-2 pb-5">
              <p className="text-[16px] font-700 text-[#0F172A] mb-1">Discard changes?</p>
              <p className="text-[14px] font-500 text-[#64748B] mb-5 leading-relaxed">
                Your changes to this trip haven&apos;t been saved.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowDiscard(false)} className="pressable flex-1 h-12 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-700 text-[15px]">Keep editing</button>
                <button onClick={discardAndExit} className="pressable flex-1 h-12 rounded-[13px] bg-[#DC2626] text-white font-700 text-[15px]">Discard</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
