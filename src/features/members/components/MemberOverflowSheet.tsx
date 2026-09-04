import Sheet from "../../../components/shared/Sheet";
import { Avatar } from "../../../components/shared/Avatar";
import { IconEdit, IconUserX } from "../../../components/shared/icons";
import type { Member } from "../../../domain/types";

export default function MemberOverflowSheet({
  member, canEditName, onEditName, onRemove, onClose,
}: {
  member: Member; canEditName: boolean; onEditName: () => void; onRemove: () => void; onClose: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-3 flex items-center gap-3 border-b border-[#F1F5F9]">
        <Avatar member={member} size="sm" />
        <div>
          <p className="text-[15px] font-700 text-[#0F172A] leading-snug">{member.name}</p>
          <p className="text-[12px] font-500 text-[#94A3B8] capitalize">{member.role}</p>
        </div>
      </div>
      <div className="px-3 py-2 space-y-0.5">
        {canEditName && (
          <button onClick={() => { onEditName(); onClose(); }} className="pressable w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] text-left hover:bg-[#F4F6F9]">
            <IconEdit size={18} />
            <span className="text-[15px] font-600 text-[#0F172A]">Edit name</span>
          </button>
        )}
        {!member.isMe && (
          <button onClick={() => { onRemove(); onClose(); }} className="pressable w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] text-left hover:bg-[#FFF5F5]">
            <span className="text-[#DC2626]"><IconUserX size={18} /></span>
            <span className="text-[15px] font-600 text-[#DC2626]">Remove from tour</span>
          </button>
        )}
      </div>
      <div className="px-3 pb-4 pt-1">
        <button onClick={onClose} className="pressable w-full h-11 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-600 text-[14px]">Cancel</button>
      </div>
    </Sheet>
  );
}
