import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home03Icon,
  Briefcase08Icon,
  Wallet03Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import type { Tab } from "../../types/navigation";

interface NavItem {
  id: Tab;
  label: string;
  icon: typeof Home03Icon;
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: Home03Icon },
  { id: "trips", label: "Trips", icon: Briefcase08Icon },
  { id: "expenses", label: "Expenses", icon: Wallet03Icon },
  { id: "settings", label: "Settings", icon: Settings01Icon },
];

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function BottomNav({
  activeTab,
  onTabChange,
}: BottomNavProps) {
  return (
    <div className="flex items-stretch h-[60px]">
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === activeTab;

        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-[3px] nav-item pressable ${
              isActive ? "text-[#0A86A0]" : "text-[#94A3B8]"
            }`}
            aria-label={`${item.label} tab`}
            aria-current={isActive ? "page" : undefined}
          >
            <HugeiconsIcon
              icon={item.icon}
              size={22}
              color="currentColor"
              strokeWidth={isActive ? 1.75 : 1.5}
            />
            <span
              className={`text-[10px] font-600 ${
                isActive ? "text-[#0A86A0]" : "text-[#94A3B8]"
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
