import { useState, useRef, useEffect, type ReactNode } from "react";
import { AuthFlow } from "../features/auth/Auth";
import TourList from "../features/tours/TourList";
import CreateTour, { type CreateTourData } from "../features/tours/CreateTour";
import InviteMembers from "../features/tours/InviteMembers";
import InviteAcceptFlow from "../features/tours/InviteAccept";
import AddExpense from "../features/expenses/AddExpense";
import { Avatar } from "../components/shared/Avatar";
import { fmt } from "../lib/format";
import Sheet from "../components/shared/Sheet";
import SettlementToast from "../features/settlements/components/SettlementToast";
import RecordPaymentSheet from "../features/settlements/components/RecordPaymentSheet";
import SettlementHistoryView from "../features/settlements/SettlementHistoryView";
import SettlementView from "../features/settlements/SettlementView";
import HomeView from "../features/home/HomeView";
import TripsView from "../features/trips/TripsView";
import TripDetailsView from "../features/trips/TripDetailsView";
import { computeAllMemberFinancials, toMajorUnits } from "../domain/finance";
import type { Trip } from "../domain/trip";
import { signOut, getCurrentUser, ensureCurrentUserProfile, getCurrentUserProfileName } from "../lib/auth";
import { getSupabase } from "../lib/supabase";
import { loadTrips, TripRepositoryError, createTrip, updateTrip, deleteTrip, addGuest, renameMember, removeMember, createExpense, updateExpense, deleteExpense } from "../lib/tripRepository";
import type { User } from "@supabase/supabase-js";

const DEMO_INVITE_MODE = false;

// ─── Types ────────────────────────────────────────────────────────────────────
// Tab moved to src/types/navigation.ts
type SyncStatus = "online" | "offline" | "syncing" | "pending" | "failed";

import type { Member, Expense, RecordedSettlement } from "../domain/types";
import type { Tab } from "../types/navigation";
import type { SuggestedPayment } from "../features/settlements/settlementUtils";
import { MemberRowCompact, MemberRow } from "../features/members/components/MemberRow";
import RemoveMemberConfirmSheet from "../features/members/components/RemoveMemberConfirmSheet";
import EditNameSheet from "../features/members/components/EditNameSheet";
import InviteSheet from "../features/members/components/InviteSheet";
import AddGuestSheet from "../features/members/components/AddGuestSheet";
import MemberActionsMenu from "../features/members/components/MemberActionsMenu";
import MemberOverflowSheet from "../features/members/components/MemberOverflowSheet";
import RemoveMemberBlockedSheet from "../features/members/components/RemoveMemberBlockedSheet";
import { IconEdit, IconUserPlus, IconUserX, IconAlertCircle, IconChevronLeft, IconChevronRight, IconDots, IconDotsV, IconArrowRight, IconCheck, IconTrash, IconInfo, IconHistory, IconCheckCircle2, IconReceipt, IconMapPin, IconSearch, IconX, IconNote, IconCalendar, IconHome, IconSettings } from "../components/shared/icons";
import DeleteSettlementSheet from "../features/settlements/components/DeleteSettlementSheet";
import SettlementDetailSheet from "../features/settlements/components/SettlementDetailSheet";
import Badge from "../components/shared/Badge";
import CATEGORY_META from "../lib/categoryMeta";
import MemberDetails from "../features/members/MemberDetails";
import { TOUR } from "../lib/tour";
import MembersView from "../features/members/MembersView";
import EmptyState from "../components/shared/EmptyState";
import BottomNav from "../components/navigation/BottomNav";





type SubScreen =
  | { type: "expense-detail"; id: string }
  | { type: "member-detail"; id: string }
  | { type: "settlement-history" }
  | { type: "members" }
  | null;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeMembers(members: Member[], expenses: Expense[], recordedSettlements: RecordedSettlement[] = []): Member[] {
  const financials = computeAllMemberFinancials(members, expenses, recordedSettlements);
  const financialMap = new Map(financials.map((f) => [f.memberId, f]));

  return members.map((m) => {
    const f = financialMap.get(m.id);
    if (!f) return m;
    return {
      ...m,
      paid: toMajorUnits(f.totalPaidMinor),
      balance: Math.round(toMajorUnits(f.balanceMinor)),
    };
  });
}

import { hasMemberFinancialHistory } from "../features/members/memberUtils";
import { computeSuggestedPayments } from "../features/settlements/settlementUtils";

 

// CATEGORY_META moved to src/lib/categoryMeta.tsx

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconPlus({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function IconWifiOff({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23" />
      <path d="M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.56 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
    </svg>
  );
}
function IconRefresh({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  );
}
// IconAlertCircle extracted to src/components/shared/icons.tsx
function IconCloud({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
    </svg>
  );
}
// Icons moved to src/components/shared/icons.tsx
// Icons moved to src/components/shared/icons.tsx
// IconHistory moved to src/components/shared/icons.tsx
// IconCheckCircle2 moved to src/components/shared/icons.tsx

// `Avatar` moved to `src/components/shared/Avatar.tsx`

function SyncBanner({ status }: { status: SyncStatus }) {
  if (status === "online" || status === "pending") return null;
  if (status === "syncing") {
    return (
      <div className="flex items-center justify-center gap-1.5 py-1 px-4 text-[11px] font-500 border-b border-[#A3DFE9]" style={{ backgroundColor: "#EFF9FB", color: "#0A7490" }}>
        <IconRefresh size={12} /><span>Syncing…</span>
      </div>
    );
  }
  if (status === "offline") {
    return (
      <div className="flex items-center justify-center gap-1.5 py-[7px] px-4 text-[12px] font-500" style={{ backgroundColor: "#1C1C1E", color: "#FFFFFF" }}>
        <IconWifiOff size={13} /><span>Offline · 3 changes waiting</span>
      </div>
    );
  }
  return (
    <div className="flex items-center px-4 py-[7px] text-[12px] font-500 border-b border-[#FECACA]" style={{ backgroundColor: "#FFF5F5", color: "#DC2626" }}>
      <IconAlertCircle size={13} />
      <span className="ml-1.5 flex-1">Sync failed</span>
      <button className="pressable font-700 underline underline-offset-2">Retry</button>
    </div>
  );
}

function AppHeader({
  title, subtitle, scrolled = false, showBack = false, onBack, action, inlineSync,
}: {
  title: string; subtitle?: string; scrolled?: boolean; showBack?: boolean;
  onBack?: () => void; action?: ReactNode; inlineSync?: string;
}) {
  return (
    <div className="flex items-center gap-2 px-4 h-[52px]">
      {showBack && (
        <button onClick={onBack} className="pressable -ml-1 w-9 h-9 flex items-center justify-center rounded-full text-[#475569]" aria-label="Go back">
          <IconChevronLeft />
        </button>
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <h1 className="text-[15px] font-700 text-[#0F172A] truncate leading-none">{title}</h1>
        {subtitle && (
          <div className="overflow-hidden transition-all duration-200 ease-out" style={{ maxHeight: scrolled ? 0 : 18, opacity: scrolled ? 0 : 1, marginTop: scrolled ? 0 : 3 }}>
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-[12px] text-[#94A3B8] font-500 leading-none truncate">{subtitle}</p>
              {inlineSync && (
                <span className="flex items-center gap-[3px] text-[11px] font-500 text-[#94A3B8] shrink-0">
                  <IconCloud size={11} />{inlineSync}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function SidebarNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const items: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "home", label: "Home", icon: <IconHome /> },
    { id: "trips", label: "Trips", icon: <IconMapPin /> },
    { id: "expenses", label: "Expenses", icon: <IconReceipt /> },
    { id: "settings", label: "Settings", icon: <IconSettings /> },
  ];
  return (
    <nav className="flex-1 py-2 px-3 overflow-y-auto">
      {items.map((item) => {
        const isActive = item.id === active;
        return (
          <button key={item.id} onClick={() => onChange(item.id)}
            className={`pressable flex items-center gap-3 w-full px-3 py-2.5 rounded-[10px] mb-0.5 text-left transition-colors ${isActive ? "bg-[#EFF9FB] text-[#0A86A0]" : "text-[#475569] hover:bg-[#F4F6F9] hover:text-[#0F172A]"}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="text-[14px] font-600">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// EmptyState moved to src/components/shared/EmptyState.tsx

// Bottom sheet scaffold now extracted to src/components/shared/Sheet.tsx

// ─── Feature: Home View ───────────────────────────────────────────────────────
// StatRow extracted to src/features/home/components/StatRow.tsx

// RecentExpenses extracted to src/features/home/components/RecentExpenses.tsx

// QuickBalances extracted to src/features/home/components/QuickBalances.tsx

// HomeView extracted to src/features/home/HomeView.tsx

// ─── Feature: Expenses View ───────────────────────────────────────────────────
// ExpenseRow extracted to src/features/expenses/components/ExpenseRow.tsx
import ExpenseRow from "../features/expenses/components/ExpenseRow";
import ExpenseOverflowSheet from "../features/expenses/components/ExpenseOverflowSheet";
import DeleteExpenseSheet from "../features/expenses/components/DeleteExpenseSheet";
import ExpenseDetails from "../features/expenses/ExpenseDetails";
import ExpensesView from "../features/expenses/ExpensesView";

// ─── Feature: Expenses View ───────────────────────────────────────────────────
// ExpensesView extracted to src/features/expenses/ExpensesView.tsx

// ─── Feature: Expense Details ─────────────────────────────────────────────────
// ExpenseOverflowSheet extracted to src/features/expenses/components/ExpenseOverflowSheet.tsx

// DeleteExpenseSheet extracted to src/features/expenses/components/DeleteExpenseSheet.tsx

// ExpenseDetails extracted to src/features/expenses/ExpenseDetails.tsx

// MemberRowCompact and MemberRow extracted to src/features/members/components/MemberRow.tsx

// MembersView extracted to src/features/members/MembersView

// ─── Feature: Member Details ──────────────────────────────────────────────────
// MemberOverflowSheet extracted to src/features/members/components/MemberOverflowSheet

// RemoveMemberBlockedSheet extracted to src/features/members/components/RemoveMemberBlockedSheet

// RemoveMemberConfirmSheet and EditNameSheet extracted to src/features/members/components/

// MemberDetails extracted to src/features/members/MemberDetails

// ─── Feature: Settlement (full experience) ────────────────────────────────────

 

// SettlementHistoryView extracted to src/features/settlements/SettlementHistoryView.tsx

// SettlementHistoryView extracted to src/features/settlements/SettlementHistoryView.tsx

// SettlementView extracted to src/features/settlements/SettlementView.tsx

// ─── App Shell ────────────────────────────────────────────────────────────────
type Screen = "tourList" | "createTour" | "inviteMembers" | "inviteAccept" | "tour";

export default function App() {
  const [authLoading,    setAuthLoading]    = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser,     setCurrentUser]     = useState<User | null>(null);
  const [screen, setScreen]                   = useState<Screen>(DEMO_INVITE_MODE ? "inviteAccept" : "tour");
  const [activeTourId, setActiveTourId]       = useState<string | null>(null);
  const [trips, setTrips]                     = useState<Trip[]>([]);
  const [currentTripId, setCurrentTripId]     = useState<string>("");
  const [tripsLoading, setTripsLoading]       = useState(false);
  const [tripLoadError, setTripLoadError]     = useState<string | null>(null);
  const [creating, setCreating]               = useState(false);
  const [createError, setCreateError]         = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);

  // ── Session restoration on mount ────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    getCurrentUser().then(async (user) => {
      if (!mounted) return;
      setCurrentUser(user);
      setIsAuthenticated(!!user);
      setAuthLoading(false);

      if (user) {
        try {
          await ensureCurrentUserProfile();
          const name = await getCurrentUserProfileName();
          if (mounted) setCurrentUserName(name);
        } catch (profileErr) {
          console.error("[app] profile repair/name fetch failed:", profileErr);
        }
        await loadTripsForUser(user.id, mounted);
      }
    });
    return () => { mounted = false; };
  }, []);

  // ── Sign out handler ────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await signOut();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setScreen("tour");
  };

  async function loadTripsForUser(userId: string, mounted: boolean) {
    setTripsLoading(true);
    setTripLoadError(null);
    try {
      const loadedTrips = await loadTrips(userId);
      if (!mounted) return;
      setTrips(loadedTrips);
      if (loadedTrips.length > 0) {
        const firstId = loadedTrips[0].id;
        setCurrentTripId(firstId);
        setActiveTourId(firstId);
      } else {
        setCurrentTripId("");
        setActiveTourId(null);
      }
    } catch (err) {
      if (!mounted) return;
      console.error("[app] failed to load trips:", err);
      setTripLoadError(
        err instanceof TripRepositoryError
          ? err.message
          : "Failed to load tours. Please check your connection."
      );
    } finally {
      if (mounted) setTripsLoading(false);
    }
  }

  const retryLoadTrips = async () => {
    const user = currentUser;
    if (!user) return;
    await loadTripsForUser(user.id, true);
  };

  async function handleCreateTour(data: CreateTourData, coverImageUrl: string | null) {
    const budgetNum = data.budget ? Number(data.budget) : undefined;
    const ownerName = currentUserName ?? currentUser?.user_metadata?.name ?? currentUser?.email ?? "You";

    setCreating(true);
    setCreateError(null);

    try {
      const newTrip = await createTrip(currentUser!.id, {
        name: data.name.trim(),
        destination: data.destination.trim(),
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        budget: budgetNum && budgetNum > 0 ? budgetNum : undefined,
        coverImageUrl,
      }, ownerName);

      setTrips((prev) => [...prev, newTrip]);
      setCurrentTripId(newTrip.id);
      setActiveTourId(newTrip.id);
      setScreen("tour");
    } catch (err) {
      console.error("[app] create trip failed:", err);
      setCreateError(
        err instanceof TripRepositoryError
          ? err.message
          : "Failed to create tour. Please try again."
      );
    } finally {
      setCreating(false);
    }
  }

  if (screen === "inviteAccept") {
    return (
      <InviteAcceptFlow
        isAuthenticated={isAuthenticated}
        onAuthenticate={() => setIsAuthenticated(true)}
        onJoined={() => { setIsAuthenticated(true); setActiveTourId("joined"); setScreen("tour"); }}
        onGoToTours={() => { setIsAuthenticated(true); setScreen("tourList"); }}
      />
    );
  }
  if (authLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#F4F6F9]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0A86A0] border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] font-500 text-[#94A3B8]">Loading…</p>
        </div>
      </div>
    );
  }
  if (!isAuthenticated) return <AuthFlow onAuthenticate={() => setIsAuthenticated(true)} />;
  if (screen === "createTour") {
    return (
      <>
        <CreateTour onBack={() => { setCreateError(null); setScreen("tourList"); }} onCreate={handleCreateTour} />
        {creating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white rounded-[16px] px-6 py-4 shadow-lg flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-[#0A86A0] border-t-transparent rounded-full animate-spin" />
              <p className="text-[14px] font-600 text-[#0F172A]">Creating tour…</p>
            </div>
          </div>
        )}
        {createError && !creating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[16px] p-5 shadow-lg max-w-[320px] w-full text-center">
              <p className="text-[14px] font-700 text-[#0F172A] mb-2">Could not create tour</p>
              <p className="text-[13px] text-[#94A3B8] font-500 mb-4">{createError}</p>
              <button
                onClick={() => setCreateError(null)}
                className="pressable w-full h-10 rounded-[12px] bg-[#0A86A0] text-white font-700 text-[14px]"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </>
    );
  }
  if (screen === "inviteMembers") {
    return <InviteMembers tourName={TOUR.name} tourDates={TOUR.dates} onBack={() => setScreen("createTour")} onDone={() => setScreen("tour")} />;
  }
  if (screen === "tourList") {
    return <TourList onSelectTour={(id: string) => { setActiveTourId(id); setScreen("tour"); }} onNewTour={() => setScreen("createTour")} />;
  }

  if (tripsLoading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#F4F6F9]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0A86A0] border-t-transparent rounded-full animate-spin" />
          <p className="text-[13px] font-500 text-[#94A3B8]">Loading your tours…</p>
        </div>
      </div>
    );
  }

  if (tripLoadError) {
    return (
      <div className="h-[100dvh] flex items-center justify-center bg-[#F4F6F9]">
        <div className="flex flex-col items-center gap-4 px-8 text-center">
          <div className="w-12 h-12 rounded-full bg-[#FEE2E2] flex items-center justify-center text-[#DC2626]">
            <IconAlertCircle size={24} />
          </div>
          <p className="text-[15px] font-700 text-[#0F172A]">Could not load tours</p>
          <p className="text-[13px] text-[#94A3B8] font-500 max-w-[260px]">{tripLoadError}</p>
          <button
            onClick={retryLoadTrips}
            className="pressable flex items-center gap-2 px-5 h-11 rounded-[12px] bg-[#0A86A0] text-white font-700 text-[14px] shadow-[0_2px_10px_rgba(10,134,160,0.22)]"
          >
            Retry
          </button>
          <button
            onClick={handleSignOut}
            className="pressable text-[13px] font-600 text-[#94A3B8] underline underline-offset-2"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <AuthenticatedApp
    trips={trips}
    setTrips={setTrips}
    currentTripId={currentTripId}
    setCurrentTripId={setCurrentTripId}
    isEmpty={!activeTourId || activeTourId === "new"}
    onNewTour={() => setScreen("createTour")}
    onSelectTour={(id: string) => setActiveTourId(id)}
    onSignOut={handleSignOut}
    currentUser={currentUser}
    currentUserName={currentUserName}
  />;
}

function AuthenticatedApp({
  isEmpty = false, onNewTour, onSelectTour, onSignOut, currentUser,
  trips, setTrips, currentTripId, setCurrentTripId,
  currentUserName,
}: {
  isEmpty?: boolean;
  onNewTour: () => void;
  onSelectTour?: (id: string) => void;
  onSignOut: () => void;
  currentUser: User | null;
  trips: Trip[];
  setTrips: React.Dispatch<React.SetStateAction<Trip[]>>;
  currentTripId: string;
  setCurrentTripId: React.Dispatch<React.SetStateAction<string>>;
  currentUserName: string | null;
}) {
  const [tab,                 setTab]                 = useState<Tab>("home");
  const [syncStatus]                                  = useState<SyncStatus>("pending");
  const [showAddExpense,      setShowAddExpense]       = useState(false);
  const [editingExpense,      setEditingExpense]       = useState<Expense | null>(null);
  const [subScreen,           setSubScreen]           = useState<SubScreen>(null);
  const [scrolled,            setScrolled]            = useState(false);
  const [membersActionsOpen,  setMembersActionsOpen]  = useState(false);
  const [tripDetailId,        setTripDetailId]        = useState<string | null>(null);
  const [settlementError,     setSettlementError]     = useState<string | null>(null);
  const [tripError,           setTripError]           = useState<string | null>(null);

  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const handleMobileScroll = () => setScrolled((mobileScrollRef.current?.scrollTop ?? 0) > 6);

  const currentTrip = trips.find((t) => t.id === currentTripId) ?? trips[0] ?? {
    id: "", name: "", dates: "", status: "active" as const,
    members: [], expenses: [], settlements: [],
  };
  const currentMembers = computeMembers(currentTrip.members, currentTrip.expenses, currentTrip.settlements);
  const currentExpenses = currentTrip.expenses;
  const currentSettlements = currentTrip.settlements;

  const me = currentMembers.find((m) => m.isMe);

  function updateCurrentTrip(updater: (trip: Trip) => Trip) {
    setTrips((prev) => prev.map((t) => (t.id === currentTripId ? updater(t) : t)));
  }

  function handleExpenseSave(data: { amount: string; description: string; category: string | null; paidBy: string; splitIds: string[]; date: string; expenseId?: string }) {
    const amount = parseFloat(data.amount);
    if (isNaN(amount)) return;

    if (!me) {
      setTripError("Cannot save expense: you are not a member of this trip.");
      return;
    }

    const category = data.category ?? "other";
    const isoDate = data.date || new Date().toISOString().slice(0, 10);
    const addedBy = me.id;

    if (data.expenseId) {
      updateExpense({
        tripId: currentTripId,
        expenseId: data.expenseId,
        title: data.description,
        amount,
        category,
        dateIso: isoDate,
        paidBy: data.paidBy,
        splitIds: data.splitIds,
      })
        .then((updated) => {
          updateCurrentTrip((t) => ({
            ...t,
            expenses: t.expenses.map((e) => (e.id === updated.id ? updated : e)),
          }));
          setShowAddExpense(false);
          setEditingExpense(null);
        })
        .catch((err) => {
          console.error("[app] update expense failed:", err);
          setTripError(
            err instanceof TripRepositoryError
              ? err.message
              : "Failed to update expense. Please try again."
          );
        });
    } else {
      createExpense({
        tripId: currentTripId,
        title: data.description,
        amount,
        category,
        dateIso: isoDate,
        paidBy: data.paidBy,
        splitIds: data.splitIds,
        addedBy,
      })
        .then((created) => {
          updateCurrentTrip((t) => ({ ...t, expenses: [created, ...t.expenses] }));
          setShowAddExpense(false);
          setEditingExpense(null);
        })
        .catch((err) => {
          console.error("[app] create expense failed:", err);
          setTripError(
            err instanceof TripRepositoryError
              ? err.message
              : "Failed to save expense. Please try again."
          );
        });
    }
  }

  function handleDeleteExpense(id: string) {
    deleteExpense(currentTripId, id)
      .then(() => {
        updateCurrentTrip((t) => ({ ...t, expenses: t.expenses.filter((e) => e.id !== id) }));
        setSubScreen(null);
      })
      .catch((err) => {
        console.error("[app] delete expense failed:", err);
        setTripError(
          err instanceof TripRepositoryError
            ? err.message
            : "Failed to delete expense. Please try again."
        );
      });
  }

  function handleRecordSettlement(from: string, to: string, amount: number) {
    if (!me) {
      setSettlementError("You must be a member of this trip to record a payment.");
      return;
    }

    const isoDate     = new Date().toISOString().slice(0, 10);
    const dateDisplay = new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const newS: RecordedSettlement = {
      id: `rs${Date.now()}`, from, to, amount,
      date: dateDisplay, dateIso: isoDate,
      recordedBy: me.id,
      syncStatus: "pending",
    };
    updateCurrentTrip((t) => ({ ...t, settlements: [newS, ...t.settlements] }));
    setSettlementError(null);
  }

  function clearSettlementError() {
    setSettlementError(null);
  }

  function handleDeleteSettlement(id: string) {
    updateCurrentTrip((t) => ({ ...t, settlements: t.settlements.filter((s) => s.id !== id) }));
  }

  function computeDatesDisplay(start?: string, end?: string): string {
    if (!start) return "";
    const startStr = new Date(start + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (!end || end === start) return startStr;
    const endStr = new Date(end + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    return `${startStr}\u2013${endStr}`;
  }

  function handleSaveTrip(patch: { name: string; startDate?: string; endDate?: string; budget?: number }) {
    if (!currentTripId) {
      setTripError("Cannot save: no trip selected.");
      return;
    }

    updateTrip(currentTripId, patch)
      .then((updated) => {
        setTrips((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setTripError(null);
      })
      .catch((err) => {
        console.error("[app] save trip failed:", err);
        setTripError(
          err instanceof TripRepositoryError
            ? err.message
            : "Failed to save changes. Please try again."
        );
      });
  }

  function handleDeleteTrip() {
    if (!currentTripId) {
      setTripError("Cannot delete: no trip selected.");
      return;
    }

    deleteTrip(currentTripId)
      .then(() => {
        const remaining = trips.filter((t) => t.id !== currentTripId);
        setTrips(remaining);
        setTripDetailId(null);
        if (remaining.length > 0) {
          const next = remaining[0];
          setCurrentTripId(next.id);
          onSelectTour?.(next.id);
        } else {
          setCurrentTripId("");
        }
        setTab("trips");
        setTripError(null);
      })
      .catch((err) => {
        console.error("[app] delete trip failed:", err);
        setTripError(
          err instanceof TripRepositoryError
            ? err.message
            : "Failed to delete trip. Please try again."
        );
      });
  }

  function clearTripError() {
    setTripError(null);
  }

  function handleAddGuest(name: string) {
    if (!currentTripId) return;
    addGuest({ tripId: currentTripId, name })
      .then((member) => {
        updateCurrentTrip((t) => ({ ...t, members: [...t.members, member] }));
      })
      .catch((err) => {
        console.error("[app] add guest failed:", err);
        setTripError(
          err instanceof TripRepositoryError
            ? err.message
            : "Failed to add guest. Please try again."
        );
      });
  }

  function handleRenameMember(memberId: string, name: string) {
    if (!currentTripId) return;
    renameMember({ tripId: currentTripId, memberId, name })
      .then((updated) => {
        updateCurrentTrip((t) => ({
          ...t,
          members: t.members.map((m) => (m.id === updated.id ? updated : m)),
        }));
      })
      .catch((err) => {
        console.error("[app] rename member failed:", err);
        setTripError(
          err instanceof TripRepositoryError
            ? err.message
            : "Failed to rename member. Please try again."
        );
      });
  }

  function handleRemoveMember(memberId: string) {
    if (!currentTripId) return;
    const member = currentMembers.find((m) => m.id === memberId);
    if (!member) return;

    if (member.role === "owner") {
      setTripError("Owners cannot be removed from the trip.");
      return;
    }

    if (hasMemberFinancialHistory(memberId, currentExpenses, currentSettlements)) {
      setTripError(
        `${member.name.split(" ")[0]} has financial history in this trip. Remove blocked to protect records.`
      );
      return;
    }

    removeMember(currentTripId, memberId)
      .then(() => {
        updateCurrentTrip((t) => ({
          ...t,
          members: t.members.filter((m) => m.id !== memberId),
        }));
      })
      .catch((err) => {
        console.error("[app] remove member failed:", err);
        setTripError(
          err instanceof TripRepositoryError
            ? err.message
            : "Failed to remove member. Please try again."
        );
      });
  }

  const headerConfig: Record<Tab, { title: string; subtitle?: string; showBack: boolean }> = {
    home:       { title: TOUR.name, subtitle: TOUR.dates, showBack: false },
    trips:      { title: "Trips",                        showBack: false },
    expenses:   { title: "Expenses",                      showBack: false },
    members:    { title: "Members",                       showBack: false },
    settlement: { title: "Settle up",                     showBack: false },
    settings:   { title: "Settings",                      showBack: false },
  };
  const h = headerConfig[tab];
  const contentBottomPad = "calc(env(safe-area-inset-bottom, 0px) + 60px + 16px)";

  const activeExpense = subScreen?.type === "expense-detail" ? currentExpenses.find((e) => e.id === subScreen.id) : null;
  const activeMember  = subScreen?.type === "member-detail"  ? currentMembers.find((m) => m.id === subScreen.id)  : null;

  const PageContent = () => (
    <>
      {tab === "home"       && <HomeView       expenses={currentExpenses} members={currentMembers} onTabChange={setTab} empty={isEmpty} onAddExpense={() => setShowAddExpense(true)} onSettle={() => setTab("settlement")} currentUserName={currentUserName ?? undefined} budget={currentTrip.budget} />}
      {tab === "trips"      && <TripsView trips={trips} onNewTour={onNewTour} onBack={() => setTab("home")} onSelectTour={(id) => { setCurrentTripId(id); setTripDetailId(id); }} />}
      {tab === "expenses"   && <ExpensesView   expenses={currentExpenses} members={currentMembers} onTapExpense={(id) => setSubScreen({ type: "expense-detail", id })} />}
      {tab === "members"    && (
        <MembersView
          members={currentMembers} expenses={currentExpenses}
          actionsOpen={membersActionsOpen} onActionsClose={() => setMembersActionsOpen(false)}
          onSetMembers={(next) => updateCurrentTrip((t) => ({ ...t, members: next }))}
          onTapMember={(id) => setSubScreen({ type: "member-detail", id })}
          onAddGuest={handleAddGuest}
          onRenameMember={handleRenameMember}
          onRemoveMember={handleRemoveMember}
        />
      )}
      {tab === "settlement" && (
        <SettlementView
          members={currentMembers}
          expenses={currentExpenses}
          recordedSettlements={currentSettlements}
          me={me}
          isCurrentUserOwner={me?.role === "owner"}
          onRecordSettlement={handleRecordSettlement}
          onOpenHistory={() => setSubScreen({ type: "settlement-history" })}
          error={settlementError}
          onClearError={clearSettlementError}
        />
      )}
      {tab === "settings"   && (
        <div className="px-4 pt-4 space-y-3">
          {/* Current user info */}
          {currentUser && (
            <div className="bg-white rounded-[16px] border border-[#E1E7EF] px-5 py-4">
              <p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-2">Account</p>
              <p className="text-[15px] font-600 text-[#0F172A]">{currentUser.user_metadata?.name ?? currentUser.email ?? "User"}</p>
              <p className="text-[13px] font-500 text-[#94A3B8] mt-0.5">{currentUser.email ?? ""}</p>
            </div>
          )}

          {/* Sign out */}
          <button
            onClick={onSignOut}
            className="w-full bg-white rounded-[16px] border border-[#E1E7EF] px-5 py-4 text-left"
          >
            <p className="text-[15px] font-600 text-[#DC2626]">Sign out</p>
            <p className="text-[13px] font-500 text-[#94A3B8] mt-0.5">Sign out of your account</p>
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className="h-full bg-[#F4F6F9] overflow-hidden">
      {tripError && (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 pt-3">
          <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-[12px] px-4 py-3 flex items-center justify-between max-w-[600px] mx-auto">
            <p className="text-[13px] font-600 text-[#DC2626]">{tripError}</p>
            <button onClick={clearTripError} className="text-[#DC2626] font-700 text-[13px] shrink-0 ml-3">Dismiss</button>
          </div>
        </div>
      )}

      {/* ══ MOBILE ══ */}
      <div className="flex flex-col h-full lg:hidden">
        {tab !== "home" && tab !== "trips" && (
          <div className={`sticky top-0 z-20 bg-white transition-shadow duration-200 ${scrolled ? "shadow-[0_1px_12px_rgba(15,23,42,0.07)]" : "border-b border-[#E1E7EF]"}`}>
            <div className="safe-top" />
            <AppHeader
              title={h.title} subtitle={h.subtitle}
              scrolled={false} showBack={h.showBack}
              inlineSync={undefined}
              action={
                tab === "members" ? (
                  <button onClick={() => setMembersActionsOpen(true)} className="pressable w-9 h-9 flex items-center justify-center rounded-full text-[#0A86A0]" aria-label="Add member"><IconPlus size={19} /></button>
                ) : tab === "settlement" ? (
                  <button onClick={() => setSubScreen({ type: "settlement-history" })} className="pressable w-9 h-9 flex items-center justify-center rounded-full text-[#475569]" aria-label="Settlement history"><IconHistory size={18} /></button>
                ) : (
                  <button className="pressable w-9 h-9 flex items-center justify-center rounded-full text-[#475569]" aria-label="More options"><IconDots size={18} /></button>
                )
              }
            />
            <SyncBanner status={syncStatus} />
          </div>
        )}

        <div ref={mobileScrollRef} onScroll={handleMobileScroll} className="flex-1 overflow-y-auto bg-[#F4F6F9]" style={{ paddingBottom: contentBottomPad }}>
          {tab === "home" && <div className="safe-top" />}
          <PageContent />
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-[#E1E7EF] safe-bottom">
          <BottomNav
            activeTab={tab}
            onTabChange={setTab}
          />
        </div>
      </div>

      {/* ══ DESKTOP ══ */}
      <div className="hidden lg:flex h-full">
        <aside className="w-[220px] shrink-0 flex flex-col bg-white border-r border-[#E1E7EF] safe-top safe-bottom" style={{ animation: "sidebarIn 200ms ease" }}>
          <div className="px-5 pt-5 pb-4 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-[8px] bg-[#EFF9FB] text-[#0A86A0] flex items-center justify-center"><IconMapPin size={14} /></div>
              <span className="text-[10px] font-700 text-[#94A3B8] uppercase tracking-widest">Active tour</span>
            </div>
            <p className="text-[14px] font-700 text-[#0F172A] leading-snug">{TOUR.name}</p>
            <p className="text-[12px] text-[#94A3B8] font-500 mt-1">{TOUR.dates}</p>
          </div>
          <SidebarNav active={tab} onChange={setTab} />
          <div className="px-4 py-4 border-t border-[#F1F5F9]">
            <button onClick={() => setShowAddExpense(true)} className="pressable w-full flex items-center justify-center gap-2 h-11 rounded-[12px] bg-[#0A86A0] text-white font-700 text-[14px] shadow-[0_2px_8px_rgba(10,134,160,0.18)]">
              <IconPlus size={17} />Add expense
            </button>
          </div>
        </aside>

        <div className="flex-1 flex flex-col overflow-hidden safe-top">
          <div className="sticky top-0 z-20 bg-white border-b border-[#E1E7EF]">
            <div className="max-w-[720px] mx-auto px-6 h-[52px] flex items-center gap-3">
              <h1 className="text-[15px] font-700 text-[#0F172A] flex-1 truncate">{h.title}</h1>
              {tab === "members" ? (
                <button onClick={() => setMembersActionsOpen(true)} className="pressable w-9 h-9 flex items-center justify-center rounded-full text-[#0A86A0] hover:bg-[#EFF9FB]" aria-label="Add member"><IconPlus size={19} /></button>
              ) : tab === "settlement" ? (
                <button onClick={() => setSubScreen({ type: "settlement-history" })} className="pressable w-9 h-9 flex items-center justify-center rounded-full text-[#475569] hover:bg-[#F4F6F9]" aria-label="Settlement history"><IconHistory size={18} /></button>
              ) : (
                <button className="pressable w-9 h-9 flex items-center justify-center rounded-full text-[#475569] hover:bg-[#F4F6F9]" aria-label="More options"><IconDots size={18} /></button>
              )}
            </div>
            <SyncBanner status={syncStatus} />
          </div>
          <div className="flex-1 overflow-y-auto bg-[#F4F6F9]" onScroll={(e) => setScrolled(e.currentTarget.scrollTop > 6)}>
            <div className="max-w-[720px] mx-auto pb-12">
              <PageContent />
            </div>
          </div>
        </div>
      </div>

      {/* ── Add / Edit Expense ─────────────────────────────────────────────── */}
      {(showAddExpense || editingExpense) && (
        <AddExpense
          tourName={TOUR.name}
          members={currentMembers.map((m) => ({
            id: m.id, name: m.name, initials: m.initials, color: m.color, isMe: m.isMe,
          }))}
          tourStartDate={TOUR.startDate}
          tourEndDate={TOUR.endDate}
          initialExpense={editingExpense ? {
            id:          editingExpense.id,
            amount:      editingExpense.amount,
            title:       editingExpense.title,
            category:    editingExpense.category,
            paidBy:      editingExpense.paidBy,
            splitIds:    editingExpense.splitIds,
            dateIso:     editingExpense.dateIso,
            note:        editingExpense.note,
          } : undefined}
          mode={editingExpense ? "edit" : "add"}
          onClose={() => { setShowAddExpense(false); setEditingExpense(null); }}
          onSave={handleExpenseSave}
        />
      )}

      {/* ── Expense Details ────────────────────────────────────────────────── */}
      {activeExpense && (
        <ExpenseDetails
          expense={activeExpense}
          members={currentMembers}
          onBack={() => setSubScreen(null)}
          onEdit={() => {
            setSubScreen(null);
            setEditingExpense(activeExpense);
          }}
          onDelete={() => handleDeleteExpense(activeExpense.id)}
        />
      )}

      {/* ── Member Details ─────────────────────────────────────────────────── */}
      {activeMember && (
        <MemberDetails
          member={activeMember}
          allMembers={currentMembers}
          allExpenses={currentExpenses}
          recordedSettlements={currentSettlements}
          me={me}
          isCurrentUserOwner={me?.role === "owner"}
          onBack={() => setSubScreen(null)}
          onSetMembers={(next) => updateCurrentTrip((t) => ({ ...t, members: next }))}
          onRemove={() => handleRemoveMember(activeMember.id)}
          onRenameMember={handleRenameMember}
        />
      )}

      {/* ── Settlement History ─────────────────────────────────────────────── */}
      {subScreen?.type === "settlement-history" && (
        <SettlementHistoryView
          recordedSettlements={currentSettlements}
          members={currentMembers}
          me={me}
          isCurrentUserOwner={me?.role === "owner"}
          onDeleteSettlement={handleDeleteSettlement}
          onBack={() => setSubScreen(null)}
        />
      )}

      {/* ── Members View ───────────────────────────────────────────────────── */}
      {subScreen?.type === "members" && (
        <div className="fixed inset-0 z-50 bg-[#F4F6F9] flex flex-col overflow-hidden" style={{ animation: "slideInFromRight 220ms cubic-bezier(0.32,0.72,0,1)" }}>
          <div className="bg-white border-b border-[#E1E7EF] safe-top shrink-0">
            <div className="flex items-center gap-1 px-2 h-[52px] max-w-[720px] mx-auto w-full">
              <button onClick={() => setSubScreen(null)} className="pressable w-10 h-10 flex items-center justify-center rounded-full text-[#475569]" aria-label="Go back">
                <IconChevronLeft size={22} />
              </button>
              <h1 className="flex-1 text-[16px] font-700 text-[#0F172A] truncate px-1">Members</h1>
              <button onClick={() => setMembersActionsOpen(true)} className="pressable w-10 h-10 flex items-center justify-center rounded-full text-[#0A86A0]" aria-label="Add member">
                <IconPlus size={19} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <MembersView
              members={currentMembers} expenses={currentExpenses}
              actionsOpen={membersActionsOpen} onActionsClose={() => setMembersActionsOpen(false)}
              onSetMembers={(next) => updateCurrentTrip((t) => ({ ...t, members: next }))}
              onTapMember={(id) => setSubScreen({ type: "member-detail", id })}
              onAddGuest={handleAddGuest}
              onRenameMember={handleRenameMember}
              onRemoveMember={handleRemoveMember}
            />
          </div>
        </div>
      )}

      {/* ── Trip Details ───────────────────────────────────────────────────── */}
      {tripDetailId && (
        <div className="fixed inset-0 z-50 bg-[#F8FAFC] overflow-y-auto">
          <div className="safe-top" />
            <TripDetailsView
              trip={currentTrip}
              onBack={() => setTripDetailId(null)}
              onSeeAllExpenses={() => {
                setTripDetailId(null);
                setTab("expenses");
              }}
              onViewMembers={() => setSubScreen({ type: "members" })}
              onTapMember={() => setSubScreen({ type: "members" })}
              onSaveTrip={handleSaveTrip}
              onDeleteTrip={handleDeleteTrip}
              onGoHome={() => { setTripDetailId(null); setTab("home"); }}
            />
        </div>
      )}
    </div>
  );
}
