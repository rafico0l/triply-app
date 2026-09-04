import type { Expense } from "../../../domain/types";
import { fmt } from "../../../lib/format";
import Sheet from "../../../components/shared/Sheet";
import { IconTrash } from "../../../components/shared/icons";

export default function DeleteExpenseSheet({ expense, onConfirm, onClose }: {
  expense: Expense; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[#FFF5F5] text-[#DC2626] shrink-0">
            <IconTrash size={18} />
          </div>
          <div>
            <p className="text-[16px] font-700 text-[#0F172A] leading-snug">Delete expense?</p>
            <p className="text-[13px] font-500 text-[#94A3B8] mt-0.5 truncate max-w-[220px]">{expense.title}</p>
          </div>
        </div>
        <div className="bg-[#FFF5F5] border border-[#FECACA] rounded-[12px] px-4 py-3 mb-4">
          <p className="text-[13px] font-500 text-[#DC2626] leading-relaxed">
            This will remove <span className="font-700">{fmt(expense.amount)}</span> from the trip total and update balances for {expense.splitIds.length} {expense.splitIds.length === 1 ? "participant" : "participants"}.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="pressable flex-1 h-12 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-700 text-[15px]">Cancel</button>
          <button onClick={onConfirm} className="pressable flex-1 h-12 rounded-[13px] bg-[#DC2626] text-white font-700 text-[15px]">Delete</button>
        </div>
      </div>
    </Sheet>
  );
}