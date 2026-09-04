import Sheet from "../../../components/shared/Sheet";
import { IconEdit, IconTrash, IconInfo } from "../../../components/shared/icons";

export default function ExpenseOverflowSheet({ canEdit, onEdit, onDelete, onClose }: {
  canEdit: boolean; onEdit: () => void; onDelete: () => void; onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <div className="px-3 py-3 space-y-0.5">
        {canEdit ? (
          <>
            <button
              onClick={() => { onEdit(); onClose(); }}
              className="pressable w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] text-left hover:bg-[#F4F6F9]"
            >
              <div className="w-8 h-8 rounded-[9px] bg-[#F4F6F9] flex items-center justify-center text-[#475569] shrink-0">
                <IconEdit size={16} />
              </div>
              <div>
                <p className="text-[15px] font-600 text-[#0F172A]">Edit expense</p>
                <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">Change amount, description, split</p>
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
                <p className="text-[15px] font-600 text-[#DC2626]">Delete expense</p>
                <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">Balances will update for all participants</p>
              </div>
            </button>
          </>
        ) : (
          <div className="px-4 py-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-[9px] bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] shrink-0 mt-0.5">
              <IconInfo size={16} />
            </div>
            <p className="text-[14px] font-500 text-[#475569] leading-relaxed">
              Only the expense creator or Tour Owner can edit or delete this expense.
            </p>
          </div>
        )}
      </div>
      <div className="px-3 pb-4 pt-1">
        <button onClick={onClose} className="pressable w-full h-11 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-600 text-[14px]">Cancel</button>
      </div>
    </Sheet>
  );
}