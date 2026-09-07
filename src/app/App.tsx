import { useState, useRef, useEffect, type ReactNode } from "react";
import { AuthFlow } from "../features/auth/Auth";
import TourList from "../features/tours/TourList";
import CreateTour from "../features/tours/CreateTour";
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
  | null;

// ─── Sample Data ──────────────────────────────────────────────────────────────

const MEMBERS_INIT: Member[] = [
  { id: "1", name: "Farhan Ahmed",    initials: "FA", color: "#7C3AED", paid: 480,   balance: -5967, role: "member" },
  { id: "2", name: "Nadia Islam",     initials: "NI", color: "#0A86A0", paid: 19050, balance: 12603, role: "member" },
  { id: "3", name: "Rakib Hassan",    initials: "RH", color: "#059669", paid: 6000,  balance: -447,  role: "member" },
  { id: "4", name: "Tanha Khanam",    initials: "TK", color: "#D97706", paid: 2400,  balance: -4047, role: "member" },
  { id: "5", name: "Imran Chowdhury", initials: "IC", color: "#E11D48", paid: 0,     balance: -6447, role: "member" },
  { id: "6", name: "You",             initials: "RI", color: "#0A86A0", paid: 11400, balance: 4953,  isMe: true, role: "owner" },
  { id: "7", name: "Hasan Ahmed",     initials: "HA", color: "#64748B", paid: 0,     balance: -650,  role: "guest" },
];

const EXPENSES_INIT: Expense[] = [
  {
    id: "1", title: "Hotel Seagull — 2 nights", amount: 14800, category: "lodging",
    paidBy: "2", splitIds: ["1","2","3","4","5","6"], date: "Aug 22", dateIso: "2026-08-22",
    addedBy: "2", addedAt: "Aug 22 at 2:15 PM",
  },
  {
    id: "2", title: "Hilsha fish dinner at Jhawban", amount: 4200, category: "food",
    paidBy: "6", splitIds: ["1","2","3","4","5","6"], date: "Aug 23", dateIso: "2026-08-23",
    addedBy: "6", addedAt: "Aug 23 at 8:45 PM",
    note: "Best hilsha in Cox's Bazar — we ordered the full fish.",
  },
  {
    id: "3", title: "CNG auto from station", amount: 480, category: "transport",
    paidBy: "1", splitIds: ["1","2","3","4","5","6"], date: "Aug 22", dateIso: "2026-08-22",
    addedBy: "1", addedAt: "Aug 22 at 11:20 AM",
  },
  {
    id: "4", title: "Beach chair & umbrella rentals", amount: 2400, category: "activity",
    paidBy: "4", splitIds: ["1","2","3","4","5","6"], date: "Aug 24", dateIso: "2026-08-24",
    addedBy: "4", addedAt: "Aug 24 at 10:00 AM",
  },
  {
    id: "5", title: "Breakfast buffet × 6", amount: 3600, category: "food",
    paidBy: "2", splitIds: ["1","2","3","4","5","6"], date: "Aug 24", dateIso: "2026-08-24",
    addedBy: "6", addedAt: "Aug 24 at 9:30 AM",
  },
  {
    id: "6", title: "Speed boat to Saint Martin", amount: 6000, category: "transport",
    paidBy: "3", splitIds: ["1","2","3","4","5","6"], date: "Aug 25", dateIso: "2026-08-25",
    addedBy: "3", addedAt: "Aug 25 at 7:00 AM",
    syncStatus: "pending",
  },
  {
    id: "7", title: "Mermaid Beach Resort — 1 night", amount: 7200, category: "lodging",
    paidBy: "6", splitIds: ["1","2","3","4","5","6"], date: "Aug 25", dateIso: "2026-08-25",
    addedBy: "6", addedAt: "Aug 25 at 6:45 PM",
  },
  {
    id: "8", title: "Hasan's taxi to resort", amount: 650, category: "transport",
    paidBy: "2", splitIds: ["7"], date: "Aug 22", dateIso: "2026-08-22",
    addedBy: "6", addedAt: "Aug 22 at 3:00 PM",
  },
];

const RECORDED_SETTLEMENTS_INIT: RecordedSettlement[] = [
  { id: "s1", from: "5", to: "2", amount: 6447, date: "Aug 26", dateIso: "2026-08-26", recordedBy: "6" },
  { id: "s2", from: "1", to: "2", amount: 5967, date: "Aug 26", dateIso: "2026-08-26", recordedBy: "1" },
];

// BUDGET moved to src/features/home/homeConstants.ts

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [screen, setScreen]                   = useState<Screen>(DEMO_INVITE_MODE ? "inviteAccept" : "tour");
  const [activeTourId, setActiveTourId]       = useState<string | null>(null);

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
  if (!isAuthenticated) return <AuthFlow onAuthenticate={() => setIsAuthenticated(true)} />;
  if (screen === "createTour") {
    return <CreateTour onBack={() => setScreen("tourList")} onCreate={() => { setActiveTourId("new"); setScreen("inviteMembers"); }} />;
  }
  if (screen === "inviteMembers") {
    return <InviteMembers tourName={TOUR.name} tourDates={TOUR.dates} onBack={() => setScreen("createTour")} onDone={() => setScreen("tour")} />;
  }
  if (screen === "tourList") {
    return <TourList onSelectTour={(id: string) => { setActiveTourId(id); setScreen("tour"); }} onNewTour={() => setScreen("createTour")} />;
  }
  return <AuthenticatedApp isEmpty={!activeTourId || activeTourId === "new"} onNewTour={() => setScreen("createTour")} onSelectTour={(id: string) => setActiveTourId(id)} />;
}

function AuthenticatedApp({ isEmpty = false, onNewTour, onSelectTour }: { isEmpty?: boolean; onNewTour: () => void; onSelectTour?: (id: string) => void }) {
  const [members,               setMembers]               = useState<Member[]>(() => computeMembers(MEMBERS_INIT, EXPENSES_INIT, RECORDED_SETTLEMENTS_INIT));
  const [expenses,              setExpenses]              = useState<Expense[]>(EXPENSES_INIT);
  const [recordedSettlements,   setRecordedSettlements]   = useState<RecordedSettlement[]>(RECORDED_SETTLEMENTS_INIT);
  const [tab,                 setTab]                 = useState<Tab>("home");
  const [syncStatus]                                  = useState<SyncStatus>("pending");
  const [showAddExpense,      setShowAddExpense]       = useState(false);
  const [editingExpense,      setEditingExpense]       = useState<Expense | null>(null);
  const [subScreen,           setSubScreen]           = useState<SubScreen>(null);
  const [scrolled,            setScrolled]            = useState(false);
  const [membersActionsOpen,  setMembersActionsOpen]  = useState(false);
  const [tripDetailId,        setTripDetailId]        = useState<string | null>(null);

  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const handleMobileScroll = () => setScrolled((mobileScrollRef.current?.scrollTop ?? 0) > 6);

  const me = members.find((m) => m.isMe);

  function handleExpenseSave(data: { amount: string; description: string; category: string | null; paidBy: string; splitIds: string[]; date: string; expenseId?: string }) {
    const amount = parseFloat(data.amount);
    if (isNaN(amount)) return;

    if (data.expenseId) {
      // Edit existing
      const updated = expenses.map((e) =>
        e.id === data.expenseId
          ? { ...e, title: data.description, amount, category: (data.category ?? e.category) as Expense["category"], paidBy: data.paidBy, splitIds: data.splitIds, dateIso: data.date || e.dateIso }
          : e
      );
      const recomputed = computeMembers(MEMBERS_INIT, updated, recordedSettlements);
      setExpenses(updated);
      setMembers(recomputed);
    } else {
      // New expense
      const isoDate = data.date || new Date().toISOString().slice(0, 10);
      const dateDisplay = new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const newExp: Expense = {
        id:        `e${Date.now()}`,
        title:     data.description,
        amount,
        category:  (data.category ?? "other") as Expense["category"],
        paidBy:    data.paidBy,
        splitIds:  data.splitIds,
        date:      dateDisplay,
        dateIso:   isoDate,
        addedBy:   me?.id ?? "6",
        addedAt:   new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
      };
      const updated    = [newExp, ...expenses];
      const recomputed = computeMembers(MEMBERS_INIT, updated, recordedSettlements);
      setExpenses(updated);
      setMembers(recomputed);
    }
    setShowAddExpense(false);
    setEditingExpense(null);
  }

  function handleDeleteExpense(id: string) {
    const updated    = expenses.filter((e) => e.id !== id);
    const recomputed = computeMembers(MEMBERS_INIT, updated, recordedSettlements);
    setExpenses(updated);
    setMembers(recomputed);
    setSubScreen(null);
  }

  function handleRecordSettlement(from: string, to: string, amount: number) {
    const isoDate     = new Date().toISOString().slice(0, 10);
    const dateDisplay = new Date(isoDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const newS: RecordedSettlement = {
      id: `rs${Date.now()}`, from, to, amount,
      date: dateDisplay, dateIso: isoDate,
      recordedBy: me?.id ?? "6",
      syncStatus: "pending",
    };
    const updated    = [newS, ...recordedSettlements];
    const recomputed = computeMembers(MEMBERS_INIT, expenses, updated);
    setRecordedSettlements(updated);
    setMembers(recomputed);
  }

  function handleDeleteSettlement(id: string) {
    const updated    = recordedSettlements.filter((s) => s.id !== id);
    const recomputed = computeMembers(MEMBERS_INIT, expenses, updated);
    setRecordedSettlements(updated);
    setMembers(recomputed);
  }

  function handleRemoveMember(id: string) {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setSubScreen(null);
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

  const activeExpense = subScreen?.type === "expense-detail" ? expenses.find((e) => e.id === subScreen.id) : null;
  const activeMember  = subScreen?.type === "member-detail"  ? members.find((m) => m.id === subScreen.id)  : null;

  const PageContent = () => (
    <>
      {tab === "home"       && <HomeView       expenses={expenses} members={members} onTabChange={setTab} empty={isEmpty} onAddExpense={() => setShowAddExpense(true)} onSettle={() => setTab("settlement")} />}
      {tab === "trips"      && <TripsView onNewTour={onNewTour} onBack={() => setTab("home")} onSelectTour={(id) => setTripDetailId(id)} />}
      {tab === "expenses"   && <ExpensesView   expenses={expenses} members={members} onTapExpense={(id) => setSubScreen({ type: "expense-detail", id })} />}
      {tab === "members"    && (
        <MembersView
          members={members} expenses={expenses}
          actionsOpen={membersActionsOpen} onActionsClose={() => setMembersActionsOpen(false)}
          onSetMembers={setMembers}
          onTapMember={(id) => setSubScreen({ type: "member-detail", id })}
        />
      )}
      {tab === "settlement" && (
        <SettlementView
          members={members}
          expenses={expenses}
          recordedSettlements={recordedSettlements}
          me={me}
          isCurrentUserOwner={me?.role === "owner"}
          onRecordSettlement={handleRecordSettlement}
          onOpenHistory={() => setSubScreen({ type: "settlement-history" })}
        />
      )}
      {tab === "settings"   && (
        <div className="px-4 pt-4">
          <div className="bg-white rounded-[16px] border border-[#E1E7EF] px-5 py-6 flex flex-col items-center text-center gap-3">
            <p className="text-[14px] font-700 text-[#0F172A]">Settings</p>
            <p className="text-[13px] text-[#94A3B8] font-500">Coming soon</p>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="h-full bg-[#F4F6F9] overflow-hidden">

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
          members={members.map((m) => ({
            id: m.id, name: m.isMe ? "Rafi" : m.name, initials: m.initials, color: m.color, isMe: m.isMe,
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
          members={members}
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
          allMembers={members}
          allExpenses={expenses}
          recordedSettlements={recordedSettlements}
          me={me}
          isCurrentUserOwner={me?.role === "owner"}
          onBack={() => setSubScreen(null)}
          onSetMembers={setMembers}
          onRemove={() => handleRemoveMember(activeMember.id)}
        />
      )}

      {/* ── Settlement History ─────────────────────────────────────────────── */}
      {subScreen?.type === "settlement-history" && (
        <SettlementHistoryView
          recordedSettlements={recordedSettlements}
          members={members}
          me={me}
          isCurrentUserOwner={me?.role === "owner"}
          onDeleteSettlement={handleDeleteSettlement}
          onBack={() => setSubScreen(null)}
        />
      )}

      {/* ── Trip Details ───────────────────────────────────────────────────── */}
      {tripDetailId && (
        <div className="fixed inset-0 z-50 bg-[#F8FAFC] overflow-y-auto">
          <div className="safe-top" />
          <TripDetailsView
            tripId={tripDetailId}
            onBack={() => setTripDetailId(null)}
            onSeeAllExpenses={() => {
              setTripDetailId(null);
              setTab("expenses");
            }}
          />
        </div>
      )}
    </div>
  );
}
