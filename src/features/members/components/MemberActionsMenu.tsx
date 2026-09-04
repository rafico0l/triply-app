import Sheet from "../../../components/shared/Sheet";
import { IconUserPlus } from "../../../components/shared/icons";

export default function MemberActionsMenu({ onClose, onInvite, onAddGuest }: {
  onClose: () => void; onInvite: () => void; onAddGuest: () => void;
}) {
  return (
    <Sheet onClose={onClose}>
      <div className="px-3 py-3 space-y-0.5">
        <button onClick={() => { onInvite(); onClose(); }} className="pressable w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] text-left hover:bg-[#F4F6F9]">
          <div className="w-9 h-9 rounded-[10px] bg-[#EFF9FB] flex items-center justify-center text-[#0A86A0] shrink-0">
            <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
          </div>
          <div>
            <p className="text-[15px] font-600 text-[#0F172A] leading-snug">Invite members</p>
            <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">Share the invite link with your group</p>
          </div>
        </button>
        <button onClick={() => { onAddGuest(); onClose(); }} className="pressable w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] text-left hover:bg-[#F4F6F9]">
          <div className="w-9 h-9 rounded-[10px] bg-[#F4F6F9] flex items-center justify-center text-[#475569] shrink-0">
            <IconUserPlus size={17} />
          </div>
          <div>
            <p className="text-[15px] font-600 text-[#0F172A] leading-snug">Add guest member</p>
            <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">For someone without the app</p>
          </div>
        </button>
      </div>
      <div className="px-3 pb-4 pt-1">
        <button onClick={onClose} className="pressable w-full h-11 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-600 text-[14px]">Cancel</button>
      </div>
    </Sheet>
  );
}
