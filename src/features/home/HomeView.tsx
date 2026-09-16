import type { Expense, Member } from "../../domain/types";
import type { Trip } from "../../domain/trip";
import type { Tab } from "../../types/navigation";
import HomeHeader from "./components/HomeHeader";
import BalanceCard from "./components/BalanceCard";
import RecentExpenses from "./components/RecentExpenses";
import { getCurrentGreeting } from "../../lib/greeting";

export default function HomeView({
  expenses,
  members,
  onTabChange,
  empty = false,
  onAddExpense,
  onSettle,
  currentUserName,
  budget,
  tripName,
  tripDates,
  startDate,
  endDate,
  onNewTour,
  onJoinTrip,
  onNotificationPress,
  pendingNotificationCount,
  trips,
  currentTripId,
  onSwitchTrip,
}: {
  expenses: Expense[];
  members: Member[];
  onTabChange: (t: Tab) => void;
  empty?: boolean;
  onAddExpense?: () => void;
  onSettle?: () => void;
  currentUserName?: string;
  budget?: number;
  tripName?: string;
  tripDates?: string;
  startDate?: string;
  endDate?: string;
  onNewTour?: () => void;
  onJoinTrip?: () => void;
  onNotificationPress?: () => void;
  pendingNotificationCount?: number;
  trips?: Trip[];
  currentTripId?: string;
  onSwitchTrip?: (id: string) => void;
}) {
  const me = members.find((m) => m.isMe);
  const userName = currentUserName ?? me?.name ?? "You";
  const greeting = getCurrentGreeting();

  return (
    <div className="bg-[#F4F6F9] min-h-full">
      <HomeHeader
        userName={userName}
        greeting={greeting}
        onNotificationPress={onNotificationPress}
        pendingCount={pendingNotificationCount}
      />
      <BalanceCard
        expenses={expenses}
        members={members}
        empty={empty}
        onAddExpense={onAddExpense}
        onSettle={onSettle}
        onNewTour={onNewTour}
        onJoinTrip={onJoinTrip}
        budget={budget}
        tripName={tripName}
        tripDates={tripDates}
        startDate={startDate}
        endDate={endDate}
        trips={trips}
        currentTripId={currentTripId}
        onSwitchTrip={onSwitchTrip}
      />
      {!empty && (
        <RecentExpenses
          expenses={expenses}
          members={members}
          onViewAll={() => onTabChange("expenses")}
          empty={expenses.length === 0}
          onAddExpense={onAddExpense}
        />
      )}
    </div>
  );
}
