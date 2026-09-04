import type { Member } from "../../domain/types";

export interface SuggestedPayment {
  from: string;
  to: string;
  amount: number;
}

export function computeSuggestedPayments(members: Member[]): SuggestedPayment[] {
  const payments: SuggestedPayment[] = [];
  const creds = members.filter((m) => m.balance > 1).sort((a, b) => b.balance - a.balance).map((m) => ({ id: m.id, bal: m.balance }));
  const debts = members.filter((m) => m.balance < -1).sort((a, b) => a.balance - b.balance).map((m) => ({ id: m.id, bal: m.balance }));
  let ci = 0, di = 0;
  while (ci < creds.length && di < debts.length) {
    const amount = Math.min(creds[ci].bal, -debts[di].bal);
    if (amount >= 1) payments.push({ from: debts[di].id, to: creds[ci].id, amount: Math.round(amount) });
    creds[ci].bal -= amount;
    debts[di].bal += amount;
    if (creds[ci].bal < 1) ci++;
    if (debts[di].bal > -1) di++;
  }
  return payments;
}
