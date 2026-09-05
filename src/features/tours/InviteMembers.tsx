import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  MapPinIcon,
  Link01Icon,
  Copy01Icon,
  CheckIcon,
  Share01Icon,
  UserAdd01Icon,
  ChevronRightIcon,
} from "@hugeicons/core-free-icons";

// ─── InviteMembers ────────────────────────────────────────────────────────────
interface InviteMembersProps {
  tourName:  string;
  tourDates: string;
  onBack:    () => void;
  onDone:    () => void;
}

const INVITE_URL = "tourapp.com/join/K7DQ92";

export default function InviteMembers({ tourName, tourDates, onBack, onDone }: InviteMembersProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(`https://${INVITE_URL}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  function handleShare() {
    if (navigator.share) {
      navigator.share({
        title: `Join ${tourName}`,
        text:  `Track expenses together for ${tourName}. Join here:`,
        url:   `https://${INVITE_URL}`,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  }

  return (
    <div
      className="fixed inset-0 flex flex-col bg-[#F4F6F9] z-50"
      style={{ animation: "slideInFromRight 280ms cubic-bezier(0.32,0.72,0,1)" }}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white shrink-0">
        <div className="flex items-center justify-center px-4 h-[56px] relative safe-top">
          <button
            onClick={onBack}
            className="pressable absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-[#475569] hover:bg-[#F4F6F9] transition-colors"
            aria-label="Go back"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="currentColor" strokeWidth={1.75} />
          </button>
          <h1 className="text-[16px] font-700 text-[#0F172A] leading-none">Invite friends</h1>
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[480px] mx-auto px-5 pt-6 pb-10 space-y-5">

          {/* ── Intro ─────────────────────────────────────────────────────── */}
          <div>
            <h2 className="text-[22px] font-800 text-[#0F172A] leading-tight tracking-[-0.3px]">
              Bring your group in
            </h2>
            <p className="text-[14px] font-500 text-[#64748B] mt-1.5 leading-relaxed">
              Share the invite with your friends so everyone can add expenses and keep balances up to date.
            </p>
          </div>

          {/* ── Trip context card ──────────────────────────────────────────── */}
          <div className="flex items-center gap-3 bg-white rounded-[14px] border border-[#E1E7EF] px-4 py-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            <div className="w-9 h-9 rounded-[10px] bg-[#EFF9FB] flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={MapPinIcon} size={18} color="#0A86A0" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-700 text-[#0F172A] leading-snug truncate">{tourName}</p>
              <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5 leading-none">{tourDates}</p>
            </div>
          </div>

          {/* ── Invite link card ───────────────────────────────────────────── */}
          <div className="bg-white rounded-[14px] border border-[#E1E7EF] shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
            {/* Link section */}
            <div className="px-4 pt-4 pb-3">
              <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider mb-2">Invite link</p>
              <div className="flex items-center gap-2.5 bg-[#F4F6F9] rounded-[10px] px-3 py-2.5 border border-[#E1E7EF]">
                <span className="text-[#0A86A0] shrink-0">
                  <HugeiconsIcon icon={Link01Icon} size={15} color="currentColor" strokeWidth={1.75} />
                </span>
                <p className="flex-1 min-w-0 text-[13px] font-600 text-[#0F172A] truncate font-mono tracking-tight select-all">
                  {INVITE_URL}
                </p>
                <button
                  onClick={handleCopy}
                  className={`pressable shrink-0 w-8 h-8 flex items-center justify-center rounded-[8px] transition-colors ${
                    copied
                      ? "bg-[#F0FDF4] text-[#15803D]"
                      : "text-[#94A3B8] hover:bg-[#E1E7EF] hover:text-[#475569]"
                  }`}
                  aria-label={copied ? "Link copied" : "Copy invite link"}
                >
                  {copied ? (
                    <HugeiconsIcon icon={CheckIcon} size={16} color="currentColor" strokeWidth={2.5} />
                  ) : (
                    <HugeiconsIcon icon={Copy01Icon} size={16} color="currentColor" strokeWidth={1.75} />
                  )}
                </button>
              </div>
              <p className="text-[11px] font-500 text-[#94A3B8] mt-2 leading-relaxed">
                Anyone with this link can join the trip.
              </p>
            </div>

            {/* Share invite button */}
            <div className="px-4 pb-4">
              <button
                onClick={handleShare}
                className="pressable w-full h-[44px] rounded-[12px] border border-[#0A86A0] text-[#0A86A0] font-600 text-[14px] flex items-center justify-center gap-2 hover:bg-[#EFF9FB] transition-colors"
              >
                <HugeiconsIcon icon={Share01Icon} size={16} color="currentColor" strokeWidth={1.75} />
                Share invite
              </button>
            </div>
          </div>

          {/* ── Add guest ──────────────────────────────────────────────────── */}
          <button
            onClick={() => {/* opens guest sheet — preserved placeholder */}}
            className="pressable w-full flex items-center gap-3.5 bg-white rounded-[14px] border border-[#E1E7EF] px-4 py-3.5 shadow-[0_1px_3px_rgba(15,23,42,0.04)] text-left"
          >
            <div className="w-9 h-9 rounded-[10px] bg-[#F4F6F9] border border-[#E1E7EF] flex items-center justify-center shrink-0">
              <HugeiconsIcon icon={UserAdd01Icon} size={17} color="#94A3B8" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-600 text-[#0F172A] leading-snug">Add a guest</p>
              <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5 leading-relaxed">For someone who won't use Triply</p>
            </div>
            <span className="text-[#C9D4DF] shrink-0">
              <HugeiconsIcon icon={ChevronRightIcon} size={18} color="currentColor" strokeWidth={2} />
            </span>
          </button>

        </div>
      </div>

      {/* ── Continue to trip CTA ─────────────────────────────────────────────── */}
      <div className="bg-white border-t border-[#E1E7EF] safe-bottom shrink-0">
        <div className="max-w-[480px] mx-auto px-5 py-3">
          <button
            onClick={onDone}
            className="pressable w-full h-[52px] rounded-[14px] bg-[#0A86A0] text-white font-700 text-[16px] shadow-[0_2px_10px_rgba(10,134,160,0.18)] active:scale-[0.985] transition-all"
          >
            Continue to trip
          </button>
        </div>
      </div>
    </div>
  );
}
