import { useState, useEffect } from "react";
import type { SheetMember } from "./PaidBySheet";
import Avatar from "../../../components/shared/Avatar";
import { fmt } from "../../../lib/format";

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconCheck({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── Checkbox ─────────────────────────────────────────────────────────────────
function Checkbox({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  return (
    <div
      className="w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center border-2 transition-all"
      style={{
        backgroundColor: checked ? "#0A86A0" : "transparent",
        borderColor:     checked ? "#0A86A0" : disabled ? "#E1E7EF" : "#C9D4DF",
      }}
    >
      {checked && (
        <span className="text-white">
          <IconCheck size={12} />
        </span>
      )}
    </div>
  );
}

// Avatar provided by src/components/shared/Avatar

// ─── Split Between Sheet ──────────────────────────────────────────────────────
export default function SplitBetweenSheet({
  members,
  selectedIds,
  amount,
  onConfirm,
  onClose,
}: {
  members:     SheetMember[];
  selectedIds: string[];
  amount:      string;
  onConfirm:   (ids: string[]) => void;
  onClose:     () => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedIds));
  const [error,    setError]    = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) { setError(true); return prev; }
        next.delete(id);
      } else {
        next.add(id);
      }
      setError(false);
      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(members.map((m) => m.id)));
    setError(false);
  };

  const allSelected = selected.size === members.length;

  const handleDone = () => {
    if (selected.size === 0) { setError(true); return; }
    onConfirm(Array.from(selected));
    onClose();
  };

  // Live split preview
  const numericAmount = parseFloat(amount);
  const hasAmount     = !isNaN(numericAmount) && numericAmount > 0;
  const count         = selected.size;
  const perPerson     = hasAmount && count > 0 ? numericAmount / count : null;

  const fmt = (n: number) =>
    `৳${n % 1 === 0 ? n.toLocaleString("en-IN") : n.toFixed(2).replace(/\.?0+$/, "")}`;

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
        role="dialog"
        aria-modal="true"
        aria-label="Split between"
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-70 bg-white rounded-t-[20px] safe-bottom flex flex-col"
        style={{ animation: "sheetUp 240ms cubic-bezier(0.32,0.72,0,1)", maxHeight: "85dvh" }}
      >
        {/* Grab handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0" aria-hidden="true">
          <div className="w-9 h-1 bg-[#E1E7EF] rounded-full" />
        </div>

        {/* Title row */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3 border-b border-[#F1F5F9] shrink-0">
          <div>
            <h2 className="text-[16px] font-700 text-[#0F172A] leading-snug">Split between</h2>
            <p className={`text-[12px] font-600 mt-0.5 ${error ? "text-[#DC2626]" : "text-[#94A3B8]"}`}>
              {error
                ? "At least one person must be selected."
                : `${selected.size} of ${members.length} selected`}
            </p>
          </div>
          {!allSelected && (
            <button
              onClick={selectAll}
              className="pressable text-[13px] font-700 text-[#0A86A0]"
            >
              Select all
            </button>
          )}
        </div>

        {/* Member list — scrollable */}
        <div className="overflow-y-auto flex-1">
          {members.map((member, i) => {
            const checked = selected.has(member.id);
            return (
              <button
                key={member.id}
                onClick={() => toggle(member.id)}
                className={`pressable w-full flex items-center gap-3 px-5 py-3.5 text-left transition-colors ${
                  checked ? "bg-[#F8FFFE]" : "bg-white"
                } ${i > 0 ? "border-t border-[#F4F6F9]" : ""}`}
              >
                <Checkbox checked={checked} />
                <Avatar member={member} size={36} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[15px] font-600 leading-snug ${checked ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>
                    {member.name}
                  </p>
                  {member.isMe && (
                    <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5 leading-none">You</p>
                  )}
                </div>
                {/* Per-person amount if calculable */}
                {checked && perPerson !== null && (
                  <span className="num text-[13px] font-600 text-[#475569] shrink-0">
                    {fmt(perPerson)}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live split preview */}
        {hasAmount && (
          <div className="mx-4 my-3 px-4 py-3 bg-[#F4F6F9] rounded-[12px] shrink-0">
            <p className="text-[12px] font-500 text-[#94A3B8] leading-none mb-1">
              {fmt(numericAmount)} ÷ {count} {count === 1 ? "person" : "people"}
            </p>
            <p className="num text-[20px] font-800 text-[#0F172A] leading-none">
              {perPerson !== null ? fmt(perPerson) : "—"}
              <span className="text-[13px] font-500 text-[#94A3B8] ml-1.5">/ person</span>
            </p>
          </div>
        )}

        {/* Done CTA */}
        <div className="px-4 pb-3 pt-2 shrink-0">
          <button
            onClick={handleDone}
            className="pressable w-full flex items-center justify-center rounded-[13px] bg-[#0A86A0] text-white font-700 text-[15px] shadow-[0_2px_10px_rgba(10,134,160,0.18)] transition-all"
            style={{ height: 52 }}
          >
            Done
          </button>
        </div>
      </div>
    </>
  );
}
