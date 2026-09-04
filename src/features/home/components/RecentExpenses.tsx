import type { Expense, Member } from "../../../domain/types";
import HomeExpenseRow from "./HomeExpenseRow";

export default function RecentExpenses({ expenses, members, onViewAll, empty = false, onAddExpense }: {
  expenses: Expense[]; members: Member[]; onViewAll: () => void; empty?: boolean; onAddExpense?: () => void;
}) {
  if (empty) {
    return (
      <section className="px-4 pb-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[14px] font-700 text-[#0F172A]">Recent expenses</h2>
        </div>
        <div className="bg-white rounded-[16px] border border-[#E1E7EF] px-5 py-6 flex flex-col items-center text-center gap-3">
          <div>
            <p className="text-[14px] font-700 text-[#0F172A] mb-1">No expenses yet</p>
            <p className="text-[13px] text-[#94A3B8] font-500 leading-relaxed max-w-[220px]">Add your first expense to start tracking the trip.</p>
          </div>
          <button onClick={onAddExpense} className="pressable flex items-center gap-1.5 px-4 h-9 rounded-full bg-[#0A86A0] text-white font-700 text-[13px] shadow-[0_2px_8px_rgba(10,134,160,0.18)]">
            <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Add expense
          </button>
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
