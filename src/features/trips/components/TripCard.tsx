import { HugeiconsIcon } from "@hugeicons/react";
import { MapIcon, ChevronRightIcon } from "@hugeicons/core-free-icons";
import { fmt } from "../../../lib/format";
import { IconMapPin } from "../../../components/shared/icons";

export type TourStatus = "active" | "upcoming" | "completed";

export interface Tour {
  id: string;
  name: string;
  destination?: string;
  dates: string;
  members: number;
  spent?: number;
  status: TourStatus;
}

function StatusBadge({ status }: { status: TourStatus }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-700 bg-[#EFF9FB] text-[#0A7490] border border-[#A3DFE9] shrink-0">
        <span className="w-1.5 h-1.5 rounded-full bg-[#0A86A0] animate-pulse" />
        Active
      </span>
    );
  }
  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-700 bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] shrink-0">
        Upcoming
      </span>
    );
  }
  return null;
}

export default function TripCard({ tour }: { tour: Tour }) {
  const isCompleted = tour.status === "completed";

  return (
    <button className="pressable w-full text-left bg-white rounded-[14px] border border-[#E1E7EF] px-3 py-3 flex items-center gap-3 transition-shadow hover:shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
      {/* Thumbnail */}
      <div className="w-[44px] h-[44px] rounded-[12px] bg-[#EFF9FB] flex items-center justify-center text-[#0A86A0] shrink-0">
        <HugeiconsIcon icon={MapIcon} size={20} color="currentColor" strokeWidth={1.5} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p
            className="text-[14px] font-700 leading-snug truncate"
            style={{ color: isCompleted ? "#475569" : "#0F172A" }}
          >
            {tour.name}
          </p>
          <StatusBadge status={tour.status} />
        </div>

        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
          {tour.destination && (
            <span className="flex items-center gap-0.5 text-[12px] text-[#94A3B8] font-500">
              <IconMapPin size={11} />
              {tour.destination}
            </span>
          )}
          <span className="text-[12px] text-[#94A3B8] font-500">{tour.dates}</span>
          <span className="text-[12px] text-[#94A3B8] font-500">{tour.members} travelers</span>
        </div>

        {tour.spent !== undefined && (
          <div className="mt-1.5">
            <span
              className="num text-[13px] font-600"
              style={{ color: isCompleted ? "#475569" : "#0F172A" }}
            >
              {fmt(tour.spent)}
            </span>
            <span className="text-[12px] text-[#94A3B8] font-500 ml-1">spent</span>
          </div>
        )}
      </div>

      {/* Chevron for completed */}
      {isCompleted && (
        <span className="text-[#C9D4DF] shrink-0">
          <HugeiconsIcon icon={ChevronRightIcon} size={16} color="currentColor" strokeWidth={2} />
        </span>
      )}
    </button>
  );
}
