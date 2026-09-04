import type { Expense, RecordedSettlement } from "../../domain/types";

export function hasMemberFinancialHistory(id: string, expenses: Expense[], recordedSettlements: RecordedSettlement[]): boolean {
  return (
    expenses.some((e) => e.paidBy === id || e.splitIds.includes(id)) ||
    recordedSettlements.some((s) => s.from === id || s.to === id)
  );
}
