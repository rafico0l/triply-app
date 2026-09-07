import type { Member, Expense, RecordedSettlement } from "../../domain/types";
import { computeSuggestedPayments as computeEngineSuggestedPayments, toMajorUnits } from "../../domain/finance";

export interface SuggestedPayment {
  from: string;
  to: string;
  amount: number;
}

export function computeSuggestedPayments(
  members: Member[],
  expenses: Expense[] = [],
  recordedSettlements: RecordedSettlement[] = []
): SuggestedPayment[] {
  const payments = computeEngineSuggestedPayments(members, expenses, recordedSettlements);
  return payments.map((p) => ({
    from: p.from,
    to: p.to,
    amount: toMajorUnits(p.amountMinor),
  }));
}
