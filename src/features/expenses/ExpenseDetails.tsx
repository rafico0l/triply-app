import { useState } from "react";
import type { Expense, Member } from "../../domain/types";
import { fmt } from "../../lib/format";
import CATEGORY_META from "../../lib/categoryMeta";
import { Avatar } from "../../components/shared/Avatar";
import { IconChevronLeft, IconDotsV, IconAlertCircle, IconCalendar, IconNote } from "../../components/shared/icons";
import ExpenseOverflowSheet from "./components/ExpenseOverflowSheet";
import DeleteExpenseSheet from "./components/DeleteExpenseSheet";

export default function ExpenseDetails({
  expense, members, onBack, onEdit, onDelete,
}: {
  expense: Expense; members: Member[]; onBack: () => void; onEdit: () => void; onDelete: () => void;
}) {
  const [showOverflow, setShowOverflow] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const payer   = members.find((m) => m.id === expense.paidBy);
  const adder   = members.find((m) => m.id === expense.addedBy);
  const cat     = CATEGORY_META[expense.category];
  const me      = members.find((m) => m.isMe);
  const canEdit = me ? (me.id === expense.addedBy || me.role === "owner") : false;
  const inSplit = me ? expense.splitIds.includes(me.id) : false;

  const perPersonShare = expense.amount / expense.splitIds.length;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#F4F6F9] flex flex-col overflow-hidden"
      style={{ animation: "slideInFromRight 220ms cubic-bezier(0.32,0.72,0,1)" }}
    >
      {/* Header */}
      <div className="bg-white border-b border-[#E1E7EF] safe-top shrink-0">
        <div className="flex items-center gap-1 px-2 h-[52px] max-w-[720px] mx-auto w-full">
          <button onClick={onBack} className="pressable w-10 h-10 flex items-center justify-center rounded-full text-[#475569]" aria-label="Go back">
            <IconChevronLeft size={22} />
          </button>
          <h1 className="flex-1 text-[16px] font-700 text-[#0F172A] truncate px-1">Expense detail</h1>
          <button onClick={() => setShowOverflow(true)} className="pressable w-10 h-10 flex items-center justify-center rounded-full text-[#475569]" aria-label="More options">
            <IconDotsV size={18} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto w-full pb-8">
          {/* Amount hero */}
          <div className="bg-white px-5 pt-5 pb-5 border-b border-[#E1E7EF]">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0" style={{ backgroundColor: cat.bg, color: cat.fg }}>
                <div style={{ transform: "scale(1.35)" }}>{cat.icon}</div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="num text-[30px] font-800 text-[#0F172A] leading-none">{fmt(expense.amount)}</p>
                <p className="text-[15px] font-600 text-[#0F172A] mt-1.5 leading-snug">{expense.title}</p>
                {expense.syncStatus === "pending" && (
                  <span className="inline-flex items-center gap-1.5 mt-2 text-[12px] font-600 text-[#B45309] bg-[#FFFBEB] border border-[#FDE68A] rounded-full px-2.5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B45309]" />
                    Pending sync
                  </span>
                )}
                {expense.syncStatus === "failed" && (
                  <span className="inline-flex items-center gap-1.5 mt-2 text-[12px] font-600 text-[#DC2626] bg-[#FFF5F5] border border-[#FECACA] rounded-full px-2.5 py-1">
                    <IconAlertCircle size={11} />
                    Sync failed · <button className="underline font-700">Retry</button>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Metadata rows */}
          <div className="bg-white mt-3 mx-4 rounded-[14px] border border-[#E1E7EF] overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F4F6F9]">
              <div className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0" style={{ backgroundColor: cat.bg, color: cat.fg }}>
                <div style={{ transform: "scale(0.85)" }}>{cat.icon}</div>
              </div>
              <span className="text-[13px] font-600 text-[#475569] w-[88px] shrink-0">Category</span>
              <span className="text-[14px] font-600 text-[#0F172A]">{cat.label}</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F4F6F9]">
              <div className="w-7 h-7 rounded-[8px] bg-[#F1F5F9] flex items-center justify-center shrink-0 text-[#475569]">
                <IconCalendar size={13} />
              </div>
              <span className="text-[13px] font-600 text-[#475569] w-[88px] shrink-0">Date</span>
              <span className="text-[14px] font-600 text-[#0F172A]">{expense.date}, 2026</span>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-7 h-7 shrink-0">
                {payer && <Avatar member={payer} size="sm" />}
              </div>
              <span className="text-[13px] font-600 text-[#475569] w-[88px] shrink-0">Paid by</span>
              <span className="text-[14px] font-600 text-[#0F172A]">
                {payer ? (payer.isMe ? `${payer.name} (You)` : payer.name) : "Unknown"}
              </span>
            </div>
          </div>

          {/* Split breakdown */}
          <div className="bg-white mt-3 mx-4 rounded-[14px] border border-[#E1E7EF] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#F4F6F9]">
              <p className="text-[13px] font-700 text-[#0F172A]">Split between</p>
              <span className="text-[12px] font-600 text-[#94A3B8]">{expense.splitIds.length} {expense.splitIds.length === 1 ? "person" : "people"} · equal split</span>
            </div>
            {expense.splitIds.map((sid) => {
              const m = members.find((x) => x.id === sid);
              if (!m) return null;
              const isYou = m.isMe;
              const isPayer = m.id === expense.paidBy;
              return (
                <div key={sid} className={`flex items-center gap-3 px-4 py-3 border-b border-[#F4F6F9] last:border-b-0 ${isYou ? "bg-[#EFF9FB]" : ""}`}>
                  <Avatar member={m} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-600 text-[#0F172A] leading-snug">
                      {isYou ? "You" : m.name}
                      {isPayer && <span className="ml-1.5 text-[11px] font-600 text-[#0A86A0] bg-[#EFF9FB] border border-[#A3DFE9] px-1.5 py-0.5 rounded-full align-middle">Paid</span>}
                    </p>
                    {m.role === "guest" && <p className="text-[11px] text-[#94A3B8] font-500 mt-0.5">Guest</p>}
                  </div>
                  <p className={`num text-[14px] font-700 shrink-0 ${isYou ? "text-[#0A86A0]" : "text-[#0F172A]"}`}>
                    {fmt(Math.round(perPersonShare))}
                  </p>
                </div>
              );
            })}
            {inSplit && (
              <div className="px-4 py-3 bg-[#F8FAFC] border-t border-[#E1E7EF]">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] font-600 text-[#475569]">Your net impact</p>
                  <p className={`num text-[13px] font-700 ${payer?.isMe ? "text-[#15803D]" : "text-[#DC2626]"}`}>
                    {payer?.isMe
                      ? `+${fmt(Math.round(expense.amount - perPersonShare))} (you get back)`
                      : `−${fmt(Math.round(perPersonShare))} (you owe)`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          {expense.note && (
            <div className="bg-white mt-3 mx-4 rounded-[14px] border border-[#E1E7EF] overflow-hidden">
              <div className="flex items-start gap-3 px-4 py-3.5">
                <div className="w-7 h-7 rounded-[8px] bg-[#F1F5F9] flex items-center justify-center shrink-0 text-[#94A3B8] mt-0.5">
                  <IconNote size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">Note</p>
                  <p className="text-[14px] font-500 text-[#475569] leading-relaxed">{expense.note}</p>
                </div>
              </div>
            </div>
          )}

          {/* Added by */}
          <div className="px-4 mt-3">
            <p className="text-[12px] font-500 text-[#94A3B8] text-center">
              Added by {adder ? (adder.isMe ? "you" : adder.name) : "unknown"} · {expense.addedAt}
            </p>
          </div>
        </div>
      </div>

      {/* Overflow menu */}
      {showOverflow && (
        <ExpenseOverflowSheet
          canEdit={canEdit}
          onEdit={onEdit}
          onDelete={() => setShowDeleteConfirm(true)}
          onClose={() => setShowOverflow(false)}
        />
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <DeleteExpenseSheet
          expense={expense}
          onConfirm={onDelete}
          onClose={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
}