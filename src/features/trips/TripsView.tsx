import { HugeiconsIcon } from "@hugeicons/react";
import { Notification03Icon } from "@hugeicons/core-free-icons";
import TripCard, { type Tour } from "./components/TripCard";

// ─── Mock Data ────────────────────────────────────────────────────────────────
// Reuses Tour type from TourList.tsx pattern. Will be replaced by real data.
const TOURS: Tour[] = [
  {
    id: "1",
    name: "Sajek Valley Expedition",
    destination: "Sajek Valley",
    dates: "Oct 18–22",
    members: 5,
    spent: 34250,
    status: "active",
  },
  {
    id: "2",
    name: "Cox's Bazar Getaway",
    destination: "Cox's Bazar",
    dates: "Nov 8–12",
    members: 6,
    status: "upcoming",
  },
  {
    id: "3",
    name: "Sylhet Weekend",
    destination: "Sylhet",
    dates: "Jun 14–16",
    members: 5,
    spent: 24800,
    status: "completed",
  },
  {
    id: "4",
    name: "Sundarbans Escape",
    destination: "Khulna",
    dates: "Mar 8–11",
    members: 4,
    spent: 18400,
    status: "completed",
  },
];

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-1 mb-2">
      {children}
    </p>
  );
}

// ─── Trips View ───────────────────────────────────────────────────────────────
export default function TripsView({ onNewTour }: { onNewTour: () => void }) {
  const activeUpcoming = TOURS.filter(
    (t) => t.status === "active" || t.status === "upcoming"
  );
  const completed = TOURS.filter((t) => t.status === "completed");

  return (
    <div>
      {/* ── Greeting Header ─────────────────────────────────────────────── */}
      <div className="px-4 pt-2 pb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-[42px] h-[42px] rounded-full flex items-center justify-center font-700 text-white text-[15px] shrink-0"
            style={{ backgroundColor: "#0A86A0" }}
          >
            RA
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] text-[#94A3B8] font-500 leading-none">
              Good evening,
            </p>
            <p className="text-[18px] font-700 text-[#0F172A] leading-snug mt-0.5 truncate">
              Raficool
            </p>
          </div>
          <button
            className="pressable relative w-10 h-10 flex items-center justify-center rounded-full text-[#475569] hover:bg-[#F4F6F9]"
            aria-label="Notifications"
          >
            <HugeiconsIcon
              icon={Notification03Icon}
              size={22}
              color="currentColor"
              strokeWidth={1.5}
            />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#0A86A0] border-2 border-white" />
          </button>
        </div>
      </div>

      {/* ── Title Row ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pb-4">
        <h2 className="text-[17px] font-700 text-[#0F172A]">Your trips</h2>
        <button
          onClick={onNewTour}
          className="pressable flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EFF9FB] text-[#0A86A0] text-[13px] font-700 border border-[#A3DFE9]"
        >
          <svg
            width={14}
            height={14}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            strokeLinecap="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
          New trip
        </button>
      </div>

      {/* ── Active & Upcoming ───────────────────────────────────────────── */}
      {activeUpcoming.length > 0 && (
        <section className="px-4 mb-5">
          <SectionLabel>Active & Upcoming</SectionLabel>
          <div className="space-y-2">
            {activeUpcoming.map((tour) => (
              <TripCard key={tour.id} tour={tour} />
            ))}
          </div>
        </section>
      )}

      {/* ── Completed ───────────────────────────────────────────────────── */}
      {completed.length > 0 && (
        <section className="px-4 mb-5">
          <SectionLabel>Completed</SectionLabel>
          <div className="space-y-2">
            {completed.map((tour) => (
              <TripCard key={tour.id} tour={tour} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
