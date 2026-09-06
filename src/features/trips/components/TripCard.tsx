import { HugeiconsIcon } from "@hugeicons/react";
import {
  MapIcon,
  ChevronRightIcon,
  Location01Icon,
  Calendar01Icon,
  UserGroupIcon,
  Invoice01Icon,
} from "@hugeicons/core-free-icons";
import { fmt } from "../../../lib/format";

export type TourStatus = "active" | "upcoming" | "completed";

export interface Tour {
  id: string;
  name: string;
  destination?: string;
  dates: string;
  members: number;
  spent?: number;
  status: TourStatus;
  coverImage?: string;
}

function StatusBadge({ status }: { status: TourStatus }) {
  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-700 bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] shrink-0">
        Upcoming
      </span>
    );
  }
  return null;
}

export default function TripCard({
  tour,
  onSelect,
}: {
  tour: Tour;
  onSelect?: (id: string) => void;
}) {
  const isActive = tour.status === "active";
  const isUpcoming = tour.status === "upcoming";
  const isCompleted = tour.status === "completed";

  return (
    <button
      onClick={() => onSelect?.(tour.id)}
      className={`pressable w-full text-left bg-white rounded-[16px] px-3.5 py-3.5 flex items-center gap-3 transition-all ${
        isActive
          ? "border-2 border-[#0A86A0] shadow-[0_2px_12px_rgba(10,134,160,0.08)]"
          : "border border-[#E1E7EF] hover:border-[#CBD5E1] shadow-[0_1px_3px_rgba(15,23,42,0.03)]"
      }`}
    >
      {/* Cover / Icon Fallback */}
      <div className="w-[46px] h-[46px] rounded-[12px] bg-[#EFF9FB] flex items-center justify-center text-[#0A86A0] shrink-0 overflow-hidden">
        {tour.coverImage ? (
          <img
            src={tour.coverImage}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <HugeiconsIcon
            icon={MapIcon}
            size={22}
            color="currentColor"
            strokeWidth={1.5}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <p
            className={`text-[15px] font-700 leading-snug truncate ${
              isCompleted ? "text-[#334155]" : "text-[#0F172A]"
            }`}
          >
            {tour.name}
          </p>
          <StatusBadge status={tour.status} />
        </div>

        {/* Metadata items */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#64748B] font-500">
          {tour.destination && (
            <span className="inline-flex items-center gap-1">
              <HugeiconsIcon
                icon={Location01Icon}
                size={13}
                className="text-[#94A3B8] shrink-0"
                strokeWidth={1.75}
              />
              <span className="truncate">{tour.destination}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <HugeiconsIcon
              icon={Calendar01Icon}
              size={13}
              className="text-[#94A3B8] shrink-0"
              strokeWidth={1.75}
            />
            <span>{tour.dates}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <HugeiconsIcon
              icon={UserGroupIcon}
              size={13}
              className="text-[#94A3B8] shrink-0"
              strokeWidth={1.75}
            />
            <span>{tour.members} travelers</span>
          </span>
          {tour.spent !== undefined && !isUpcoming && (
            <span className="inline-flex items-center gap-1">
              <HugeiconsIcon
                icon={Invoice01Icon}
                size={13}
                className="text-[#94A3B8] shrink-0"
                strokeWidth={1.75}
              />
              <span className="font-600 text-[#0F172A]">
                {fmt(tour.spent)}
              </span>
              <span className="text-[#94A3B8]">spent</span>
            </span>
          )}
        </div>
      </div>

      {/* Right Chevron */}
      <span className="text-[#94A3B8] hover:text-[#64748B] shrink-0 ml-1">
        <HugeiconsIcon
          icon={ChevronRightIcon}
          size={18}
          color="currentColor"
          strokeWidth={1.75}
        />
      </span>
    </button>
  );
}
