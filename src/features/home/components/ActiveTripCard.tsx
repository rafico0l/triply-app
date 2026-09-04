import { HugeiconsIcon } from "@hugeicons/react";
import { MapIcon, ChevronRightIcon } from "@hugeicons/core-free-icons";
import { TOUR } from "../../../lib/tour";

export default function ActiveTripCard({ memberCount }: { memberCount: number }) {
  return (
    <section className="px-4 pt-4 pb-1">
      <button className="pressable w-full flex items-center gap-3 bg-white rounded-[18px] border border-[#E1E7EF] px-4 py-3.5 text-left">
        <div className="w-10 h-10 rounded-[12px] bg-[#EFF9FB] flex items-center justify-center text-[#0A86A0] shrink-0">
          <HugeiconsIcon icon={MapIcon} size={20} color="currentColor" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-700 text-[#0F172A] truncate leading-snug">{TOUR.name}</p>
          <p className="text-[12px] text-[#94A3B8] font-500 mt-0.5">
            {TOUR.dates} · {memberCount} travelers
          </p>
        </div>
        <span className="text-[#C9D4DF] shrink-0">
          <HugeiconsIcon icon={ChevronRightIcon} size={18} color="currentColor" strokeWidth={2} />
        </span>
      </button>
    </section>
  );
}
