import type { Expense, Member } from "../../../domain/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { ReceiptIcon, PlusIcon } from "@hugeicons/core-free-icons";
import HomeExpenseRow from "./HomeExpenseRow";

export default function RecentExpenses({
  expenses,
  members,
  onViewAll,
  empty = false,
  onAddExpense,
}: {
  expenses: Expense[];
  members: Member[];
  onViewAll: () => void;
  empty?: boolean;
  onAddExpense?: () => void;
}) {
  if (empty) {
    return (
      <section className="px-4 pb-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-700 text-[#0F172A]">Recent expenses</h2>
        </div>
        <div className="bg-white rounded-[16px] border border-[#E1E7EF] px-5 py-8 flex flex-col items-center text-center">
          <div className="w-10 h-10 rounded-[12px] bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] mb-3">
            <HugeiconsIcon icon={ReceiptIcon} size={20} color="currentColor" strokeWidth={1.5} />
          </div>
          <p className="text-[14px] font-600 text-[#0F172A] mb-1">No expenses yet</p>
          <p className="text-[12px] text-[#94A3B8] font-500 leading-snug max-w-[220px]">
            Add your first expense to start tracking this trip.
          </p>
          {onAddExpense && (
            <button
              onClick={onAddExpense}
              className="pressable mt-3 inline-flex items-center gap-1.5 px-4 h-9 rounded-[10px] bg-[#0A86A0] text-white font-700 text-[13px] shadow-[0_2px_8px_rgba(10,134,160,0.18)] active:scale-[0.97] transition-all"
            >
              <HugeiconsIcon icon={PlusIcon} size={13} color="currentColor" strokeWidth={2.5} />
              Add expense
            </button>
          )}
        </div>
      </section>
    );
  }

  const recent = [...expenses]
    .sort((a, b) => b.dateIso.localeCompare(a.dateIso))
    .slice(0, 3);

  return (
    <section className="px-4 pb-1">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-700 text-[#0F172A]">Recent expenses</h2>
        <button onClick={onViewAll} className="text-[13px] font-600 text-[#0A86A0] pressable">
          See all
        </button>
      </div>
      <div className="bg-white rounded-[16px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
        {recent.map((expense) => (
          <HomeExpenseRow key={expense.id} expense={expense} members={members} />
        ))}
      </div>
    </section>
  );
}
