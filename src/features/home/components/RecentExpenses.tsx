import type { Expense, Member } from "../../../domain/types";
import HomeExpenseRow from "./HomeExpenseRow";

export default function RecentExpenses({ expenses, members, onViewAll, empty = false, onAddExpense }: {
  expenses: Expense[]; members: Member[]; onViewAll: () => void; empty?: boolean; onAddExpense?: () => void;
}) {
  if (empty) {
    return (
      <section className="px-4 pb-1">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[14px] font-700 text-[#0F172A]">Recent expenses</h2>
        </div>
        <div className="bg-white rounded-[14px] border border-[#E1E7EF] px-4 py-4 text-center">
          <p className="text-[13px] font-600 text-[#64748B]">No expenses yet</p>
          <p className="text-[12px] text-[#94A3B8] font-500 mt-1">Your first expense will appear here.</p>
        </div>
      </section>
    );
  }
  const recent = expenses.slice(0, 3);
  return (
    <section className="px-4 pb-1">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-700 text-[#0F172A]">Recent expenses</h2>
        <button onClick={onViewAll} className="text-[13px] font-600 text-[#0A86A0] pressable">See all</button>
      </div>
      <div className="bg-white rounded-[16px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
        {recent.map((expense) => <HomeExpenseRow key={expense.id} expense={expense} members={members} />)}
      </div>
    </section>
  );
}
