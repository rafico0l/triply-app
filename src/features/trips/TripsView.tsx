import { HugeiconsIcon } from "@hugeicons/react";
import { PlusIcon, MapIcon } from "@hugeicons/core-free-icons";
import TripCard, { type Tour } from "./components/TripCard";
import { computeTotalSpent, toMajorUnits } from "../../domain/finance";
import type { Trip } from "../../domain/trip";
import { computeTripStatus } from "../../domain/trip";
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
  onSelectTour,
  onJoinTour,
  currentTripId,
}: {
  trips: Trip[];
  onNewTour: () => void;
  onSelectTour?: (id: string) => void;
  onJoinTour?: () => void;
  currentTripId?: string;
}) {
  const activeTours = trips.filter((t) => computeTripStatus(t) === "active");
  const upcomingTours = trips.filter((t) => computeTripStatus(t) === "upcoming");
  const pastTours = trips.filter((t) => computeTripStatus(t) === "completed");

  const toDisplayTour = (trip: Trip): Tour => ({
    id: trip.id,
    name: trip.name,
    destination: trip.destination,
    dates: trip.dates,
    members: trip.members.length,
    spent: toMajorUnits(computeTotalSpent(trip.expenses)),
    status: computeTripStatus(trip),
    coverImage: trip.coverImage,
  });

  return (
    <div className="relative min-h-full pb-20">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E1E7EF] sticky top-0 z-10 safe-top">
        <div className="flex items-center justify-center px-4 h-[56px]">
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
          {activeTours.length > 0 && (
            <section>
              <SectionLabel>CURRENT TRIP</SectionLabel>
              <div className="space-y-2.5">
                {activeTours.map((tour) => (
                  <TripCard
                    key={tour.id}
                    tour={toDisplayTour(tour)}
                    onSelect={onSelectTour}
                    isCurrent
                  />
                ))}
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
