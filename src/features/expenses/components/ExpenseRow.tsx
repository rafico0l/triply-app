import type { Expense, Member } from "../../../domain/types";
import { fmt } from "../../../lib/format";
import CATEGORY_META from "../../../lib/categoryMeta";
import { IconAlertCircle } from "../../../components/shared/icons";

export default function ExpenseRow({
  expense, members, onTap,
}: {
  expense: Expense; members: Member[]; onTap?: () => void;
}) {
  const payer = members.find((m) => m.id === expense.paidBy);
  const cat = CATEGORY_META[expense.category];
  const me = members.find((m) => m.isMe);
  const inSplit = me ? expense.splitIds.includes(me.id) : false;
  const myShare = inSplit ? Math.round(expense.amount / expense.splitIds.length) : 0;
  const isMe = payer?.isMe;

  return (
    <div className={`flex items-start gap-3 px-4 py-3.5 ${onTap ? "pressable cursor-pointer" : ""}`} onClick={onTap}>
      <div className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: cat.bg, color: cat.fg }}>
        {cat.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-600 text-[#0F172A] truncate leading-snug">{expense.title}</p>
        <p className="text-[12px] text-[#94A3B8] font-500 mt-0.5 leading-snug">
          {isMe ? "You paid" : payer ? `${payer.name.split(" ")[0]} paid` : "Unknown"} · {expense.date}
        </p>
        {expense.syncStatus === "pending" && (
          <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-600 text-[#B45309]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] shrink-0" />
            Pending sync
          </span>
        )}
        {expense.syncStatus === "failed" && (
          <span className="inline-flex items-center gap-1 mt-1 text-[11px] font-600 text-[#DC2626]">
            <IconAlertCircle size={11} />
            Sync failed
          </span>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className="num text-[14px] font-700 text-[#0F172A]">{fmt(expense.amount)}</p>
        {inSplit && <p className="num text-[11px] text-[#94A3B8] font-500 mt-0.5">your {fmt(myShare)}</p>}
      </div>
    </div>
  );
}