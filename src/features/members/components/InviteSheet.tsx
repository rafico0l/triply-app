import { useState } from "react";
import Sheet from "../../../components/shared/Sheet";

export default function InviteSheet({ onClose, tourName }: { onClose: () => void; tourName: string }) {
  const [copied, setCopied] = useState(false);
  const INVITE_URL = "tourapp.com/join/K7DQ92";
  function handleCopy() { navigator.clipboard.writeText(`https://${INVITE_URL}`).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2200); }
  function handleShare() { if (navigator.share) { navigator.share({ title: `Join ${tourName}`, url: `https://${INVITE_URL}` }).catch(() => {}); } else { handleCopy(); } }
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        <h2 className="text-[17px] font-700 text-[#0F172A]">Invite your group</h2>
        <button onClick={onClose} className="pressable text-[14px] font-600 text-[#94A3B8]">Done</button>
      </div>
      <div className="px-5 pb-6 pt-2 space-y-3">
        <div className="flex items-center gap-3 bg-[#F4F6F9] rounded-[12px] px-3.5 py-3 border border-[#E1E7EF]">
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#0A86A0" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
          </svg>
          <p className="flex-1 text-[13px] font-600 text-[#0F172A] truncate">{INVITE_URL}</p>
        </div>
        <button onClick={handleShare} className="pressable w-full h-[50px] rounded-[13px] bg-[#0A86A0] text-white font-700 text-[15px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(10,134,160,0.22)]">
          <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Share invite
        </button>
        <button onClick={handleCopy} className={`pressable w-full h-[44px] rounded-[13px] border font-600 text-[14px] flex items-center justify-center gap-2 transition-colors ${copied ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]" : "bg-white border-[#E1E7EF] text-[#475569]"}`}>
          {copied
            ? <><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>Link copied</>
            : <><svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copy link</>
          }
        </button>
      </div>
    </Sheet>
  );
}
