import { useState } from "react";
import Sheet from "../../../components/shared/Sheet";

export default function AddGuestSheet({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string) => void }) {
  const [name, setName] = useState("");
  const trimmed = name.trim();
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        <h2 className="text-[17px] font-700 text-[#0F172A]">Add guest</h2>
        <button onClick={onClose} className="pressable text-[14px] font-600 text-[#94A3B8]">Cancel</button>
      </div>
      <p className="px-5 pb-4 text-[13px] font-500 text-[#475569] leading-relaxed">For someone participating in expenses who won't use the app yet.</p>
      <div className="px-5 pb-6 space-y-3">
        <div>
          <label className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wide block mb-2">Name</label>
          <input
            autoFocus type="text" placeholder="e.g. Hasan Ahmed" value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && trimmed && onAdd(trimmed)}
            className="w-full bg-[#F4F6F9] rounded-[12px] px-4 h-12 text-[15px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none border border-[#E1E7EF] focus:border-[#0A86A0] focus:bg-white transition-colors"
          />
        </div>
        <button onClick={() => trimmed && onAdd(trimmed)} disabled={!trimmed}
          className={`pressable w-full h-[50px] rounded-[13px] font-700 text-[15px] transition-colors ${trimmed ? "bg-[#0A86A0] text-white shadow-[0_4px_16px_rgba(10,134,160,0.22)]" : "bg-[#F1F5F9] text-[#C9D4DF]"}`}
        >
          Add guest
        </button>
      </div>
    </Sheet>
  );
}
