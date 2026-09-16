import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { PlusIcon, MapIcon } from "@hugeicons/core-free-icons";
import TripCard, { type Tour } from "./components/TripCard";
import { computeTotalSpent, toMajorUnits } from "../../domain/finance";
import type { Trip } from "../../domain/trip";
import { computeTripStatus } from "../../domain/trip";
import EmptyState from "../../components/shared/EmptyState";
import Sheet from "../../components/shared/Sheet";

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
  const [showAddTrip, setShowAddTrip] = useState(false);

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

      {/* ── Floating Add Trip Action ────────────────────────────────────── */}
      {trips.length > 0 && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom,0px)+60px+16px)] left-1/2 -translate-x-1/2 w-full max-w-[480px] z-20 flex justify-center pointer-events-none">
          <button
            onClick={() => setShowAddTrip(true)}
            className="pressable pointer-events-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#0A86A0] text-white font-700 text-[14px] shadow-[0 4px_16px_rgba(10,134,160,0.3)] hover:bg-[#087288] transition-colors active:scale-95"
          >
            <HugeiconsIcon
              icon={PlusIcon}
              size={16}
              color="currentColor"
              strokeWidth={2.5}
            />
            <span>Add trip</span>
          </button>
        </div>
      )}

      {/* ── Add Trip Action Sheet ───────────────────────────────────────── */}
      {showAddTrip && (
        <Sheet onClose={() => setShowAddTrip(false)}>
          <div className="px-5 pt-3 pb-5">
            <h2 className="text-[17px] font-700 text-[#0F172A]">Add a trip</h2>
            <p className="text-[13px] font-500 text-[#64748B] mt-0.5">How would you like to get started?</p>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => { setShowAddTrip(false); onNewTour(); }}
                className="pressable w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] text-left hover:bg-[#F4F6F9] transition-colors"
              >
                <div className="w-9 h-9 rounded-[10px] bg-[#EFF9FB] flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={PlusIcon} size={18} color="#0A86A0" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[14px] font-600 text-[#0F172A]">Create a new trip</p>
                  <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">Plan and manage a new trip</p>
                </div>
              </button>

              {onJoinTour && (
              <button
                onClick={() => { setShowAddTrip(false); onJoinTour(); }}
                className="pressable w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] text-left hover:bg-[#F4F6F9] transition-colors"
              >
                <div className="w-9 h-9 rounded-[10px] bg-[#F0FDF4] flex items-center justify-center shrink-0">
                  <HugeiconsIcon icon={MapIcon} size={18} color="#15803D" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[14px] font-600 text-[#0F172A]">Join a trip</p>
                  <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">Enter a join code</p>
                </div>
              </button>
              )}
            </div>

            <button
              onClick={() => setShowAddTrip(false)}
              className="pressable w-full h-11 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-600 text-[14px] mt-4"
            >
              Cancel
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
