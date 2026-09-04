import { useState } from "react";
import type { Member, RecordedSettlement } from "../../domain/types";
import { fmt } from "../../lib/format";
import { Avatar } from "../../components/shared/Avatar";
import EmptyState from "../../components/shared/EmptyState";
import { IconArrowRight, IconChevronLeft, IconHistory } from "../../components/shared/icons";
import DeleteSettlementSheet from "./components/DeleteSettlementSheet";
import SettlementDetailSheet from "./components/SettlementDetailSheet";

export default function SettlementHistoryView({
  recordedSettlements, members, me, isCurrentUserOwner, onDeleteSettlement, onBack,
}: {
  recordedSettlements: RecordedSettlement[]; members: Member[]; me: Member | undefined;
  isCurrentUserOwner: boolean; onDeleteSettlement: (id: string) => void; onBack: () => void;
}) {
  const [selectedId,      setSelectedId]      = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const selected      = selectedId      ? recordedSettlements.find((s) => s.id === selectedId)      : null;
  const confirmDelete = confirmDeleteId ? recordedSettlements.find((s) => s.id === confirmDeleteId) : null;

  const sorted      = [...recordedSettlements].sort((a, b) => b.dateIso.localeCompare(a.dateIso));
  const uniqueDates = [...new Set(sorted.map((s) => s.dateIso))];
  const grouped     = uniqueDates.map((iso) => ({
    iso,
    label: new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    items: sorted.filter((s) => s.dateIso === iso),
  }));

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F6F9] flex flex-col overflow-hidden" style={{ animation: "slideInFromRight 220ms cubic-bezier(0.32,0.72,0,1)" }}>
      {/* Header */}
      <div className="bg-white border-b border-[#E1E7EF] safe-top shrink-0">
        <div className="flex items-center gap-1 px-2 h-[52px] max-w-[720px] mx-auto w-full">
          <button onClick={onBack} className="pressable w-10 h-10 flex items-center justify-center rounded-full text-[#475569]" aria-label="Go back">
            <IconChevronLeft size={22} />
          </button>
          <h1 className="flex-1 text-[16px] font-700 text-[#0F172A] truncate px-1">Settlement history</h1>
          {recordedSettlements.length > 0 && (
            <span className="num text-[13px] font-500 text-[#94A3B8] pr-2">{recordedSettlements.length}</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto w-full pb-8">
          {grouped.length === 0 ? (
            <EmptyState
              icon={<IconHistory size={28} />}
              title="No settlements recorded"
              body="Settlements you record will appear here."
            />
          ) : (
            <div className="px-4 pt-4 space-y-5">
              {grouped.map(({ iso, label, items }) => (
                <div key={iso}>
                  <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider px-1 mb-2">{label}</p>
                  <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
                    {items.map((s) => {
                      const from     = members.find((m) => m.id === s.from);
                      const to       = members.find((m) => m.id === s.to);
                      const recorder = members.find((m) => m.id === s.recordedBy);
                      if (!from || !to) return null;
                      return (
                        <button key={s.id} onClick={() => setSelectedId(s.id)}
                          className="pressable w-full flex items-center gap-3 px-4 py-3.5 text-left"
                        >
                          <div className="flex items-center shrink-0">
                            <Avatar member={from} size="sm" />
                            <span className="mx-1.5 text-[#94A3B8]"><IconArrowRight size={12} /></span>
                            <Avatar member={to} size="sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-600 text-[#0F172A]">
                              {from.isMe ? "You" : from.name.split(" ")[0]} paid {to.isMe ? "you" : to.name.split(" ")[0]}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <p className="text-[12px] font-500 text-[#94A3B8]">
                                {s.date} · Added by {recorder?.isMe ? "you" : (recorder?.name.split(" ")[0] ?? "unknown")}
                              </p>
                              {s.syncStatus === "pending" && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-600 text-[#B45309]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#B45309] shrink-0" />Pending sync
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="num text-[15px] font-700 text-[#0F172A] shrink-0">{fmt(s.amount)}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <SettlementDetailSheet
          settlement={selected}
          members={members}
          canDelete={me ? (me.id === selected.recordedBy || isCurrentUserOwner) : false}
          onDelete={() => { setConfirmDeleteId(selected.id); setSelectedId(null); }}
          onClose={() => setSelectedId(null)}
        />
      )}

      {confirmDelete && (
        <DeleteSettlementSheet
          settlement={confirmDelete}
          members={members}
          onConfirm={() => { onDeleteSettlement(confirmDelete.id); setConfirmDeleteId(null); }}
          onClose={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}