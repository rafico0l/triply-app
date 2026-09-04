import Sheet from "../../../components/shared/Sheet";
import { Avatar } from "../../../components/shared/Avatar";
import type { Member } from "../../../domain/types";

export default function RemoveMemberConfirmSheet({ member, onConfirm, onClose }: {
  member: Member; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <Avatar member={member} size="md" />
          <div>
            <p className="text-[16px] font-700 text-[#0F172A]">Remove {member.name}?</p>
            <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5 capitalize">{member.role}</p>
          </div>
        </div>
        <p className="text-[14px] font-500 text-[#475569] leading-relaxed mb-4">
          {member.name.split(" ")[0]} will be removed from this tour and will no longer appear in expense splits. This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="pressable flex-1 h-12 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-700 text-[15px]">Cancel</button>
          <button onClick={onConfirm} className="pressable flex-1 h-12 rounded-[13px] bg-[#DC2626] text-white font-700 text-[15px]">Remove</button>
        </div>
      </div>
    </Sheet>
  );
}
