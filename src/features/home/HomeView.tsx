import type { Expense, Member } from "../../domain/types";
import type { Tab } from "../../types/navigation";
import HomeHeader from "./components/HomeHeader";
import BalanceCard from "./components/BalanceCard";
import RecentExpenses from "./components/RecentExpenses";

export default function HomeView({
  expenses,
  members,
  onTabChange,
  empty = false,
  onAddExpense,
  onSettle,
  currentUserName,
}: {
  expenses: Expense[];
  members: Member[];
  onTabChange: (t: Tab) => void;
  empty?: boolean;
  onAddExpense?: () => void;
  onSettle?: () => void;
  currentUserName?: string;
}) {
  const me = members.find((m) => m.isMe);
  const userName = currentUserName ?? me?.name ?? "You";

  return (
    <div className="bg-[#F4F6F9] min-h-full">
      <HomeHeader userName={userName} />
      <BalanceCard
        expenses={expenses}
        members={members}
        empty={empty}
        onAddExpense={onAddExpense}
        onSettle={onSettle}
      />
      <RecentExpenses
        expenses={expenses}
        members={members}
        onViewAll={() => onTabChange("expenses")}
        empty={empty}
        onAddExpense={onAddExpense}
      />
    </div>
  );
}
