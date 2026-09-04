import { useState } from "react";
import Avatar from "../../components/shared/Avatar";
import { fmt } from "../../lib/format";
import type { Member, Expense, RecordedSettlement } from "../../domain/types";
import { hasMemberFinancialHistory } from "./memberUtils";
import MemberOverflowSheet from "./components/MemberOverflowSheet";
import RemoveMemberBlockedSheet from "./components/RemoveMemberBlockedSheet";
import RemoveMemberConfirmSheet from "./components/RemoveMemberConfirmSheet";
import EditNameSheet from "./components/EditNameSheet";
import Badge from "../../components/shared/Badge";
import { IconChevronLeft, IconDotsV, IconArrowRight, IconCheck } from "../../components/shared/icons";
import CATEGORY_META from "../../lib/categoryMeta";

export default function MemberDetails({
  member, allMembers, allExpenses, recordedSettlements, me, isCurrentUserOwner,
  onBack, onSetMembers, onRemove,
}: {
  member: Member; allMembers: Member[]; allExpenses: Expense[]; recordedSettlements: RecordedSettlement[];
  me: Member | undefined; isCurrentUserOwner: boolean;
  onBack: () => void; onSetMembers: (m: Member[]) => void; onRemove: () => void;
}) {
  const [showOverflow,       setShowOverflow]       = useState(false);
  const [showEditName,       setShowEditName]       = useState(false);
  const [showRemoveBlocked,  setShowRemoveBlocked]  = useState(false);
  const [showRemoveConfirm,  setShowRemoveConfirm]  = useState(false);

  const isMe      = member.isMe;
  const isGuest   = member.role === "guest";
  const isOwner   = member.role === "owner";
  const shareAmt  = Math.round(allExpenses.filter((e) => e.splitIds.includes(member.id)).reduce((s, e) => s + e.amount / e.splitIds.length, 0));

  const memberExpenses     = allExpenses.filter((e) => e.paidBy === member.id || e.splitIds.includes(member.id));
  const memberSettlements  = recordedSettlements.filter((s) => s.from === member.id || s.to === member.id);

  const balancePositive = member.balance > 2;
  const balanceZero     = Math.abs(member.balance) <= 2;
  const balanceColor    = balanceZero ? "#94A3B8" : balancePositive ? "#15803D" : "#DC2626";

  let balanceExplanation = "";
  if (balanceZero) {
    balanceExplanation = `${isMe ? "You are" : `${member.name.split(" ")[0]} is`} fully settled.`;
  } else if (balancePositive) {
    balanceExplanation = `${isMe ? "You paid" : `${member.name.split(" ")[0]} paid`} more than their fair share and should receive ${fmt(member.balance)} back from the group.`;
  } else {
    balanceExplanation = `${isMe ? "You owe" : `${member.name.split(" ")[0]} owes`} ${fmt(Math.abs(member.balance))} to the group — their share of expenses exceeds what they've paid.`;
  }

  function handleRemoveTapped() {
    if (isOwner) return;
    if (hasMemberFinancialHistory(member.id, allExpenses, recordedSettlements)) {
      setShowRemoveBlocked(true);
    } else {
      setShowRemoveConfirm(true);
    }
  }

  const removedBlockedReason = (() => {
    const paidExpenses = allExpenses.filter((e) => e.paidBy === member.id);
    const splitExpenses = allExpenses.filter((e) => e.splitIds.includes(member.id));
    const parts: string[] = [];
    if (paidExpenses.length > 0) parts.push(`paid for ${paidExpenses.length} expense${paidExpenses.length > 1 ? "s" : ""}`);
    if (splitExpenses.length > 0 && splitExpenses.length !== paidExpenses.length) parts.push(`is in ${splitExpenses.length} expense split${splitExpenses.length > 1 ? "s" : ""}`);
    if (memberSettlements.length > 0) parts.push(`has ${memberSettlements.length} settlement${memberSettlements.length > 1 ? "s" : ""}`);
    const nameFirst = member.name.split(" ")[0];
    return `${nameFirst} has ${parts.join(" and ")}. Removing them would break the financial record for this tour.`;
  })();

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F6F9] flex flex-col overflow-hidden" style={{ animation: "slideInFromRight 220ms cubic-bezier(0.32,0.72,0,1)" }}>
      <div className="bg-white border-b border-[#E1E7EF] safe-top shrink-0">
        <div className="flex items-center gap-1 px-2 h-[52px] max-w-[720px] mx-auto w-full">
          <button onClick={onBack} className="pressable w-10 h-10 flex items-center justify-center rounded-full text-[#475569]" aria-label="Go back">
            <IconChevronLeft size={22} />
          </button>
          <h1 className="flex-1 text-[16px] font-700 text-[#0F172A] truncate px-1">Member detail</h1>
          {isCurrentUserOwner && !isMe && (
            <button onClick={() => setShowOverflow(true)} className="pressable w-10 h-10 flex items-center justify-center rounded-full text-[#475569]" aria-label="More options">
              <IconDotsV size={18} />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto w-full pb-8">
          <div className="bg-white px-5 pt-6 pb-5 border-b border-[#E1E7EF]">
            <div className="flex items-center gap-4">
              <Avatar member={member} size="xl" />
              <div className="flex-1 min-w-0">
                <p className="text-[20px] font-800 text-[#0F172A] leading-tight">{isMe ? "Rafi" : member.name}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {isOwner && <Badge label="Owner" variant="brand" />}
                  {isMe    && <Badge label="You" variant="neutral" />}
                  {isGuest && <Badge label="Guest" variant="neutral" />}
                  {!isOwner && !isGuest && !isMe && <Badge label="Member" variant="neutral" />}
                </div>
                {isGuest && (
                  <p className="text-[12px] font-500 text-[#94A3B8] mt-2 leading-snug">
                    Participates in expenses but hasn't joined Triply yet.
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white mt-3 mx-4 rounded-[14px] border border-[#E1E7EF] overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-[#F1F5F9]">
              <div className="px-3 py-3 text-center">
                <p className="text-[10px] font-700 text-[#94A3B8] uppercase tracking-wide mb-1">Paid</p>
                <p className="num text-[16px] font-700 text-[#0F172A] leading-snug">{fmt(member.paid)}</p>
              </div>
              <div className="px-3 py-3 text-center">
                <p className="text-[10px] font-700 text-[#94A3B8] uppercase tracking-wide mb-1">Share</p>
                <p className="num text-[16px] font-700 text-[#0F172A] leading-snug">{fmt(shareAmt)}</p>
              </div>
              <div className="px-3 py-3 text-center">
                <p className="text-[10px] font-700 text-[#94A3B8] uppercase tracking-wide mb-1">Balance</p>
                <p className="num text-[16px] font-700 leading-snug" style={{ color: balanceColor }}>
                  {balanceZero ? "Settled" : `${balancePositive ? "+" : "−"}${fmt(member.balance)}`}
                </p>
              </div>
            </div>
            <div className="px-4 py-3 border-t border-[#F1F5F9] bg-[#F8FAFC]">
              <p className="text-[12px] font-500 text-[#475569] leading-relaxed">{balanceExplanation}</p>
            </div>
          </div>

          {memberExpenses.length > 0 ? (
            <div className="mt-3">
              <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-5 mb-2">Expense activity</p>
              <div className="bg-white mx-4 rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
                {memberExpenses.slice(0, 8).map((e) => {
                  const cat = CATEGORY_META[e.category];
                  const isPayer = e.paidBy === member.id;
                  const inSplit = e.splitIds.includes(member.id);
                  const share = inSplit ? Math.round(e.amount / e.splitIds.length) : 0;
                  return (
                    <div key={e.id} className="flex items-start gap-3 px-4 py-3">
                      <div className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: cat.bg, color: cat.fg }}>
                        <div style={{ transform: "scale(0.9)" }}>{cat.icon}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-600 text-[#0F172A] truncate leading-snug">{e.title}</p>
                        <p className="text-[11px] font-500 text-[#94A3B8] mt-0.5">
                          {e.date}
                          {isPayer && inSplit && " · Paid & split"}
                          {isPayer && !inSplit && " · Paid"}
                          {!isPayer && inSplit && ` · Split with ${e.splitIds.length - 1} others`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        {isPayer && <p className="num text-[13px] font-700 text-[#0F172A]">{fmt(e.amount)}</p>}
                        {inSplit && <p className="num text-[11px] font-500 text-[#94A3B8] mt-0.5">share {fmt(share)}</p>}
                      </div>
                    </div>
                  );
                })}
                {memberExpenses.length > 8 && (
                  <div className="px-4 py-3 text-center">
                    <p className="text-[12px] font-500 text-[#94A3B8]">+{memberExpenses.length - 8} more expenses</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-3 mx-4 bg-white rounded-[14px] border border-[#E1E7EF] px-4 py-4">
              <p className="text-[13px] font-500 text-[#94A3B8] text-center">No expense activity yet.</p>
            </div>
          )}

          {memberSettlements.length > 0 && (
            <div className="mt-3">
              <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-5 mb-2">Settlements</p>
              <div className="bg-white mx-4 rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
                {memberSettlements.map((s) => {
                  const from     = allMembers.find((m) => m.id === s.from);
                  const to       = allMembers.find((m) => m.id === s.to);
                  const isFromMe = s.from === member.id;
                  return (
                    <div key={s.id} className="flex items-start gap-3 px-4 py-3">
                      <div className="flex items-center gap-1 shrink-0 mt-0.5">
                        {from && <Avatar member={from} size="sm" />}
                        <span className="text-[#C9D4DF] mx-1"><IconArrowRight size={12} /></span>
                        {to && <Avatar member={to} size="sm" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-600 text-[#0F172A] truncate">
                          {from?.isMe ? "You" : from?.name.split(" ")[0]} paid {to?.isMe ? "you" : to?.name.split(" ")[0]}
                        </p>
                        {s.date && <p className="text-[11px] font-500 text-[#94A3B8] mt-0.5">{s.date}</p>}
                      </div>
                      <p className={`num text-[14px] font-700 shrink-0 ${isFromMe ? "text-[#DC2626]" : "text-[#15803D]"}`}>
                        {isFromMe ? "−" : "+"}{fmt(s.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {showOverflow && (
        <MemberOverflowSheet
          member={member}
          canEditName={isGuest}
          onEditName={() => setShowEditName(true)}
          onRemove={handleRemoveTapped}
          onClose={() => setShowOverflow(false)}
        />
      )}

      {showEditName && (
        <EditNameSheet
          member={member}
          onSave={(name) => {
            const initials = name.split(" ").map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 2);
            onSetMembers(allMembers.map((m) => m.id === member.id ? { ...m, name, initials } : m));
            setShowEditName(false);
          }}
          onClose={() => setShowEditName(false)}
        />
      )}

      {showRemoveBlocked && (
        <RemoveMemberBlockedSheet
          member={member}
          reason={removedBlockedReason}
          onClose={() => setShowRemoveBlocked(false)}
        />
      )}

      {showRemoveConfirm && (
        <RemoveMemberConfirmSheet
          member={member}
          onConfirm={() => { onRemove(); setShowRemoveConfirm(false); }}
          onClose={() => setShowRemoveConfirm(false)}
        />
      )}
    </div>
  );
}
