import { useEffect, useRef } from "react";
import Avatar from "../../../components/shared/Avatar";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SheetMember {
  id:       string;
  name:     string;
  initials: string;
  color:    string;
  isMe?:    boolean;
}

// ─── Icon ─────────────────────────────────────────────────────────────────────
function IconCheck({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// Avatar provided by src/components/shared/Avatar

// ─── Paid By Sheet ────────────────────────────────────────────────────────────
export default function PaidBySheet({
  members,
  selectedId,
  onSelect,
  onClose,
}: {
  members:    SheetMember[];
  selectedId: string;
  onSelect:   (id: string) => void;
  onClose:    () => void;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Trap scroll on the body while sheet is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  return (
    <>
      {/* Scrim */}
      <div
        className="fixed inset-0 z-60 bg-black/30"
        style={{ animation: "fadeIn 150ms ease" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="Who paid?"
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-70 bg-white rounded-t-[20px] safe-bottom"
        style={{ animation: "sheetUp 240ms cubic-bezier(0.32,0.72,0,1)" }}
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-3 pb-1" aria-hidden="true">
          <div className="w-9 h-1 bg-[#E1E7EF] rounded-full" />
        </div>

        {/* Title */}
        <div className="px-5 pt-2 pb-3 border-b border-[#F1F5F9]">
          <h2 className="text-[16px] font-700 text-[#0F172A] leading-snug">Who paid?</h2>
        </div>

        {/* Member list */}
        <div className="overflow-y-auto" style={{ maxHeight: "min(420px, 60dvh)" }}>
          {members.map((member, i) => {
            const selected = member.id === selectedId;
            return (
              <button
                key={member.id}
                onClick={() => handleSelect(member.id)}
                className={`pressable w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${
                  selected ? "bg-[#EFF9FB]" : "hover:bg-[#F8FAFC]"
                } ${i > 0 ? "border-t border-[#F4F6F9]" : ""}`}
              >
                <Avatar member={member} size={36} />

                <div className="flex-1 min-w-0">
                  <p className={`text-[15px] font-600 leading-snug ${selected ? "text-[#0A7490]" : "text-[#0F172A]"}`}>
                    {member.name}
                  </p>
                  {member.isMe && (
                    <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5 leading-none">You</p>
                  )}
                </div>

                {/* Checkmark — only rendered when selected so layout never shifts */}
                <div className="w-6 h-6 shrink-0 flex items-center justify-center">
                  {selected && (
                    <span className="text-[#0A86A0]">
                      <IconCheck size={18} />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom padding for home indicator */}
        <div className="h-2" />
      </div>
    </>
  );
}
