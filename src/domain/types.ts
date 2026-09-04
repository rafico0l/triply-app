// Neutral domain types extracted from App.tsx

export interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
  balance: number;
  paid: number;
  isMe?: boolean;
  role?: "owner" | "member" | "guest";
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: "food" | "lodging" | "transport" | "activity" | "other";
  paidBy: string;
  splitIds: string[];
  date: string;
  dateIso: string;
  note?: string;
  addedBy: string;
  addedAt: string;
  syncStatus?: "pending" | "failed";
}

export interface RecordedSettlement {
  id: string;
  from: string;
  to: string;
  amount: number;
  date: string;
  dateIso: string;
  recordedBy: string;
  syncStatus?: "pending" | "failed";
}
