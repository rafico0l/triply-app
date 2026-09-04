import type { Expense, Member } from "../../../domain/types";
import { fmt } from "../../../lib/format";
import CATEGORY_META from "../../../lib/categoryMeta";

export default function HomeExpenseRow({ expense, members }: { expense: Expense; members: Member[] }) {
  const payer = members.find((m) => m.id === expense.paidBy);
  const me = members.find((m) => m.isMe);
  const inSplit = me ? expense.splitIds.includes(me.id) : false;
  const myShare = inSplit ? Math.round(expense.amount / expense.splitIds.length) : 0;
  const isMe = payer?.isMe;
  const cat = CATEGORY_META[expense.category];

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div
        className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
        style={{ backgroundColor: cat.bg, color: cat.fg }}
      >
        {cat.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-600 text-[#0F172A] truncate leading-snug">{expense.title}</p>
        <p className="text-[12px] text-[#94A3B8] font-500 mt-0.5 leading-snug">
          {isMe ? "You paid" : payer ? `${payer.name.split(" ")[0]} paid` : "Unknown"}
          {inSplit && ` · Your share ${fmt(myShare)}`}
        </p>
      </div>
      <span className="num text-[14px] font-700 text-[#0F172A] shrink-0">{fmt(expense.amount)}</span>
    </div>
  );
}
