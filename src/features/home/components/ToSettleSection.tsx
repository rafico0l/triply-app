import type { Member, Expense, RecordedSettlement } from "../../../domain/types";
import { Avatar } from "../../../components/shared/Avatar";
import { fmt } from "../../../lib/format";
import { computeSuggestedPayments } from "../../settlements/settlementUtils";

export default function ToSettleSection({
  members,
  expenses,
  recordedSettlements,
  onViewAll,
}: {
  members: Member[];
  expenses: Expense[];
  recordedSettlements: RecordedSettlement[];
  onViewAll: () => void;
}) {
  const me = members.find((m) => m.isMe);
  const suggestedPayments = computeSuggestedPayments(members, expenses, recordedSettlements);
  const totalOwedToMe = suggestedPayments
    .filter((p) => p.to === me?.id)
    .reduce((s, p) => s + p.amount, 0);

  const rows = members
    .filter((m) => !m.isMe && m.balance < -1)
    .sort((a, b) => a.balance - b.balance)
    .slice(0, 2);

  if (suggestedPayments.length === 0) {
    return (
      <section className="px-4 pt-1 pb-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-700 text-[#0F172A]">To settle</h2>
        </div>
        <div className="bg-white rounded-[16px] border border-[#E1E7EF] px-5 py-5 flex items-center justify-center">
          <p className="text-[13px] text-[#94A3B8] font-500 text-center">All settled up</p>
        </div>
      </section>
    );
  }

  const credits = members
    .filter((m) => !m.isMe && m.balance > 1)
    .sort((a, b) => b.balance - a.balance);

  return (
    <section className="px-4 pt-1 pb-1">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-700 text-[#0F172A]">To settle</h2>
        <button onClick={onViewAll} className="text-[13px] font-600 text-[#0A86A0] pressable">
          See all
        </button>
      </div>
      <div className="bg-white rounded-[16px] border border-[#E1E7EF] overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F4F6F9]">
          <p className="text-[13px] font-600 text-[#475569]">
            {suggestedPayments.length} {suggestedPayments.length === 1 ? "payment" : "payments"} pending
          </p>
          {totalOwedToMe > 0 && (
            <p className="num text-[12px] text-[#15803D] font-500 mt-0.5">
              You're owed {fmt(totalOwedToMe)}
            </p>
          )}
        </div>
        {credits.map((member) => (
          <div key={member.id} className="flex items-center gap-3 px-4 py-3 border-b border-[#F4F6F9] last:border-b-0">
            <Avatar member={member} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-600 text-[#0F172A] truncate">{member.name}</p>
              <p className="text-[11px] text-[#94A3B8] font-500 mt-0.5">Owes you</p>
            </div>
            <span className="num text-[14px] font-700 text-[#15803D]">+{fmt(member.balance)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
