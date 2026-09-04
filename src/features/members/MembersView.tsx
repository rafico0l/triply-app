import { useState } from "react";
import type { Member, Expense } from "../../domain/types";
import { MemberRow } from "./components/MemberRow";
import MemberActionsMenu from "./components/MemberActionsMenu";
import InviteSheet from "./components/InviteSheet";
import AddGuestSheet from "./components/AddGuestSheet";
import { fmt } from "../../lib/format";
import { IconPlus } from "../../components/shared/icons";
import { TOUR } from "../../lib/tour";

export default function MembersView({
  members, expenses, actionsOpen, onActionsClose, onSetMembers, onTapMember,
}: {
  members: Member[]; expenses: Expense[];
  actionsOpen: boolean; onActionsClose: () => void;
  onSetMembers: (m: Member[]) => void; onTapMember: (id: string) => void;
}) {
  const [showInvite,   setShowInvite]   = useState(false);
  const [showAddGuest, setShowAddGuest] = useState(false);

  const sorted     = [...members].sort((a, b) => b.balance - a.balance);
  const totalOwed  = members.reduce((s, m) => s + Math.max(m.balance, 0), 0);
  const totalOwing = members.reduce((s, m) => s + Math.max(-m.balance, 0), 0);
  const onlyOwner  = members.length === 1 && members[0].isMe;

  function handleAddGuest(name: string) {
    const initials = name.split(" ").map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 2);
    onSetMembers([...members, { id: `g${Date.now()}`, name, initials, color: "#64748B", balance: 0, paid: 0, role: "guest" }]);
    setShowAddGuest(false);
  }

  return (
    <div>
      {/* Balance summary card */}
      {!onlyOwner && (
        <div className="px-4 pt-4 pb-2">
          <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-[#F1F5F9]">
              <div className="px-4 py-3">
                <p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">Total outstanding</p>
                <p className="num text-[18px] font-700 text-[#DC2626] leading-snug">{fmt(totalOwing)}</p>
                <p className="text-[11px] font-500 text-[#94A3B8] mt-0.5">still to settle</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-[11px] font-600 text-[#94A3B8] uppercase tracking-wide mb-1">To receive</p>
                <p className="num text-[18px] font-700 text-[#15803D] leading-snug">{fmt(totalOwed)}</p>
                <p className="text-[11px] font-500 text-[#94A3B8] mt-0.5">across {members.filter((m) => m.balance > 0).length} members</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Solo invite prompt */}
      {onlyOwner && (
        <div className="px-4 pt-4 pb-2">
          <div className="bg-[#EFF9FB] border border-[#A3DFE9] rounded-[14px] px-4 py-4">
            <p className="text-[14px] font-700 text-[#0A7490] mb-1">It's just you so far</p>
            <p className="text-[13px] font-500 text-[#0A86A0] leading-relaxed mb-3">Invite your travel group to start tracking expenses together.</p>
            <button onClick={() => setShowInvite(true)} className="pressable flex items-center gap-1.5 px-4 h-9 rounded-full bg-[#0A86A0] text-white font-700 text-[13px]">
              <IconPlus size={14} />
              Invite members
            </button>
          </div>
        </div>
      )}

      {/* Member list */}
      <div className="px-4 pt-2 pb-4">
        <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-1 mb-2">
          All members · {members.length}
        </p>
        <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
          {sorted.map((m) => (
            <MemberRow key={m.id} member={m} expenses={expenses} onTap={() => onTapMember(m.id)} />
          ))}
        </div>
      </div>

      {/* Note about guests */}
      {members.some((m) => m.role === "guest") && (
        <p className="px-5 pb-4 text-[12px] font-500 text-[#94A3B8] text-center">
          Guest members participate in expenses but haven't joined Triply yet.
        </p>
      )}

      {actionsOpen && (
        <MemberActionsMenu onClose={onActionsClose} onInvite={() => setShowInvite(true)} onAddGuest={() => setShowAddGuest(true)} />
      )}
      {showInvite    && <InviteSheet onClose={() => setShowInvite(false)} tourName={TOUR.name} />}
      {showAddGuest  && <AddGuestSheet onClose={() => setShowAddGuest(false)} onAdd={handleAddGuest} />}
    </div>
  );
}
