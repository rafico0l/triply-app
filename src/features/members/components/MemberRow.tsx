import Avatar from "../../../components/shared/Avatar";
import { fmt } from "../../../lib/format";
import type { Member, Expense } from "../../../domain/types";

export function MemberRowCompact({ member }: { member: Member }) {
  const isOwed  = member.balance > 0;
  const isEven  = member.balance === 0;
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Avatar member={member} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-600 text-[#0F172A] leading-snug truncate">{member.isMe ? "You" : member.name}</p>
      </div>
      <div className="text-right shrink-0">
        {isEven
          ? <span className="text-[13px] font-600 text-[#94A3B8]">Settled</span>
          : <>
              <p className={`num text-[14px] font-700 ${isOwed ? "text-[#15803D]" : "text-[#DC2626]"}`}>
                {isOwed ? "+" : "−"}{fmt(member.balance)}
              </p>
              <p className="text-[11px] text-[#94A3B8] font-500 mt-0.5">{isOwed ? "gets back" : "owes"}</p>
            </>
        }
      </div>
    </div>
  );
}

export function MemberRow({
  member, expenses, onTap,
}: {
  member: Member; expenses: Expense[]; onTap?: () => void;
}) {
  const isOwed    = member.balance > 0;
  const isEven    = member.balance === 0;
  const isGuest   = member.role === "guest";
  const isOwner   = member.role === "owner";
  const shareAmt  = Math.round(expenses.filter((e) => e.splitIds.includes(member.id)).reduce((s, e) => s + e.amount / e.splitIds.length, 0));

  let roleLabel = "";
  if (isOwner && member.isMe) roleLabel = "Owner · You";
  else if (isOwner)          roleLabel = "Owner";
  else if (member.isMe)      roleLabel = "You";
  else if (isGuest)          roleLabel = "Guest";
  else                       roleLabel = "Member";

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${onTap ? "pressable cursor-pointer" : ""}`}
      onClick={onTap}
    >
      <Avatar member={member} size="md" />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-600 text-[#0F172A] leading-snug truncate">{member.isMe ? "Rafi" : member.name}</p>
        <p className="text-[12px] text-[#94A3B8] font-500 mt-0.5 leading-none">{roleLabel}</p>
        <p className="num text-[11px] text-[#94A3B8] font-500 mt-1 leading-none">
          Paid {fmt(member.paid)} · Share {fmt(shareAmt)}
        </p>
      </div>
      <div className="text-right shrink-0 ml-2">
        {isEven ? (
          <span className="text-[13px] font-600 text-[#94A3B8]">Settled</span>
        ) : (
          <div>
            <p className={`num text-[13px] font-700 ${isOwed ? "text-[#15803D]" : "text-[#DC2626]"}`}>
              {isOwed ? "Receive" : "Owes"}
            </p>
            <p className={`num text-[14px] font-700 ${isOwed ? "text-[#15803D]" : "text-[#DC2626]"}`}>
              {fmt(member.balance)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MemberRow;
