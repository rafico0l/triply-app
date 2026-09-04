import type { Member } from "../../../domain/types";
import { MemberRowCompact } from "../../members/components/MemberRow";

export default function QuickBalances({ members, onViewAll, empty = false }: { members: Member[]; onViewAll: () => void; empty?: boolean }) {
  if (empty) {
    return (
      <section className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3"><h2 className="text-[14px] font-700 text-[#0F172A]">Balances</h2></div>
        <div className="bg-white rounded-[14px] border border-[#E1E7EF] px-5 py-5 flex items-center justify-center">
          <p className="text-[13px] text-[#94A3B8] font-500 text-center leading-relaxed">Balances will appear after expenses are added.</p>
        </div>
      </section>
    );
  }
  const sorted = [...members].sort((a, b) => b.balance - a.balance).slice(0, 3);
  return (
    <section className="px-4 pb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[14px] font-700 text-[#0F172A]">Balances</h2>
        <button onClick={onViewAll} className="text-[13px] font-600 text-[#0A86A0] pressable">View all</button>
      </div>
      <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
        {sorted.map((member) => <MemberRowCompact key={member.id} member={member} />)}
      </div>
    </section>
  );
}