import { IconNotification } from "../../../components/shared/icons";
import { Avatar } from "../../../components/shared/Avatar";

export default function HomeHeader({ userName, greeting, onNotificationPress, pendingCount = 0 }: { userName: string; greeting: string; onNotificationPress?: () => void; pendingCount?: number }) {
  return (
    <div className="px-4 pt-[env(safe-area-inset-top)] pb-3 bg-white border-b border-[#E1E7EF]">
      <div className="flex items-center gap-3 pt-2">
        <Avatar
          member={{ initials: userName.slice(0, 2).toUpperCase(), color: "#0A86A0" }}
          size={42}
        />
        <div className="flex-1 min-w-0">
          <p className="text-[12px] text-[#94A3B8] font-500 leading-none">{greeting},</p>
          <p className="text-[18px] font-700 text-[#0F172A] leading-snug mt-0.5 truncate">{userName}</p>
        </div>
        <button
          onClick={onNotificationPress}
          className="pressable relative w-10 h-10 flex items-center justify-center rounded-full text-[#475569] hover:bg-[#F4F6F9]"
          aria-label="Notifications"
        >
          <IconNotification size={22} />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[#DC2626] text-white text-[10px] font-700 flex items-center justify-center px-1 border-2 border-white">
              {pendingCount > 99 ? "99+" : pendingCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
