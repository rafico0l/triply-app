import { useState } from "react";
import type { Expense, Member } from "../../domain/types";
import { fmt } from "../../lib/format";
import CATEGORY_META from "../../lib/categoryMeta";
import Sheet from "../../components/shared/Sheet";
import EmptyState from "../../components/shared/EmptyState";
import { IconSearch, IconX, IconChevronRight, IconCheck, IconReceipt } from "../../components/shared/icons";
import ExpenseRow from "./components/ExpenseRow";

type ExpenseFilter = "all" | "i-paid" | "my-expenses";

export default function ExpensesView({
  expenses, members, onTapExpense,
}: {
  expenses: Expense[]; members: Member[]; onTapExpense: (id: string) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<ExpenseFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const me = members.find((m) => m.isMe);
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  const filterTabs: { id: ExpenseFilter; label: string }[] = [
    { id: "all",         label: "All"          },
    { id: "i-paid",      label: "I paid"       },
    { id: "my-expenses", label: "My expenses"  },
  ];

  const filtered = expenses.filter((e) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const payer = members.find((m) => m.id === e.paidBy);
      const matchTitle = e.title.toLowerCase().includes(q);
      const matchPayer = payer?.name.toLowerCase().includes(q) ?? false;
      const matchCat   = CATEGORY_META[e.category].label.toLowerCase().includes(q);
      if (!matchTitle && !matchPayer && !matchCat) return false;
    }
    if (filter === "i-paid"      && e.paidBy !== me?.id)             return false;
    if (filter === "my-expenses" && !e.splitIds.includes(me?.id ?? "")) return false;
    if (categoryFilter && e.category !== categoryFilter)              return false;
    return true;
  });

  // Group by date, sorted newest first
  const uniqueDates = [...new Set(filtered.map((e) => e.dateIso))].sort((a, b) => b.localeCompare(a));
  const grouped = uniqueDates.map((iso) => ({
    iso,
    label: new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    items: filtered.filter((e) => e.dateIso === iso),
  }));

  const hasActiveFilters = filter !== "all" || !!categoryFilter || !!searchQuery;
  const catLabel = categoryFilter ? CATEGORY_META[categoryFilter as Expense["category"]]?.label : null;

  return (
    <div>
      {/* Sticky filter bar */}
      <div className="sticky top-0 bg-white border-b border-[#E1E7EF] z-10">
        {/* Search */}
        <div className="px-4 pt-3 pb-2.5">
          <div className="flex items-center gap-2.5 bg-[#F4F6F9] rounded-[11px] px-3 h-9 border border-[#E1E7EF] focus-within:border-[#0A86A0] focus-within:bg-white transition-colors">
            <span className="text-[#94A3B8] shrink-0"><IconSearch size={15} /></span>
            <input
              type="text"
              placeholder="Search expenses…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-[13px] font-500 text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="pressable text-[#94A3B8] shrink-0">
                <IconX size={14} />
              </button>
            )}
          </div>
        </div>
        {/* Filter chips */}
        <div className="flex items-center gap-1.5 px-4 pb-2.5 overflow-x-auto scrollbar-none">
          {filterTabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`pressable shrink-0 px-3 py-1.5 rounded-full text-[12px] font-600 transition-colors ${
                filter === t.id ? "bg-[#0A86A0] text-white" : "bg-[#F4F6F9] text-[#475569]"
              }`}
            >
              {t.label}
            </button>
          ))}
          <div className="w-px h-5 bg-[#E1E7EF] shrink-0 mx-0.5" />
          {/* Category chip */}
          <button
            onClick={() => setShowCategorySheet(true)}
            className={`pressable shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] font-600 transition-colors ${
              categoryFilter ? "bg-[#EFF9FB] text-[#0A7490] border border-[#A3DFE9]" : "bg-[#F4F6F9] text-[#475569]"
            }`}
          >
            {catLabel ? (
              <>
                <span>{catLabel}</span>
                <span
                  className="pressable"
                  onClick={(e) => { e.stopPropagation(); setCategoryFilter(null); }}
                >
                  <IconX size={12} />
                </span>
              </>
            ) : (
              <>Category <IconChevronRight size={12} /></>
            )}
          </button>
          <div className="flex-1 min-w-[8px]" />
          <span className="num shrink-0 text-[12px] font-500 text-[#94A3B8]">
            {fmt(total)}
          </span>
        </div>
      </div>

      {/* Expense count summary */}
      {filtered.length > 0 && (
        <div className="px-5 pt-3 pb-1">
          <p className="text-[12px] font-500 text-[#94A3B8]">
            {filtered.length} {filtered.length === 1 ? "expense" : "expenses"}
            {hasActiveFilters && " match your filter"}
          </p>
        </div>
      )}

      {/* Grouped expenses */}
      {grouped.length > 0 ? (
        <div className="px-4 pt-2 pb-4 space-y-4">
          {grouped.map(({ iso, label, items }) => (
            <div key={iso}>
              <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-1 mb-1.5">{label}</p>
              <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
                {items.map((e) => (
                  <ExpenseRow key={e.id} expense={e} members={members} onTap={() => onTapExpense(e.id)} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<IconReceipt size={32} />}
          title={searchQuery ? "No matches" : hasActiveFilters ? "No expenses here" : "No expenses yet"}
          body={
            searchQuery
              ? `No expenses match "${searchQuery}". Try a different search.`
              : hasActiveFilters
              ? "No expenses match the selected filter."
              : "Tap '+ Add Expense' to record your first shared expense."
          }
        />
      )}

      {/* Category picker sheet */}
      {showCategorySheet && (
        <Sheet onClose={() => setShowCategorySheet(false)}>
          <div className="px-5 pt-3 pb-2 flex items-center justify-between">
            <h2 className="text-[17px] font-700 text-[#0F172A]">Filter by category</h2>
            <button onClick={() => setShowCategorySheet(false)} className="pressable text-[14px] font-600 text-[#94A3B8]">Done</button>
          </div>
          <div className="px-3 py-2 space-y-0.5 pb-6">
            {(Object.keys(CATEGORY_META) as Expense["category"][]).map((key) => {
              const cat = CATEGORY_META[key];
              const isSelected = categoryFilter === key;
              return (
                <button
                  key={key}
                  onClick={() => { setCategoryFilter(isSelected ? null : key); setShowCategorySheet(false); }}
                  className={`pressable w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-left transition-colors ${isSelected ? "bg-[#EFF9FB]" : "hover:bg-[#F4F6F9]"}`}
                >
                  <div className="w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0" style={{ backgroundColor: cat.bg, color: cat.fg }}>
                    {cat.icon}
                  </div>
                  <span className={`text-[15px] font-600 ${isSelected ? "text-[#0A86A0]" : "text-[#0F172A]"}`}>{cat.label}</span>
                  {isSelected && <span className="ml-auto text-[#0A86A0]"><IconCheck size={16} /></span>}
                </button>
              );
            })}
          </div>
        </Sheet>
      )}
    </div>
  );
}