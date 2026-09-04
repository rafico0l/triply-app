import { useEffect } from "react";
import { IconCheck } from "../../../components/shared/icons";
import { fmt } from "../../../lib/format";

export default function SettlementToast({ fromName, toName, amount, onHide }: {
  fromName: string; toName: string; amount: number; onHide: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onHide, 2800);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
      style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 72px)", animation: "toastIn 300ms cubic-bezier(0.34,1.56,0.64,1) both" }}
    >
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-[#1C1C1E] text-white text-[13px] font-600 shadow-[0_8px_32px_rgba(0,0,0,0.30)] max-w-[340px]">
        <div className="w-[18px] h-[18px] rounded-full bg-[#15803D] flex items-center justify-center shrink-0">
          <IconCheck size={10} />
        </div>
        <span className="truncate">Payment recorded · {fromName} paid {toName} {fmt(amount)}</span>
      </div>
    </div>
  );
}
