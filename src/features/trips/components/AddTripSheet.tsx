import { HugeiconsIcon } from "@hugeicons/react";
import { PlusIcon, MapIcon } from "@hugeicons/core-free-icons";
import Sheet from "../../../components/shared/Sheet";

export default function AddTripSheet({
  open,
  onClose,
  onCreate,
  onJoin,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
  onJoin?: () => void;
}) {
  if (!open) return null;

  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-5">
        <h2 className="text-[17px] font-700 text-[#0F172A]">Add a trip</h2>
        <p className="text-[13px] font-500 text-[#64748B] mt-0.5">
          How would you like to get started?
        </p>

        <div className="mt-4 space-y-2">
          <button
            onClick={() => { onClose(); onCreate(); }}
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

          {onJoin && (
            <button
              onClick={() => { onClose(); onJoin(); }}
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
          onClick={onClose}
          className="pressable w-full h-11 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-600 text-[14px] mt-4"
        >
          Cancel
        </button>
      </div>
    </Sheet>
  );
}
