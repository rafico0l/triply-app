import { useState } from "react";
import Sheet from "../../components/shared/Sheet";

export default function EditProfileSheet({ initialName, onSave, onClose }: {
  initialName: string;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialName);
  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        <h2 className="text-[17px] font-700 text-[#0F172A]">Edit profile</h2>
        <button onClick={onClose} className="pressable text-[14px] font-600 text-[#94A3B8]">Cancel</button>
      </div>
      <div className="px-5 pb-6 pt-3 space-y-3">
        <div>
          <label className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wide block mb-2">Display name</label>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && name.trim() && onSave(name.trim())}
            className="w-full bg-[#F4F6F9] rounded-[12px] px-4 h-12 text-[15px] font-500 text-[#0F172A] outline-none border border-[#E1E7EF] focus:border-[#0A86A0] focus:bg-white transition-colors"
          />
        </div>
        <button
          onClick={() => name.trim() && onSave(name.trim())}
          disabled={!name.trim()}
          className={`pressable w-full h-[50px] rounded-[13px] font-700 text-[15px] transition-colors ${name.trim() ? "bg-[#0A86A0] text-white shadow-[0 4px_16px_rgba(10,134,160,0.22)]" : "bg-[#F1F5F9] text-[#C9D4DF]"}`}
        >
          Save
        </button>
      </div>
    </Sheet>
  );
}
