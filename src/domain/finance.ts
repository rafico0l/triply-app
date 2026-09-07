import type { Member, Expense, RecordedSettlement } from "./types";

/**
 * Integer minor units.
 *
 * For BDT: 1 ৳ = 100 poisha.
 *
 * All internal financial calculations use this representation so that
 * money never passes through floating-point arithmetic.
 */
export type MinorUnit = number;

export interface MemberFinancials {
  memberId: string;
  totalPaidMinor: MinorUnit;
  totalShareMinor: MinorUnit;
  settlementsPaidMinor: MinorUnit;
  settlementsReceivedMinor: MinorUnit;
  balanceMinor: MinorUnit;
}

export interface TripFinancials {
  totalSpentMinor: MinorUnit;
  memberFinancials: MemberFinancials[];
}

export interface BudgetStats {
  budgetMinor: MinorUnit;
  remainingMinor: MinorUnit;
  spentPercentage: number;
}

export interface SuggestedPayment {
  from: string;
  to: string;
  amountMinor: MinorUnit;
}

/**
 * Convert a display (major) amount to integer minor units.
 */
export function toMinorUnits(major: number): MinorUnit {
  return Math.round(major * 100);
}

/**
 * Convert integer minor units back to a display (major) amount.
 */
export function toMajorUnits(minor: MinorUnit): number {
  return minor / 100;
}

/**
 * Compute total spent across all expenses in minor units.
 */
export function computeTotalSpent(expenses: Expense[]): MinorUnit {
  return expenses.reduce((sum, e) => sum + toMinorUnits(e.amount), 0);
}

/**
 * Compute equal-split shares for a single expense.
 *
 * Distributes any remainder deterministically to the first participants
 * so that the sum of all participant shares always equals the expense
 * amount in minor units.
 */
export function computeExpenseShares(expense: Expense): Map<string, MinorUnit> {
  const totalMinor = toMinorUnits(expense.amount);
  const n = expense.splitIds.length;
  if (n === 0) return new Map();

  const baseMinor = Math.floor(totalMinor / n);
  const remainder = totalMinor % n;
  const shares = new Map<string, MinorUnit>();

  for (let i = 0; i < n; i++) {
    shares.set(expense.splitIds[i], baseMinor + (i < remainder ? 1 : 0));
  }

  return shares;
}

/**
 * Compute total amount paid by a member across all expenses (minor units).
 */
export function computeMemberPaid(memberId: string, expenses: Expense[]): MinorUnit {
  return expenses
    .filter((e) => e.paidBy === memberId)
    .reduce((sum, e) => sum + toMinorUnits(e.amount), 0);
}

/**
 * Compute total share for a member across all expenses (minor units).
 */
export function computeMemberShare(memberId: string, expenses: Expense[]): MinorUnit {
  return expenses
    .filter((e) => e.splitIds.includes(memberId))
    .reduce((sum, e) => {
      const shares = computeExpenseShares(e);
      return sum + (shares.get(memberId) ?? 0);
    }, 0);
}

/**
 * Compute full financials for a single member.
 *
 * Balance rule:
 *   balance = totalPaid - totalShare + settlementsPaid - settlementsReceived
 *
 * Positive balance  -> member should receive money.
 * Negative balance  -> member owes money.
 * Zero              -> settled.
 */
export function computeMemberFinancials(
  memberId: string,
  members: Member[],
  expenses: Expense[],
  recordedSettlements: RecordedSettlement[] = []
): MemberFinancials {
  const totalPaidMinor = computeMemberPaid(memberId, expenses);
  const totalShareMinor = computeMemberShare(memberId, expenses);
  const settlementsPaidMinor = recordedSettlements
    .filter((s) => s.from === memberId)
    .reduce((sum, s) => sum + toMinorUnits(s.amount), 0);
  const settlementsReceivedMinor = recordedSettlements
    .filter((s) => s.to === memberId)
    .reduce((sum, s) => sum + toMinorUnits(s.amount), 0);
  const balanceMinor =
    totalPaidMinor - totalShareMinor + settlementsPaidMinor - settlementsReceivedMinor;

  return {
    memberId,
    totalPaidMinor,
    totalShareMinor,
    settlementsPaidMinor,
    settlementsReceivedMinor,
    balanceMinor,
  };
}

/**
 * Compute financials for all members.
 */
export function computeAllMemberFinancials(
  members: Member[],
  expenses: Expense[],
  recordedSettlements: RecordedSettlement[] = []
): MemberFinancials[] {
  return members.map((m) => computeMemberFinancials(m.id, members, expenses, recordedSettlements));
}

/**
 * Compute trip-level financial totals.
 */
export function computeTripFinancials(
  members: Member[],
  expenses: Expense[],
  recordedSettlements: RecordedSettlement[] = []
): TripFinancials {
  return {
    totalSpentMinor: computeTotalSpent(expenses),
    memberFinancials: computeAllMemberFinancials(members, expenses, recordedSettlements),
  };
}

/**
 * Compute budget statistics.
 *
 * Returns null when no budget is set or the budget is non-positive,
 * representing a pay-as-you-go trip.
 */
export function computeBudgetStats(
  totalSpentMinor: MinorUnit,
  budgetMinor: MinorUnit | null | undefined
): BudgetStats | null {
  if (budgetMinor == null || budgetMinor === undefined || budgetMinor <= 0) return null;

  const remainingMinor = Math.max(budgetMinor - totalSpentMinor, 0);
  const spentPercentage = Math.min(Math.round((totalSpentMinor / budgetMinor) * 100), 100);

  return {
    budgetMinor,
    remainingMinor,
    spentPercentage,
  };
}

/**
 * Compute suggested settlement payments to zero out balances.
 *
 * Consumes derived member financials, not raw Member.balance.
 *
 * Suggested payments reduce outstanding balances without changing
 * expense totals.
 */
export function computeSuggestedPayments(
  members: Member[],
  expenses: Expense[],
  recordedSettlements: RecordedSettlement[] = []
): SuggestedPayment[] {
  const financials = computeAllMemberFinancials(members, expenses, recordedSettlements);
  const payments: SuggestedPayment[] = [];

  const creds = financials
    .filter((f) => f.balanceMinor > 100)
    .sort((a, b) => b.balanceMinor - a.balanceMinor)
    .map((f) => ({ id: f.memberId, bal: f.balanceMinor }));

  const debts = financials
    .filter((f) => f.balanceMinor < -100)
    .sort((a, b) => a.balanceMinor - b.balanceMinor)
    .map((f) => ({ id: f.memberId, bal: f.balanceMinor }));

  let ci = 0;
  let di = 0;
  while (ci < creds.length && di < debts.length) {
    const amount = Math.min(creds[ci].bal, -debts[di].bal);
    if (amount >= 100) {
      payments.push({ from: debts[di].id, to: creds[ci].id, amountMinor: amount });
    }
    creds[ci].bal -= amount;
    debts[di].bal += amount;
    if (creds[ci].bal < 100) ci++;
    if (debts[di].bal > -100) di++;
  }

  return payments;
}
