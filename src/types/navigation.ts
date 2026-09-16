export type Tab = "home" | "trips" | "expenses" | "members" | "settlement" | "settings";

export type SubScreen =
  | { type: "expense-detail"; id: string }
  | { type: "member-detail"; id: string }
  | { type: "settlement-history" }
  | { type: "members" }
  | { type: "notifications" }
  | null;