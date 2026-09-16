// Neutral domain types extracted from App.tsx

export interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
  /** @deprecated Use computeMemberFinancials() or computeAllMemberFinancials() from finance.ts instead. This field is overwritten at render time by computeMembers() and must not be read from raw trip data. */
  balance: number;
  /** @deprecated Use computeMemberPaid() from finance.ts instead. This field is overwritten at render time by computeMembers() and must not be read from raw trip data. */
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

export type SettlementRequestType = "edit" | "delete";
export type SettlementRequestStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface SettlementRequest {
  id: string;
  tripId: string;
  settlementId: string | null;
  requestType: SettlementRequestType;
  requesterId: string;
  originalAmountMinor: number;
  proposedAmountMinor: number | null;
  status: SettlementRequestStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export type SettlementApprovalStatus = "pending" | "approved" | "rejected";

export interface SettlementRequestApproval {
  id: string;
  requestId: string;
  approverId: string;
  status: SettlementApprovalStatus;
  respondedAt: string | null;
  createdAt: string;
}
