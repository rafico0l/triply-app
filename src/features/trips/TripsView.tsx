import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, PlusIcon } from "@hugeicons/core-free-icons";
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
    <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-1 mb-2.5">
      {children}
    </p>
  );
}

// ─── Trips View ───────────────────────────────────────────────────────────────
export default function TripsView({
  onNewTour,
  onBack,
  onSelectTour,
}: {
  onNewTour: () => void;
  onBack?: () => void;
  onSelectTour?: (id: string) => void;
}) {
  const activeTours = TOURS.filter((t) => t.status === "active");
  const upcomingTours = TOURS.filter((t) => t.status === "upcoming");
  const completedTours = TOURS.filter((t) => t.status === "completed");

  return (
    <div className="relative min-h-full pb-20">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E1E7EF] sticky top-0 z-10 safe-top">
        <div className="flex items-center justify-center px-4 h-[56px] relative">
          <button
            onClick={onBack}
            className="pressable absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-[#475569] hover:bg-[#F4F6F9] transition-colors"
            aria-label="Go back"
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={22}
              color="currentColor"
              strokeWidth={1.75}
            />
          </button>
          <h1 className="text-[17px] font-700 text-[#0F172A] leading-none text-center">
            Your trips
          </h1>
        </div>
      </div>

      {/* ── Content Sections ────────────────────────────────────────────── */}
      <div className="px-4 pt-4 space-y-6 max-w-[600px] mx-auto w-full">
        {/* ACTIVE TRIP */}
        {activeTours.length > 0 && (
          <section>
            <SectionLabel>ACTIVE TRIP</SectionLabel>
            <div className="space-y-2.5">
              {activeTours.map((tour) => (
                <TripCard
                  key={tour.id}
                  tour={tour}
                  onSelect={onSelectTour}
                />
              ))}
            </div>
          </section>
        )}

        {/* UPCOMING */}
        {upcomingTours.length > 0 && (
          <section>
            <SectionLabel>UPCOMING</SectionLabel>
            <div className="space-y-2.5">
              {upcomingTours.map((tour) => (
                <TripCard
                  key={tour.id}
                  tour={tour}
                  onSelect={onSelectTour}
                />
              ))}
            </div>
          </section>
        )}

        {/* COMPLETED */}
        {completedTours.length > 0 && (
          <section>
            <SectionLabel>COMPLETED</SectionLabel>
            <div className="space-y-2.5">
              {completedTours.map((tour) => (
                <TripCard
                  key={tour.id}
                  tour={tour}
                  onSelect={onSelectTour}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── Floating New Trip Action ────────────────────────────────────── */}
      <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+60px+16px)] left-0 right-0 z-20 flex justify-center pointer-events-none">
        <button
          onClick={onNewTour}
          className="pressable pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0A86A0] text-white font-700 text-[14px] shadow-[0_4px_16px_rgba(10,134,160,0.3)] hover:bg-[#087288] transition-colors active:scale-95"
        >
          <HugeiconsIcon
            icon={PlusIcon}
            size={16}
            color="currentColor"
            strokeWidth={2.5}
          />
          <span>New trip</span>
        </button>
      </div>
    </div>
  );
}
