import { useState, type ReactNode } from "react";
import { fmt } from "../../lib/format";
import { IconMapPin } from "../../components/shared/icons";

// ─── Types ────────────────────────────────────────────────────────────────────
type TourStatus = "active" | "upcoming" | "completed";

interface Tour {
  id: string;
  name: string;
  destination?: string;
  dates: string;
  members: number;
  spent?: number;
  status: TourStatus;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────
const TOURS: Tour[] = [
  {
    id: "1",
    name: "Cox's Bazar Getaway",
    destination: "Cox's Bazar",
    dates: "Aug 22–27, 2026",
    members: 6,
    spent: 38680,
    status: "active",
  },
  {
    id: "2",
    name: "Sajek Trip",
    destination: "Sajek Valley",
    dates: "Oct 12–15, 2026",
    members: 8,
    status: "upcoming",
  },
  {
    id: "3",
    name: "Sylhet Weekend",
    destination: "Sylhet",
    dates: "Jun 14–16, 2026",
    members: 5,
    spent: 24800,
    status: "completed",
  },
  {
    id: "4",
    name: "Sundarbans Escape",
    destination: "Khulna",
    dates: "Mar 8–11, 2026",
    members: 4,
    spent: 18400,
    status: "completed",
  },
];

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconPlus({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconUsers({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconCalendar({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function IconChevronRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function IconCompass({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </svg>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: TourStatus }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-700 bg-[#EFF9FB] text-[#0A7490] border border-[#A3DFE9]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0A86A0] animate-pulse" />
        Active
      </span>
    );
  }
  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-700 bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
        Upcoming
      </span>
    );
  }
  return null;
}

// ─── Tour Card ────────────────────────────────────────────────────────────────
function TourCard({ tour, onSelect }: { tour: Tour; onClick?: () => void; onSelect: (id: string) => void }) {
  const isCompleted = tour.status === "completed";

  return (
    <button
      onClick={() => onSelect(tour.id)}
      className="pressable w-full text-left bg-white rounded-[14px] border border-[#E1E7EF] px-4 py-3.5 flex items-center gap-3 transition-shadow hover:shadow-[0_2px_12px_rgba(15,23,42,0.06)]"
    >
      {/* Color accent stripe */}
      <div
        className="w-1 self-stretch rounded-full shrink-0"
        style={{
          backgroundColor: isCompleted
            ? "#E1E7EF"
            : tour.status === "active"
            ? "#0A86A0"
            : "#F59E0B",
        }}
      />

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <p
            className="text-[14px] font-700 leading-snug truncate"
            style={{ color: isCompleted ? "#475569" : "#0F172A" }}
          >
            {tour.name}
          </p>
          <StatusPill status={tour.status} />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {tour.destination && (
            <span className="flex items-center gap-1 text-[12px] text-[#94A3B8] font-500">
              <IconMapPin size={12} />
              {tour.destination}
            </span>
          )}
          <span className="flex items-center gap-1 text-[12px] text-[#94A3B8] font-500">
            <IconCalendar size={12} />
            {tour.dates}
          </span>
          <span className="flex items-center gap-1 text-[12px] text-[#94A3B8] font-500">
            <IconUsers size={12} />
            {tour.members} members
          </span>
        </div>

        {/* Financial line */}
        {tour.spent !== undefined && (
          <div className="mt-2 pt-2 border-t border-[#F4F6F9]">
            <span
              className="num text-[13px] font-700"
              style={{ color: isCompleted ? "#475569" : "#0F172A" }}
            >
              {fmt(tour.spent)}
            </span>
            <span className="text-[12px] text-[#94A3B8] font-500 ml-1">
              {isCompleted ? "total" : "spent"}
            </span>
          </div>
        )}
      </div>

      <span className="text-[#C9D4DF] shrink-0">
        <IconChevronRight size={16} />
      </span>
    </button>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-1 mb-2">
      {children}
    </p>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyTourState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-20 text-center">
      <div className="w-14 h-14 rounded-[16px] bg-[#F1F5F9] flex items-center justify-center text-[#C9D4DF] mb-5">
        <IconCompass size={28} />
      </div>
      <p className="text-[17px] font-700 text-[#0F172A] mb-2">No tours yet</p>
      <p className="text-[14px] text-[#94A3B8] font-500 leading-relaxed max-w-[240px] mb-6">
        Create a tour and start tracking your group&apos;s expenses.
      </p>
      <button
        onClick={onCreate}
        className="pressable flex items-center gap-2 px-5 h-11 rounded-[12px] bg-[#0A86A0] text-white font-700 text-[14px] shadow-[0_2px_10px_rgba(10,134,160,0.22)]"
      >
        <IconPlus size={15} />
        Create your first tour
      </button>
    </div>
  );
}

// ─── Tour List Screen ─────────────────────────────────────────────────────────
export default function TourList({ onSelectTour, onNewTour }: { onSelectTour: (tourId: string) => void; onNewTour: () => void }) {
  const [tours] = useState<Tour[]>(TOURS);

  const active    = tours.filter((t) => t.status === "active" || t.status === "upcoming");
  const completed = tours.filter((t) => t.status === "completed");
  const isEmpty   = tours.length === 0;

  const handleNewTour = () => {
    onNewTour();
  };

  return (
    <div className="h-full bg-[#F4F6F9] flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E1E7EF] safe-top">
        <div className="flex items-center gap-3 px-4 h-[52px]">
          <div className="flex-1 min-w-0">
            <h1 className="text-[17px] font-700 text-[#0F172A] leading-none">Your tours</h1>
          </div>
          {/* User avatar */}
          <button
            className="pressable w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-700 shrink-0"
            style={{ backgroundColor: "#0A86A0" }}
            aria-label="Account"
          >
            RI
          </button>
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <EmptyTourState onCreate={onNewTour} />
        ) : (
          <div className="px-4 pt-5 pb-10 space-y-6 max-w-[600px] mx-auto w-full">

            {/* Active / Upcoming */}
            {active.length > 0 && (
              <section>
                <SectionLabel>Active & Upcoming</SectionLabel>
                <div className="space-y-2">
                  {active.map((tour) => (
                    <TourCard key={tour.id} tour={tour} onSelect={onSelectTour} />
                  ))}
                </div>
              </section>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <section>
                <SectionLabel>Completed</SectionLabel>
                <div className="space-y-2">
                  {completed.map((tour) => (
                    <TourCard key={tour.id} tour={tour} onSelect={onSelectTour} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      {/* ── New tour button — sticky bottom bar ────────────────────────────── */}
      <div className="bg-white border-t border-[#E1E7EF] px-4 py-3 safe-bottom">
        <button
          onClick={onNewTour}
          className="pressable w-full flex items-center justify-center gap-2 h-12 rounded-[13px] bg-[#0A86A0] text-white font-700 text-[15px] shadow-[0_2px_10px_rgba(10,134,160,0.18)]"
        >
          <IconPlus size={17} />
          New tour
        </button>
      </div>
    </div>
  );
}
