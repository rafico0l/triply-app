import Sheet from "../../../components/shared/Sheet";
import { fmt } from "../../../lib/format";
import type { Member, RecordedSettlement } from "../../../domain/types";
import { Avatar } from "../../../components/shared/Avatar";
import { IconTrash } from "../../../components/shared/icons";

export default function DeleteSettlementSheet({
  settlement, members, onConfirm, onClose,
}: {
  settlement: RecordedSettlement; members: Member[]; onConfirm: () => void; onClose: () => void;
}) {
  const from = members.find((m) => m.id === settlement.from);
  const to   = members.find((m) => m.id === settlement.to);
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[12px] bg-[#FFF5F5] flex items-center justify-center text-[#DC2626] shrink-0">
            <IconTrash size={18} />
          </div>
          <div>
            <p className="text-[16px] font-700 text-[#0F172A]">Delete settlement?</p>
            <p className="text-[13px] font-500 text-[#94A3B8] mt-0.5">
              {from?.isMe ? "You" : from?.name.split(" ")[0]} → {to?.isMe ? "you" : to?.name.split(" ")[0]} · {fmt(settlement.amount)}
            </p>
          </div>
        </div>
        <div className="bg-[#FFF5F5] border border-[#FECACA] rounded-[12px] px-4 py-3 mb-4">
          <p className="text-[13px] font-500 text-[#DC2626] leading-relaxed">
            This will reverse the settlement and update member balances. Total Spent will not change.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="pressable flex-1 h-12 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-700 text-[15px]">Cancel</button>
          <button onClick={onConfirm} className="pressable flex-1 h-12 rounded-[13px] bg-[#DC2626] text-white font-700 text-[15px]">Delete</button>
        </div>
      </div>
    </Sheet>
  );
}
