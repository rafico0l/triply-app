import Sheet from "../../../components/shared/Sheet";
import { IconEdit, IconTrash } from "../../../components/shared/icons";

export default function TripOverflowSheet({ onEdit, onDelete, onClose }: {
  onEdit: () => void; onDelete: () => void; onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <div className="px-3 py-3 space-y-0.5">
        <button
          onClick={() => { onEdit(); onClose(); }}
          className="pressable w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] text-left hover:bg-[#F4F6F9]"
        >
          <div className="w-8 h-8 rounded-[9px] bg-[#F4F6F9] flex items-center justify-center text-[#475569] shrink-0">
            <IconEdit size={16} />
          </div>
          <div>
            <p className="text-[15px] font-600 text-[#0F172A]">Edit trip</p>
            <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">Change name, dates, budget</p>
          </div>
        </button>
        <button
          onClick={() => { onDelete(); onClose(); }}
          className="pressable w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] text-left hover:bg-[#FFF5F5]"
        >
          <div className="w-8 h-8 rounded-[9px] bg-[#FFF5F5] flex items-center justify-center text-[#DC2626] shrink-0">
            <IconTrash size={16} />
          </div>
          <div>
            <p className="text-[15px] font-600 text-[#DC2626]">Delete trip</p>
            <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">Permanently remove this trip</p>
          </div>
        </button>
      </div>
      <div className="px-3 pb-4 pt-1">
        <button onClick={onClose} className="pressable w-full h-11 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-600 text-[14px]">Cancel</button>
      </div>
    </Sheet>
  );
}
