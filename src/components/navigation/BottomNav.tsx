import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  MapPinIcon,
  Add01Icon,
  Invoice01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import type { Tab } from "../../types/navigation";

interface NavItem {
  id: Tab;
  label: string;
  icon: typeof Home01Icon;
}

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Home", icon: Home01Icon },
  { id: "trips", label: "Trips", icon: MapPinIcon },
  { id: "expenses", label: "Expenses", icon: Invoice01Icon },
  { id: "settings", label: "Settings", icon: Settings01Icon },
];

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onAddExpense: () => void;
  addExpenseEnabled?: boolean;
}

export default function BottomNav({
  activeTab,
  onTabChange,
  onAddExpense,
  addExpenseEnabled = true,
}: BottomNavProps) {
  return (
    <div className="flex items-stretch h-[60px] relative">
      {NAV_ITEMS.map((item, idx) => {
        const isActive = item.id === activeTab;

        if (idx === 2) {
          return <div key="spacer" className="flex-1" />;
        }

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

      <button
        onClick={onAddExpense}
        disabled={!addExpenseEnabled}
        className={`pressable absolute left-1/2 -translate-x-1/2 -top-3 w-[48px] h-[48px] rounded-full flex items-center justify-center transition-all ${
          addExpenseEnabled
            ? "bg-[#0A86A0] text-white shadow-[0_2px_12px_rgba(10,134,160,0.25)] active:scale-95"
            : "bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed"
        }`}
        aria-label="Add expense"
        aria-disabled={!addExpenseEnabled}
      >
        <HugeiconsIcon
          icon={Add01Icon}
          size={22}
          color="currentColor"
          strokeWidth={2}
        />
      </button>
    </div>
  );
}
