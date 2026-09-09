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

function StatusBadge({ status, isCurrent }: { status: TourStatus; isCurrent?: boolean }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-700 bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] shrink-0">
        Completed
      </span>
    );
  }
  if (isCurrent && status === "active") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-700 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] shrink-0">
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

export default function TripCard({
  tour,
  onSelect,
  isCurrent,
}: {
  tour: Tour;
  onSelect?: (id: string) => void;
  isCurrent?: boolean;
}) {
  const isActive = tour.status === "active";
  const isUpcoming = tour.status === "upcoming";
  const isCompleted = tour.status === "completed";

  const isActiveCurrent = isActive && isCurrent;

  const cardBg = isActiveCurrent ? "bg-[#F0F9FA]" : isCompleted ? "bg-[#FAFBFC]" : "bg-white";
  const cardBorder = isActiveCurrent
    ? "border-2 border-[#0A86A0]"
    : isCompleted
    ? "border border-[#E2E8F0]"
    : "border border-[#E1E7EF] hover:border-[#CBD5E1]";
  const cardShadow = isActiveCurrent
    ? "shadow-[0_2px_8px_rgba(10,134,160,0.08)]"
    : isCompleted
    ? "shadow-none"
    : "shadow-[0_1px_2px_rgba(15,23,42,0.03)]";

  const iconBg = isActiveCurrent ? "bg-[#EFF9FB]" : isCompleted ? "bg-[#F1F5F9]" : "bg-[#F8FAFC]";
  const iconColor = isActiveCurrent ? "text-[#0A86A0]" : isCompleted ? "text-[#94A3B8]" : "text-[#64748B]";

  const nameColor = isCompleted ? "text-[#64748B]" : "text-[#0F172A]";
  const nameWeight = isActiveCurrent ? "font-700" : "font-600";

  const secondaryColor = isCompleted ? "text-[#94A3B8]" : "text-[#475569]";
  const tertiaryColor = isCompleted ? "text-[#94A3B8]" : "text-[#64748B]";

  const chevronColor = isCompleted ? "text-[#CBD5E1]" : "text-[#94A3B8]";

  const hasExpenses = tour.spent !== undefined && tour.spent > 0;
  const spendText = hasExpenses ? fmt(tour.spent!) : "No expenses yet";

  return (
    <button
      onClick={() => onSelect?.(tour.id)}
      className={`pressable w-full text-left rounded-[16px] px-3.5 py-3 flex items-center gap-3 transition-all ${cardBg} ${cardBorder} ${cardShadow}`}
    >
      <div className={`w-[46px] h-[46px] rounded-[12px] ${iconBg} flex items-center justify-center shrink-0 overflow-hidden`}>
        {tour.coverImage ? (
          <img src={tour.coverImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <HugeiconsIcon icon={MapIcon} size={22} color="currentColor" strokeWidth={1.5} />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className={`text-[15px] ${nameWeight} leading-snug truncate ${nameColor}`}>
            {tour.name}
          </p>
          <StatusBadge status={tour.status} isCurrent={isCurrent} />
        </div>

        <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-500 ${secondaryColor} mb-1`}>
          {tour.destination && (
            <span className="inline-flex items-center gap-1">
              <HugeiconsIcon icon={Location01Icon} size={13} className="shrink-0" strokeWidth={1.75} />
              <span className="truncate">{tour.destination}</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <HugeiconsIcon icon={Calendar01Icon} size={13} className="shrink-0" strokeWidth={1.75} />
            <span>{tour.dates}</span>
          </span>
        </div>

        <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-500 ${tertiaryColor}`}>
          <span className="inline-flex items-center gap-1">
            <HugeiconsIcon icon={UserGroupIcon} size={13} className="shrink-0" strokeWidth={1.75} />
            <span>{tour.members} travelers</span>
          </span>
          <span className={hasExpenses ? "font-600 text-[#0F172A]" : ""}>
            {spendText}
          </span>
        </div>
      </div>

      <span className={`shrink-0 ml-1 ${chevronColor}`}>
        <HugeiconsIcon icon={ChevronRightIcon} size={18} color="currentColor" strokeWidth={1.75} />
      </span>
    </button>
  );
}
