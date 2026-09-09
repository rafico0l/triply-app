import { useState, useId, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Cancel01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { fmt } from "../../lib/format";
import { getCategoryMeta } from "../../lib/categoryMeta";
import { Avatar } from "../../components/shared/Avatar";
import type { Member, Expense } from "../../domain/types";
import type { Trip } from "../../domain/trip";
import { computeTripStatus, computeDurationDays } from "../../domain/trip";
import { computeTotalSpent, computeMemberShare, computeBudgetStats, toMajorUnits, toMinorUnits } from "../../domain/finance";
import { IconDots, IconDotsV } from "../../components/shared/icons";
import TripOverflowSheet from "./components/TripOverflowSheet";
import DeleteTripSheet from "./components/DeleteTripSheet";
import ExpenseOverflowSheet from "../expenses/components/ExpenseOverflowSheet";
import DeleteExpenseSheet from "../expenses/components/DeleteExpenseSheet";

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
  onEditExpense?: (expense: Expense) => void;
  onDeleteExpense?: (expenseId: string) => void;
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
  onEditExpense,
  onDeleteExpense,
  onGoHome,
}: TripDetailsViewProps) {
  // ── Derived ─────────────────────────────────────────────────────────────
  const totalSpentMinor = computeTotalSpent(trip.expenses);
  const totalSpent = toMajorUnits(totalSpentMinor);
  const budgetStats = computeBudgetStats(totalSpentMinor, trip.budget ? toMinorUnits(trip.budget) : undefined);
  const hasBudget = budgetStats !== null;
  const spentPct = budgetStats ? budgetStats.spentPercentage : 0;
  const remaining = budgetStats ? toMajorUnits(budgetStats.remainingMinor) : 0;
  const budget = trip.budget ?? 0;

  const durationDays = computeDurationDays(trip) ?? 1;
  const me = trip.members.find((m) => m.isMe);
  const effectiveStatus = computeTripStatus(trip);
  const myShare = me ? toMajorUnits(computeMemberShare(me.id, trip.expenses)) : 0;

  // ── Sheet state ─────────────────────────────────────────────────────────
  const [showOverflow, setShowOverflow] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Expense overflow state ──────────────────────────────────────────────
  const [overflowExpenseId, setOverflowExpenseId] = useState<string | null>(null);
  const [deleteExpenseId, setDeleteExpenseId] = useState<string | null>(null);
  const overflowExpense = overflowExpenseId ? trip.expenses.find((e) => e.id === overflowExpenseId) ?? null : null;
  const deleteExpense = deleteExpenseId ? trip.expenses.find((e) => e.id === deleteExpenseId) ?? null : null;

  // ── Edit mode ───────────────────────────────────────────────────────────
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

  // ── Handlers ────────────────────────────────────────────────────────────
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

  function canEditExpense(expense: Expense): boolean {
    return me ? (me.id === expense.addedBy || me.role === "owner") : false;
  }

  return (
    <div className="bg-[#F4F6F9] min-h-full pb-10">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E1E7EF] safe-top shrink-0 sticky top-0 z-20">
        <div className="flex items-center gap-1 px-2 h-[52px] max-w-[720px] mx-auto w-full">
          <button
            onClick={isEditing ? cancelEdit : onBack}
            className="pressable w-10 h-10 flex items-center justify-center rounded-full text-[#475569]"
            aria-label={isEditing ? "Cancel editing" : "Go back"}
          >
            {isEditing ? (
              <HugeiconsIcon icon={Cancel01Icon} size={22} color="currentColor" strokeWidth={1.75} />
            ) : (
              <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="currentColor" strokeWidth={1.75} />
            )}
          </button>
          <h1 className="flex-1 text-[16px] font-700 text-[#0F172A] truncate px-1">
            {isEditing ? "Edit trip" : "Trip details"}
          </h1>
          {isEditing ? (
            <button
              onClick={saveEdit}
              disabled={!canSave}
              className={`pressable px-3 h-8 rounded-full text-[13px] font-700 transition-colors ${
                canSave
                  ? "bg-[#0A86A0] text-white hover:bg-[#087288]"
                  : "bg-[#F1F5F9] text-[#94A3B8]"
              }`}
            >
              Save
            </button>
          ) : onDeleteTrip ? (
            <button
              onClick={() => setShowOverflow(true)}
              className="pressable w-10 h-10 flex items-center justify-center rounded-full text-[#475569]"
              aria-label="More options"
            >
              <IconDotsV size={18} />
            </button>
          ) : null}
        </div>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 space-y-3 max-w-[600px] mx-auto">
        {/* ── Trip Summary Card ────────────────────────────────────────────── */}
        <div className="bg-white rounded-[16px] border border-[#E1E7EF] p-4">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label htmlFor={nameId} className="text-[12px] font-600 text-[#475569] block mb-1">Trip name</label>
                <input
                  id={nameId}
                  type="text"
                  placeholder="Trip name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => setTouchedName(true)}
                  className={`w-full bg-[#F8FAFC] rounded-[10px] px-3 h-10 text-[14px] font-500 text-[#0F172A] placeholder:text-[#94A3B8] outline-none border transition-colors ${
                    touchedName && !trimmedEditName ? "border-[#FECACA]" : "border-[#E1E7EF] focus:border-[#0A86A0]"
                  }`}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label htmlFor={startDateId} className="text-[12px] font-600 text-[#475569] block mb-1">Start</label>
                  <input
                    id={startDateId}
                    type="date"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full bg-[#F8FAFC] rounded-[10px] px-3 h-10 text-[13px] font-500 text-[#0F172A] outline-none border border-[#E1E7EF] focus:border-[#0A86A0] transition-colors"
                  />
                </div>
                <div className="flex-1">
                  <label htmlFor={endDateId} className="text-[12px] font-600 text-[#475569] block mb-1">End</label>
                  <input
                    id={endDateId}
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full bg-[#F8FAFC] rounded-[10px] px-3 h-10 text-[13px] font-500 text-[#0F172A] outline-none border border-[#E1E7EF] focus:border-[#0A86A0] transition-colors"
                  />
                </div>
              </div>
              <div>
                <span className="text-[12px] font-600 text-[#475569] block mb-1">Budget</span>
                <div className="flex bg-[#F8FAFC] rounded-[10px] p-0.5 border border-[#E1E7EF]">
                  <button
                    type="button"
                    onClick={() => setEditHasBudget(false)}
                    className={`flex-1 h-9 rounded-[8px] text-[13px] font-600 transition-colors ${
                      !editHasBudget
                        ? "bg-white text-[#0A86A0] shadow-sm border border-[#E1E7EF]"
                        : "text-[#64748B] hover:text-[#475569]"
                    }`}
                    aria-pressed={!editHasBudget}
                  >
                    Pay as you go
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditHasBudget(true)}
                    className={`flex-1 h-9 rounded-[8px] text-[13px] font-600 transition-colors ${
                      editHasBudget
                        ? "bg-white text-[#0A86A0] shadow-sm border border-[#E1E7EF]"
                        : "text-[#64748B] hover:text-[#475569]"
                    }`}
                    aria-pressed={editHasBudget}
                  >
                    Set budget
                  </button>
                </div>
              </div>
              {editHasBudget && (
                <div>
                  <label htmlFor={budgetId} className="text-[12px] font-600 text-[#475569] block mb-1">Amount</label>
                  <div className={`flex items-center bg-[#F8FAFC] rounded-[10px] border transition-colors h-10 ${editBudgetStr !== "" && !editBudgetValid ? "border-[#FECACA] bg-[#FFF5F5]" : "border-[#E1E7EF] focus-within:border-[#0A86A0]"}`}>
                    <span className="pl-3 text-[14px] font-600 text-[#94A3B8] shrink-0 select-none">৳</span>
                    <input
                      id={budgetId}
                      type="number"
                      inputMode="decimal"
                      placeholder="0"
                      value={editBudgetStr}
                      onChange={(e) => setEditBudgetStr(e.target.value.replace(/[^\d]/g, ""))}
                      className="flex-1 bg-transparent pl-1 pr-3 h-full text-[14px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none num"
                    />
                  </div>
                  {editBudgetStr !== "" && !editBudgetValid && (
                    <p className="text-[11px] font-500 text-[#DC2626] mt-1 flex items-center gap-1">
                      <HugeiconsIcon icon={AlertCircleIcon} size={11} color="currentColor" strokeWidth={2.5} />
                      Must be greater than 0
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h2 className="text-[16px] font-700 text-[#0F172A] leading-snug truncate">{trip.name}</h2>
                </div>
                {effectiveStatus === "active" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-700 bg-[#ECFDF5] text-[#065F46] shrink-0">
                    Active
                  </span>
                )}
                {effectiveStatus === "upcoming" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-700 bg-[#FFFBEB] text-[#B45309] shrink-0">
                    Upcoming
                  </span>
                )}
                {effectiveStatus === "completed" && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-700 bg-[#F1F5F9] text-[#64748B] shrink-0">
                    Completed
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0 divide-x divide-[#F1F5F9]">
                <div className="flex-1 flex flex-col items-center text-center px-2">
                  <span className="text-[16px] font-800 text-[#0F172A] leading-tight num">{durationDays}</span>
                  <span className="text-[11px] font-500 text-[#94A3B8] mt-0.5">{durationDays === 1 ? "Day" : "Days"}</span>
                </div>
                <div className="flex-1 flex flex-col items-center text-center px-2">
                  <span className="text-[16px] font-800 text-[#0F172A] leading-tight num">{fmt(totalSpent)}</span>
                  <span className="text-[11px] font-500 text-[#94A3B8] mt-0.5">Spent</span>
                </div>
                <div className="flex-1 flex flex-col items-center text-center px-2">
                  <span className="text-[16px] font-800 text-[#0F172A] leading-tight num">{fmt(myShare)}</span>
                  <span className="text-[11px] font-500 text-[#94A3B8] mt-0.5">My share</span>
                </div>
              </div>
              {hasBudget && (
                <div className="mt-3 pt-3 border-t border-[#F1F5F9]">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-500 text-[#64748B]">
                      {fmt(totalSpent)} of {fmt(budget)}
                    </span>
                    <span className="text-[12px] font-700 text-[#0F172A] num">{spentPct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0A86A0] rounded-full transition-all duration-300"
                      style={{ width: `${spentPct}%` }}
                    />
                  </div>
                  <p className="text-[11px] font-500 text-[#94A3B8] mt-1.5">
                    {fmt(remaining)} remaining
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Members ────────────────────────────────────────────────────────── */}
        {!isEditing && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[14px] font-700 text-[#0F172A]">
                Members · {trip.members.length}
              </h3>
              {effectiveStatus !== "completed" && (
                <button
                  onClick={onInvite}
                  className="pressable inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-700 text-[#0A86A0] bg-[#EFF9FB] border border-[#A3DFE9] hover:bg-[#D4F0F5] transition-colors"
                >
                  <span>+ Invite</span>
                </button>
              )}
            </div>
            <div className="bg-white rounded-[16px] border border-[#E1E7EF] p-3">
              <div className="relative">
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 -mb-1">
                  {trip.members.map((member) => (
                    <button
                      key={member.id}
                      onClick={() => onTapMember?.(member.id, member)}
                      className="pressable flex flex-col items-center shrink-0 w-[56px] text-center"
                    >
                      <div className="relative mb-1.5">
                        <Avatar
                          member={{
                            initials: member.initials,
                            color: member.color,
                          }}
                          size={42}
                        />
                        {member.role === "guest" && (
                          <span className="absolute -bottom-0.5 -right-0.5 px-0.5 rounded bg-[#F1F5F9] text-[#64748B] text-[8px] font-600 border border-[#E2E8F0] leading-tight">
                            G
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-500 text-[#475569] truncate w-full leading-tight">
                        {member.name}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="absolute right-0 top-0 bottom-1 w-8 bg-gradient-to-l from-[#F4F6F9] to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        )}

        {/* ── Expenses ──────────────────────────────────────────────────────── */}
        {!isEditing && (
          <div>
            <div className="flex items-center justify-between mb-2 px-1">
              <h3 className="text-[14px] font-700 text-[#0F172A]">Expenses</h3>
              {trip.expenses.length > 0 && (
                <button
                  onClick={() => onSeeAllExpenses?.(trip.id)}
                  className="pressable text-[13px] font-600 text-[#0A86A0] hover:text-[#087288]"
                >
                  See all
                </button>
              )}
            </div>

            <div className="bg-white rounded-[16px] border border-[#E1E7EF] p-4">
              {trip.expenses.length === 0 ? (
                <div className="py-4 text-center">
                  <p className="text-[13px] font-600 text-[#475569]">No expenses yet</p>
                  <p className="text-[12px] text-[#94A3B8] mt-0.5">Expenses added to this trip will appear here.</p>
                </div>
              ) : (
                <div className="space-y-0 divide-y divide-[#F4F6F9]">
                  {trip.expenses.slice(0, 4).map((expense) => {
                    const cat = getCategoryMeta(expense.category);
                    const payer = trip.members.find((m) => m.id === expense.paidBy);
                    const payerLabel = payer?.isMe
                      ? "You"
                      : payer
                      ? payer.name.replace(/ \(You\)/g, "")
                      : "Unknown";
                    const canManage = canEditExpense(expense);

                    return (
                      <div
                        key={expense.id}
                        className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        {/* Category Icon */}
                        <div
                          className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: cat.bg, color: cat.fg }}
                        >
                          {cat.icon}
                        </div>

                        {/* Content */}
                        <button
                          onClick={() => onTapExpense?.(expense.id, expense)}
                          className="pressable flex-1 min-w-0 text-left"
                        >
                          <p className="text-[14px] font-600 text-[#0F172A] truncate leading-snug">
                            {expense.title}
                          </p>
                          <p className="text-[12px] text-[#94A3B8] font-500 mt-0.5 leading-snug">
                            {cat.label} · {expense.date}
                          </p>
                          <p className="text-[12px] text-[#94A3B8] font-500 mt-0.5 leading-snug">
                            Paid by {payerLabel}
                          </p>
                        </button>

                        {/* Amount + Overflow */}
                        <div className="flex items-start gap-1 shrink-0">
                          <span className="num text-[14px] font-700 text-[#0F172A] mt-0.5">
                            {fmt(expense.amount)}
                          </span>
                          {canManage && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOverflowExpenseId(expense.id);
                              }}
                              className="pressable w-7 h-7 flex items-center justify-center rounded-full text-[#94A3B8] hover:bg-[#F4F6F9] hover:text-[#475569] transition-colors -mr-1"
                              aria-label="Expense options"
                            >
                              <IconDots size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Trip Overflow Sheet ────────────────────────────────────────────── */}
      {showOverflow && (
        <TripOverflowSheet
          onEdit={enterEdit}
          onDelete={() => { setShowOverflow(false); setShowDeleteConfirm(true); }}
          onClose={() => setShowOverflow(false)}
        />
      )}

      {/* ── Trip Delete Confirmation ───────────────────────────────────────── */}
      {showDeleteConfirm && (
        <DeleteTripSheet
          trip={trip}
          onConfirm={() => { setShowDeleteConfirm(false); onDeleteTrip?.(); }}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* ── Expense Overflow Sheet ─────────────────────────────────────────── */}
      {overflowExpense && (
        <ExpenseOverflowSheet
          canEdit={canEditExpense(overflowExpense)}
          onEdit={() => {
            setOverflowExpenseId(null);
            onEditExpense?.(overflowExpense);
          }}
          onDelete={() => {
            setOverflowExpenseId(null);
            setDeleteExpenseId(overflowExpense.id);
          }}
          onClose={() => setOverflowExpenseId(null)}
        />
      )}

      {/* ── Expense Delete Confirmation ────────────────────────────────────── */}
      {deleteExpense && (
        <DeleteExpenseSheet
          expense={deleteExpense}
          onConfirm={() => {
            setDeleteExpenseId(null);
            onDeleteExpense?.(deleteExpense.id);
          }}
          onClose={() => setDeleteExpenseId(null)}
        />
      )}

      {/* ── Discard Changes Sheet ──────────────────────────────────────────── */}
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
