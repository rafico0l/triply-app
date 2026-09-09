import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, PlusIcon, MapIcon } from "@hugeicons/core-free-icons";
import TripCard, { type Tour } from "./components/TripCard";
import { computeTotalSpent, toMajorUnits } from "../../domain/finance";
import type { Trip } from "../../domain/trip";
import EmptyState from "../../components/shared/EmptyState";

// ─── Section Label ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-1 mb-2.5">
      {children}
    </p>
  );
}

export default function TripsView({
  trips,
  onNewTour,
  onBack,
  onSelectTour,
  onJoinTour,
  currentTripId,
}: {
  trips: Trip[];
  onNewTour: () => void;
  onBack?: () => void;
  onSelectTour?: (id: string) => void;
  onJoinTour?: () => void;
  currentTripId?: string;
}) {
  const currentTour = trips.find((t) => t.id === currentTripId);
  const upcomingTours = trips.filter((t) => t.status === "upcoming" || (t.status === "active" && t.id !== currentTripId));
  const pastTours = trips.filter((t) => t.status === "completed");

  const toDisplayTour = (trip: Trip): Tour => ({
    id: trip.id,
    name: trip.name,
    destination: trip.destination,
    dates: trip.dates,
    members: trip.members.length,
    spent: toMajorUnits(computeTotalSpent(trip.expenses)),
    status: trip.status,
    coverImage: trip.coverImage,
  });

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
      {trips.length === 0 ? (
        <div className="px-4 pt-6">
          <EmptyState
            icon={<HugeiconsIcon icon={MapIcon} size={32} color="currentColor" strokeWidth={1.5} />}
            title="No trips yet"
            body="Create your first trip to start tracking expenses with your group."
            action={
              <div className="flex flex-col gap-2">
                <button
                  onClick={onNewTour}
                  className="pressable inline-flex items-center gap-2 px-5 h-11 rounded-[12px] bg-[#0A86A0] text-white font-700 text-[14px] shadow-[0 2px_8px_rgba(10,134,160,0.18)]"
                >
                  <HugeiconsIcon icon={PlusIcon} size={16} color="currentColor" strokeWidth={2.5} />
                  Create your first trip
                </button>
                {onJoinTour && (
                  <button
                    onClick={onJoinTour}
                    className="pressable inline-flex items-center gap-2 px-5 h-11 rounded-[12px] bg-white text-[#0A86A0] font-700 text-[14px] border border-[#A3DFE9]"
                  >
                    Join a trip
                  </button>
                )}
              </div>
            }
          />
        </div>
      ) : (
        <div className="px-4 pt-4 space-y-6 max-w-[600px] mx-auto w-full">
          {/* CURRENT TRIP */}
          {currentTour && (
            <section>
              <SectionLabel>CURRENT TRIP</SectionLabel>
              <div className="space-y-2.5">
                <TripCard
                  key={currentTour.id}
                  tour={toDisplayTour(currentTour)}
                  onSelect={onSelectTour}
                  isCurrent
                />
              </div>
            </section>
          )}

          {/* UPCOMING TRIPS */}
          {upcomingTours.length > 0 && (
            <section>
              <SectionLabel>UPCOMING TRIPS</SectionLabel>
              <div className="space-y-2.5">
                {upcomingTours.map((tour) => (
                  <TripCard
                    key={tour.id}
                    tour={toDisplayTour(tour)}
                    onSelect={onSelectTour}
                  />
                ))}
              </div>
            </section>
          )}

          {/* PAST TRIPS */}
          {pastTours.length > 0 && (
            <section>
              <SectionLabel>PAST TRIPS</SectionLabel>
              <div className="space-y-2.5">
                {pastTours.map((tour) => (
                  <TripCard
                    key={tour.id}
                    tour={toDisplayTour(tour)}
                    onSelect={onSelectTour}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── Floating New Trip Action ────────────────────────────────────── */}
      {trips.length > 0 && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+60px+16px)] left-1/2 -translate-x-1/2 w-full max-w-[480px] z-20 flex justify-center pointer-events-none">
          <button
            onClick={onNewTour}
            className="pressable pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0A86A0] text-white font-700 text-[14px] shadow-[0 4px_16px_rgba(10,134,160,0.3)] hover:bg-[#087288] transition-colors active:scale-95"
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
      )}
    </div>
  );
}
