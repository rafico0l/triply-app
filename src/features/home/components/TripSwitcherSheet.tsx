import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { MapIcon, CheckmarkCircle02Icon, PlusIcon } from "@hugeicons/core-free-icons";
import Sheet from "../../../components/shared/Sheet";
import AddTripSheet from "../../trips/components/AddTripSheet";
import { computeTripStatus } from "../../../domain/trip";
import type { Trip } from "../../../domain/trip";

export default function TripSwitcherSheet({
  open,
  onClose,
  trips,
  currentTripId,
  onSelectTrip,
  onCreateTrip,
  onJoinTrip,
}: {
  open: boolean;
  onClose: () => void;
  trips: Trip[];
  currentTripId: string;
  onSelectTrip: (id: string) => void;
  onCreateTrip: () => void;
  onJoinTrip?: () => void;
}) {
  const [showAddTrip, setShowAddTrip] = useState(false);

  if (!open) return null;

  return (
    <>
      <Sheet onClose={onClose}>
        <div className="px-5 pt-3 pb-2">
          <h2 className="text-[17px] font-700 text-[#0F172A]">Switch trip</h2>
          <p className="text-[13px] font-500 text-[#64748B] mt-0.5">
            Choose which trip you want to view.
          </p>
        </div>

        <div className="max-h-[50vh] overflow-y-auto overscroll-contain px-3 pb-2">
          {trips.map((trip) => {
            const isCurrent = trip.id === currentTripId;
            const status = computeTripStatus(trip);

            return (
              <button
                key={trip.id}
                onClick={() => {
                  if (!isCurrent) onSelectTrip(trip.id);
                  onClose();
                }}
                className={`pressable w-full flex items-center gap-3 px-3 py-3 rounded-[12px] text-left transition-colors ${
                  isCurrent ? "bg-[#EFF9FB]" : "hover:bg-[#F4F6F9]"
                }`}
              >
                <div className="w-9 h-9 rounded-[10px] bg-[#EFF9FB] flex items-center justify-center text-[#0A86A0] shrink-0">
                  <HugeiconsIcon icon={MapIcon} size={18} color="currentColor" strokeWidth={1.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-600 text-[#0F172A] truncate leading-snug">
                    {trip.name}
                  </p>
                  <p className="text-[12px] text-[#94A3B8] font-500 mt-0.5 truncate">
                    {trip.dates} · {trip.members.length} {trip.members.length === 1 ? "traveler" : "travelers"}
                  </p>
                </div>
                {isCurrent && (
                  <span className="text-[#0A86A0] shrink-0">
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} color="currentColor" strokeWidth={2} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="px-3 pb-4 pt-1">
          <div className="border-t border-[#F1F5F9] mb-2" />
          <button
            onClick={() => {
              setShowAddTrip(true);
            }}
            className="pressable w-full flex items-center gap-3 px-3 py-3 rounded-[12px] text-left hover:bg-[#F4F6F9] transition-colors"
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#EFF9FB] flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={PlusIcon} size={18} color="#0A86A0" strokeWidth={2} />
            </div>
            <p className="text-[14px] font-600 text-[#0A86A0]">Add trip</p>
          </button>
        </div>
      </Sheet>

      <AddTripSheet
        open={showAddTrip}
        onClose={() => setShowAddTrip(false)}
        onCreate={onCreateTrip}
        onJoin={onJoinTrip}
      />
    </>
  );
}
