import { HugeiconsIcon } from "@hugeicons/react";
import { Notification03Icon } from "@hugeicons/core-free-icons";
import { Avatar } from "../../../components/shared/Avatar";

export default function HomeHeader({ userName }: { userName: string }) {
  return (
    <div className="px-4 pt-[env(safe-area-inset-top)] pb-3 bg-white border-b border-[#E1E7EF]">
      <div className="flex items-center gap-3 pt-2">
        <Avatar
          member={{ initials: userName.slice(0, 2).toUpperCase(), color: "#0A86A0" }}
          size={42}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-[#94A3B8] font-500 leading-none">Good evening,</p>
          <p className="text-[18px] font-700 text-[#0F172A] leading-snug mt-0.5 truncate">{userName}</p>
        </div>
        <button
          className="pressable relative w-10 h-10 flex items-center justify-center rounded-full text-[#475569] hover:bg-[#F4F6F9]"
          aria-label="Notifications"
        >
          <HugeiconsIcon icon={Notification03Icon} size={22} color="currentColor" strokeWidth={1.5} />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#DC2626] border-2 border-white" />
        </button>
      </div>
    </div>
  );
}
