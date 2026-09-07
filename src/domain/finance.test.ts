import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  toMinorUnits,
  toMajorUnits,
  computeTotalSpent,
  computeExpenseShares,
  computeMemberPaid,
  computeMemberShare,
  computeMemberFinancials,
  computeAllMemberFinancials,
  computeTripFinancials,
  computeBudgetStats,
  computeSuggestedPayments,
} from "./finance";
import type { Member, Expense, RecordedSettlement } from "./types";

const m = (id: string, name: string): Member => ({
  id,
  name,
  initials: "",
  color: "",
  balance: 0,
  paid: 0,
});

const e = (id: string, amount: number, paidBy: string, splitIds: string[]): Expense => ({
  id,
  title: "",
  amount,
  category: "other",
  paidBy,
  splitIds,
  date: "",
  dateIso: "",
  addedBy: "",
  addedAt: "",
});

const s = (id: string, from: string, to: string, amount: number): RecordedSettlement => ({
  id,
  from,
  to,
  amount,
  date: "",
  dateIso: "",
  recordedBy: "",
});

describe("toMinorUnits / toMajorUnits", () => {
  it("converts whole taka to minor units", () => {
    assert.strictEqual(toMinorUnits(100), 10000);
  });

  it("converts decimal taka to minor units", () => {
    assert.strictEqual(toMinorUnits(1250.5), 125050);
  });

  it("rounds fractional poisha", () => {
    assert.strictEqual(toMinorUnits(0.001), 0);
    assert.strictEqual(toMinorUnits(0.004), 0);
    assert.strictEqual(toMinorUnits(0.005), 1);
  });

  it("converts minor units back to major units", () => {
    assert.strictEqual(toMajorUnits(10000), 100);
    assert.strictEqual(toMajorUnits(125050), 1250.5);
  });

  it("round-trips cleanly", () => {
    assert.strictEqual(toMajorUnits(toMinorUnits(1234.56)), 1234.56);
  });

  it("handles zero", () => {
    assert.strictEqual(toMinorUnits(0), 0);
    assert.strictEqual(toMajorUnits(0), 0);
  });
});

describe("computeTotalSpent", () => {
  it("sums expense amounts in minor units", () => {
    const expenses = [e("1", 100, "1", ["1", "2"]), e("2", 200, "2", ["1", "2"])];
    assert.strictEqual(computeTotalSpent(expenses), toMinorUnits(300));
  });

  it("returns 0 for empty array", () => {
    assert.strictEqual(computeTotalSpent([]), 0);
  });
});

describe("computeExpenseShares", () => {
  it("splits equally among participants", () => {
    const expense = e("1", 100, "1", ["1", "2", "3"]);
    const shares = computeExpenseShares(expense);
    // 10000 minor / 3 = 3333 base, remainder 1
    assert.strictEqual(shares.get("1"), 3334);
    assert.strictEqual(shares.get("2"), 3333);
    assert.strictEqual(shares.get("3"), 3333);
  });

  it("sum of shares always equals expense amount", () => {
    const expense = e("1", 100, "1", ["1", "2", "3"]);
    const shares = computeExpenseShares(expense);
    assert.strictEqual(
      [...shares.values()].reduce((a: number, b: number) => a + b, 0),
      toMinorUnits(100)
    );
  });

  it("payer is not automatically a participant", () => {
    const expense = e("1", 100, "1", ["2", "3"]);
    const shares = computeExpenseShares(expense);
    assert.strictEqual(shares.get("1"), undefined);
    assert.strictEqual(shares.get("2"), 5000);
    assert.strictEqual(shares.get("3"), 5000);
  });

  it("handles single participant", () => {
    const expense = e("1", 100, "1", ["1"]);
    const shares = computeExpenseShares(expense);
    assert.strictEqual(shares.get("1"), toMinorUnits(100));
  });

  it("handles remainder deterministically", () => {
    // 100 minor units (1 taka) split 3 ways: 34 + 33 + 33 = 100
    const expense = e("1", 1, "1", ["1", "2", "3"]);
    const shares = computeExpenseShares(expense);
    assert.strictEqual(shares.get("1"), 34);
    assert.strictEqual(shares.get("2"), 33);
    assert.strictEqual(shares.get("3"), 33);
    assert.strictEqual([...shares.values()].reduce((a: number, b: number) => a + b, 0), 100);
  });

  it("handles zero amount", () => {
    const expense = e("1", 0, "1", ["1", "2"]);
    const shares = computeExpenseShares(expense);
    assert.strictEqual(shares.get("1"), 0);
    assert.strictEqual(shares.get("2"), 0);
  });

  it("returns empty map for no participants", () => {
    const expense = e("1", 100, "1", []);
    const shares = computeExpenseShares(expense);
    assert.strictEqual(shares.size, 0);
  });
});

describe("computeMemberPaid", () => {
  it("sums amounts paid by member", () => {
    const expenses = [e("1", 100, "1", ["1", "2"]), e("2", 200, "1", ["1", "2"])];
    assert.strictEqual(computeMemberPaid("1", expenses), toMinorUnits(300));
    assert.strictEqual(computeMemberPaid("2", expenses), 0);
  });

  it("returns 0 when member never paid", () => {
    const expenses = [e("1", 100, "2", ["1", "2"])];
    assert.strictEqual(computeMemberPaid("1", expenses), 0);
  });
});

describe("computeMemberShare", () => {
  it("sums share amounts for member", () => {
    const expenses = [e("1", 100, "1", ["1", "2"]), e("2", 200, "1", ["1", "2"])];
    // 100/2 = 50 each, 200/2 = 100 each
    assert.strictEqual(computeMemberShare("1", expenses), toMinorUnits(150));
    assert.strictEqual(computeMemberShare("2", expenses), toMinorUnits(150));
  });

  it("member participates but never pays", () => {
    const expenses = [e("1", 100, "1", ["1", "2"])];
    assert.strictEqual(computeMemberPaid("2", expenses), 0);
    assert.strictEqual(computeMemberShare("2", expenses), toMinorUnits(50));
  });

  it("member pays but does not participate", () => {
    const expenses = [e("1", 100, "1", ["2"])];
    assert.strictEqual(computeMemberPaid("1", expenses), toMinorUnits(100));
    assert.strictEqual(computeMemberShare("1", expenses), 0);
  });

  it("ignores member not in split", () => {
    const expenses = [e("1", 100, "1", ["2", "3"])];
    assert.strictEqual(computeMemberShare("1", expenses), 0);
  });
});

describe("computeMemberFinancials", () => {
  it("computes balance correctly with no settlements", () => {
    const members = [m("1", "A"), m("2", "B")];
    const expenses = [e("1", 100, "1", ["1", "2"])];
    const f = computeMemberFinancials("1", members, expenses);
    assert.strictEqual(f.totalPaidMinor, toMinorUnits(100));
    assert.strictEqual(f.totalShareMinor, toMinorUnits(50));
    assert.strictEqual(f.settlementsPaidMinor, 0);
    assert.strictEqual(f.settlementsReceivedMinor, 0);
    assert.strictEqual(f.balanceMinor, toMinorUnits(50));
  });

  it("includes settlements in balance", () => {
    const members = [m("1", "A"), m("2", "B")];
    const expenses = [e("1", 100, "1", ["1", "2"])];
    const settlements = [s("s1", "2", "1", 50)];
    const f = computeMemberFinancials("1", members, expenses, settlements);
    // paid: 100, share: 50, settledIn: 50, settledOut: 0
    // balance = 100 - 50 + 0 - 50 = 0
    assert.strictEqual(f.balanceMinor, 0);
  });

  it("negative balance means member owes", () => {
    const members = [m("1", "A"), m("2", "B")];
    const expenses = [e("1", 100, "2", ["1", "2"])];
    const f = computeMemberFinancials("1", members, expenses);
    assert.strictEqual(f.balanceMinor, toMinorUnits(-50));
  });

  it("does not mutate member object", () => {
    const members = [m("1", "A"), m("2", "B")];
    const originalBalance = members[0].balance;
    const expenses = [e("1", 100, "1", ["1", "2"])];
    computeMemberFinancials("1", members, expenses);
    assert.strictEqual(members[0].balance, originalBalance);
  });
});

describe("computeAllMemberFinancials", () => {
  it("sum of all balances is zero", () => {
    const members = [m("1", "A"), m("2", "B"), m("3", "C")];
    const expenses = [e("1", 100, "1", ["1", "2", "3"])];
    const financials = computeAllMemberFinancials(members, expenses);
    const sum = financials.reduce((acc: number, f: { balanceMinor: number }) => acc + f.balanceMinor, 0);
    assert.strictEqual(sum, 0);
  });

  it("returns one result per member", () => {
    const members = [m("1", "A"), m("2", "B")];
    const expenses = [e("1", 100, "1", ["1", "2"])];
    const financials = computeAllMemberFinancials(members, expenses);
    assert.strictEqual(financials.length, 2);
    assert.strictEqual(financials[0].memberId, "1");
    assert.strictEqual(financials[1].memberId, "2");
  });
});

describe("computeTripFinancials", () => {
  it("computes total spent and member financials", () => {
    const members = [m("1", "A"), m("2", "B")];
    const expenses = [e("1", 100, "1", ["1", "2"]), e("2", 200, "2", ["1", "2"])];
    const trip = computeTripFinancials(members, expenses);
    assert.strictEqual(trip.totalSpentMinor, toMinorUnits(300));
    assert.strictEqual(trip.memberFinancials.length, 2);
  });

  it("total spent is sum of all expense amounts", () => {
    const members = [m("1", "A"), m("2", "B")];
    const expenses = [e("1", 100, "1", ["1", "2"]), e("2", 200, "2", ["1", "2"])];
    const trip = computeTripFinancials(members, expenses);
    const expectedTotal = expenses.reduce((sum, e) => sum + toMinorUnits(e.amount), 0);
    assert.strictEqual(trip.totalSpentMinor, expectedTotal);
  });
});

describe("computeBudgetStats", () => {
  it("computes stats with budget", () => {
    const stats = computeBudgetStats(toMinorUnits(300), toMinorUnits(1000));
    assert.strictEqual(stats?.budgetMinor, toMinorUnits(1000));
    assert.strictEqual(stats?.remainingMinor, toMinorUnits(700));
    assert.strictEqual(stats?.spentPercentage, 30);
  });

  it("returns null for null budget", () => {
    assert.strictEqual(computeBudgetStats(toMinorUnits(300), null), null);
  });

  it("returns null for undefined budget", () => {
    assert.strictEqual(computeBudgetStats(toMinorUnits(300), undefined), null);
  });

  it("returns null for zero budget", () => {
    assert.strictEqual(computeBudgetStats(toMinorUnits(300), 0), null);
  });

  it("returns null for negative budget", () => {
    assert.strictEqual(computeBudgetStats(toMinorUnits(300), -100), null);
  });

  it("caps percentage at 100", () => {
    const stats = computeBudgetStats(toMinorUnits(1200), toMinorUnits(1000));
    assert.strictEqual(stats?.spentPercentage, 100);
    assert.strictEqual(stats?.remainingMinor, 0);
  });

  it("remaining never goes negative", () => {
    const stats = computeBudgetStats(toMinorUnits(1500), toMinorUnits(1000));
    assert.strictEqual(stats?.remainingMinor, 0);
  });
});

describe("computeSuggestedPayments", () => {
  it("suggests payment from debtor to creditor", () => {
    const members = [m("1", "A"), m("2", "B")];
    const expenses = [e("1", 100, "1", ["1", "2"])];
    const payments = computeSuggestedPayments(members, expenses);
    assert.strictEqual(payments.length, 1);
    assert.strictEqual(payments[0].from, "2");
    assert.strictEqual(payments[0].to, "1");
    assert.strictEqual(payments[0].amountMinor, toMinorUnits(50));
  });

  it("does not change total spent", () => {
    const members = [m("1", "A"), m("2", "B")];
    const expenses = [e("1", 100, "1", ["1", "2"])];
    const totalBefore = computeTotalSpent(expenses);
    computeSuggestedPayments(members, expenses);
    assert.strictEqual(computeTotalSpent(expenses), totalBefore);
  });

  it("returns empty for fully settled trip", () => {
    const members = [m("1", "A"), m("2", "B")];
    const expenses: Expense[] = [];
    const payments = computeSuggestedPayments(members, expenses);
    assert.strictEqual(payments.length, 0);
  });

  it("handles multiple expenses with different payers", () => {
    const members = [m("1", "A"), m("2", "B"), m("3", "C")];
    const expenses = [
      e("1", 100, "1", ["1", "2", "3"]),
      e("2", 200, "2", ["1", "2", "3"]),
    ];
    // A paid 100, share = 3334+6667=10001, balance = -1
    // B paid 200, share = 3333+6667=10000, balance = 10000
    // C paid 0, share = 3333+6666=9999, balance = -9999
    // Sum = 0
    const payments = computeSuggestedPayments(members, expenses);
    assert.strictEqual(payments.length, 1);
    assert.strictEqual(payments[0].from, "3");
    assert.strictEqual(payments[0].to, "2");
    assert.strictEqual(payments[0].amountMinor, 9999);
  });

  it("filters tiny balances below threshold", () => {
    const members = [m("1", "A"), m("2", "B")];
    // 1 taka split between 2: each share = 50 minor, balance = 0 for both
    const expenses = [e("1", 1, "1", ["1", "2"])];
    const payments = computeSuggestedPayments(members, expenses);
    assert.strictEqual(payments.length, 0);
  });

  it("consumes derived balances not raw member.balance", () => {
    const members = [
      { ...m("1", "A"), balance: -5000 },
      { ...m("2", "B"), balance: 5000 },
    ];
    const expenses = [e("1", 100, "2", ["1", "2"])];
    // Actual computed balances: A = -50, B = 50
    // But raw member.balance says A = -5000, B = 5000
    // Engine should ignore raw Member.balance and compute from expenses/settlements
    const payments = computeSuggestedPayments(members, expenses);
    assert.strictEqual(payments.length, 1);
    assert.strictEqual(payments[0].from, "1");
    assert.strictEqual(payments[0].to, "2");
    assert.strictEqual(payments[0].amountMinor, toMinorUnits(50));
  });
});

describe("integration: demo data invariants", () => {
  it("sum of all member balances equals zero", () => {
    const members = [
      m("1", "Farhan"),
      m("2", "Nadia"),
      m("3", "Rakib"),
      m("4", "Tanha"),
      m("5", "Imran"),
      m("6", "Rafi"),
      m("7", "Hasan"),
    ];
    const expenses = [
      e("1", 14800, "2", ["1", "2", "3", "4", "5", "6"]),
      e("2", 4200, "6", ["1", "2", "3", "4", "5", "6"]),
      e("3", 480, "1", ["1", "2", "3", "4", "5", "6"]),
      e("4", 2400, "4", ["1", "2", "3", "4", "5", "6"]),
      e("5", 3600, "2", ["1", "2", "3", "4", "5", "6"]),
      e("6", 6000, "3", ["1", "2", "3", "4", "5", "6"]),
      e("7", 7200, "6", ["1", "2", "3", "4", "5", "6"]),
      e("8", 650, "2", ["7"]),
    ];
    const settlements = [
      s("s1", "5", "2", 6447),
      s("s2", "1", "2", 5967),
    ];

    const financials = computeAllMemberFinancials(members, expenses, settlements);
    const sum = financials.reduce((acc: number, f: { balanceMinor: number }) => acc + f.balanceMinor, 0);
    assert.strictEqual(sum, 0);
  });

  it("every expense participant share sum equals expense amount", () => {
    const expenses = [
      e("1", 14800, "2", ["1", "2", "3", "4", "5", "6"]),
      e("2", 4200, "6", ["1", "2", "3", "4", "5", "6"]),
      e("3", 480, "1", ["1", "2", "3", "4", "5", "6"]),
      e("4", 2400, "4", ["1", "2", "3", "4", "5", "6"]),
      e("5", 3600, "2", ["1", "2", "3", "4", "5", "6"]),
      e("6", 6000, "3", ["1", "2", "3", "4", "5", "6"]),
      e("7", 7200, "6", ["1", "2", "3", "4", "5", "6"]),
      e("8", 650, "2", ["7"]),
    ];

    for (const expense of expenses) {
      const shares = computeExpenseShares(expense);
      assert.strictEqual(
        [...shares.values()].reduce((a: number, b: number) => a + b, 0),
        toMinorUnits(expense.amount),
        `expense ${expense.id} share sum mismatch`
      );
    }
  });

  it("settlements do not affect total spent", () => {
    const members = [m("1", "A"), m("2", "B")];
    const expenses = [e("1", 100, "1", ["1", "2"])];
    const settlements = [s("s1", "2", "1", 50)];
    const totalBefore = computeTotalSpent(expenses);
    computeTripFinancials(members, expenses, settlements);
    assert.strictEqual(computeTotalSpent(expenses), totalBefore);
  });
});

describe("no expenses edge cases", () => {
  it("totals and balances are zero with no expenses", () => {
    const members = [m("1", "A"), m("2", "B")];
    const expenses: Expense[] = [];
    const trip = computeTripFinancials(members, expenses);
    assert.strictEqual(trip.totalSpentMinor, 0);
    for (const f of trip.memberFinancials) {
      assert.strictEqual(f.totalPaidMinor, 0);
      assert.strictEqual(f.totalShareMinor, 0);
      assert.strictEqual(f.balanceMinor, 0);
    }
  });

  it("settlements still compute with no expenses", () => {
    const members = [m("1", "A"), m("2", "B")];
    const expenses = [e("1", 100, "1", ["1", "2"])];
    const settlements = [s("s1", "2", "1", 50)];
    const f = computeMemberFinancials("1", members, expenses, settlements);
    // paid: 100, share: 50, settledIn: 50
    // balance = 100 - 50 + 0 - 50 = 0
    assert.strictEqual(f.balanceMinor, 0);
  });
});
