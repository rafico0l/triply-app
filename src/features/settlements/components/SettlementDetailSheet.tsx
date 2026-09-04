import Sheet from "../../../components/shared/Sheet";
import { Avatar } from "../../../components/shared/Avatar";
import { fmt } from "../../../lib/format";
import type { Member, RecordedSettlement } from "../../../domain/types";
import { IconArrowRight, IconTrash, IconInfo } from "../../../components/shared/icons";

export default function SettlementDetailSheet({
  settlement, members, canDelete, onDelete, onClose,
}: {
  settlement: RecordedSettlement; members: Member[]; canDelete: boolean; onDelete: () => void; onClose: () => void;
}) {
  const from     = members.find((m) => m.id === settlement.from);
  const to       = members.find((m) => m.id === settlement.to);
  const recorder = members.find((m) => m.id === settlement.recordedBy);
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-1 pb-6">
        {/* Avatar pair + amount */}
        <div className="flex items-center justify-center gap-4 py-5 border-b border-[#F4F6F9] mb-4">
          <div className="flex flex-col items-center gap-1.5">
            {from && <Avatar member={from} size="lg" />}
            <p className="text-[12px] font-600 text-[#0F172A]">{from?.isMe ? "You" : from?.name.split(" ")[0]}</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-[#C9D4DF]"><IconArrowRight size={20} /></div>
            <p className="num text-[20px] font-800 text-[#0A86A0]">{fmt(settlement.amount)}</p>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            {to && <Avatar member={to} size="lg" />}
            <p className="text-[12px] font-600 text-[#0F172A]">{to?.isMe ? "You" : to?.name.split(" ")[0]}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-[#F8FAFC] rounded-[12px] border border-[#E1E7EF] overflow-hidden mb-4">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F1F5F9]">
            <span className="text-[12px] font-600 text-[#94A3B8] w-24 shrink-0">Date</span>
            <span className="text-[14px] font-600 text-[#0F172A]">{settlement.date}, 2026</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3">
            <span className="text-[12px] font-600 text-[#94A3B8] w-24 shrink-0">Recorded by</span>
            <span className="text-[14px] font-600 text-[#0F172A]">{recorder?.isMe ? "You" : (recorder?.name ?? "Unknown")}</span>
          </div>
        </div>

        {/* Delete / info */}
        {canDelete ? (
          <button onClick={onDelete} className="pressable w-full flex items-center gap-3 px-4 py-3 rounded-[12px] text-left hover:bg-[#FFF5F5] mb-3">
            <div className="w-8 h-8 rounded-[9px] bg-[#FFF5F5] flex items-center justify-center text-[#DC2626] shrink-0">
              <IconTrash size={15} />
            </div>
            <div>
              <p className="text-[15px] font-600 text-[#DC2626]">Delete settlement</p>
              <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">Balances will recalculate</p>
            </div>
          </button>
        ) : (
          <div className="flex items-start gap-3 px-4 py-3 mb-3">
            <div className="w-8 h-8 rounded-[9px] bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] shrink-0 mt-0.5">
              <IconInfo size={14} />
            </div>
            <p className="text-[13px] font-500 text-[#475569] leading-relaxed">
              Only the person who recorded this or the Tour Owner can delete it.
            </p>
          </div>
        )}

        <button onClick={onClose} className="pressable w-full h-11 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-600 text-[14px]">Close</button>
      </div>
    </Sheet>
  );
}
