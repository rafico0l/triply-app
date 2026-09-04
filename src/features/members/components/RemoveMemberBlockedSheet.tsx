import Sheet from "../../../components/shared/Sheet";
import { IconAlertCircle } from "../../../components/shared/icons";
import type { Member } from "../../../domain/types";

export default function RemoveMemberBlockedSheet({ member, reason, onClose }: {
  member: Member; reason: string; onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[12px] bg-[#FFFBEB] flex items-center justify-center text-[#B45309] shrink-0">
            <IconAlertCircle size={18} />
          </div>
          <div>
            <p className="text-[16px] font-700 text-[#0F172A]">Can't remove {member.name.split(" ")[0]}</p>
          </div>
        </div>
        <p className="text-[14px] font-500 text-[#475569] leading-relaxed mb-4">{reason}</p>
        <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-[12px] px-4 py-3 mb-4">
          <p className="text-[13px] font-600 text-[#B45309]">
            Their financial history must stay with the tour to keep balances accurate for everyone.
          </p>
        </div>
        <button onClick={onClose} className="pressable w-full h-12 rounded-[13px] bg-[#0A86A0] text-white font-700 text-[15px]">Got it</button>
      </div>
    </Sheet>
  );
}
