import { useState } from "react";
import Sheet from "../../../components/shared/Sheet";
import { IconUserX } from "../../../components/shared/icons";
import type { Member, Expense, RecordedSettlement } from "../../../domain/types";
import { computeMemberFinancials } from "../../../domain/finance";
import { leaveTrip } from "../../../lib/tripRepository";
import { TripRepositoryError } from "../../../lib/tripRepository";

export default function LeaveTripSheet({ member, members, expenses, settlements, onLeave, onClose }: {
  member: Member;
  members: Member[];
  expenses: Expense[];
  settlements: RecordedSettlement[];
  onLeave: () => void;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const financials = computeMemberFinancials(member.id, members, expenses, settlements);
  const hasBalance = financials.balanceMinor !== 0;

  async function handleLeave() {
    setLoading(true);
    setError(null);
    try {
      await leaveTrip(member.id);
      onLeave();
    } catch (err) {
      if (err instanceof TripRepositoryError) {
        setError(err.message);
      } else {
        setError("Failed to leave trip. Please try again.");
      }
      setLoading(false);
    }
  }

  if (hasBalance) {
    return (
      <Sheet onClose={onClose}>
        <div className="px-5 pt-3 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[#FFF5F5] text-[#DC2626] shrink-0">
              <IconUserX size={18} />
            </div>
            <div>
              <p className="text-[16px] font-700 text-[#0F172A] leading-snug">Unsettled balance</p>
            </div>
          </div>
          <div className="bg-[#FFF5F5] border border-[#FECACA] rounded-[12px] px-4 py-3 mb-4">
            <p className="text-[13px] font-500 text-[#DC2626] leading-relaxed">
              You still have an unsettled balance. Settle up before leaving.
            </p>
          </div>
          <button onClick={onClose} className="pressable w-full h-12 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-700 text-[15px]">Go back</button>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[12px] flex items-center justify-center bg-[#FFF5F5] text-[#DC2626] shrink-0">
            <IconUserX size={18} />
          </div>
          <div>
            <p className="text-[16px] font-700 text-[#0F172A] leading-snug">Leave this trip?</p>
          </div>
        </div>
        <p className="text-[14px] font-500 text-[#475569] leading-relaxed mb-4">
          You&apos;ll lose access to this trip after leaving. You can join again later using an invite link or join code.
        </p>

        {error && (
          <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-[12px] px-4 py-3 mb-4">
            <p className="text-[13px] font-600 text-[#DC2626]">{error}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} disabled={loading}
            className="pressable flex-1 h-12 rounded-[13px] bg-[#F4F6F9] text-[#475569] font-700 text-[15px]">
            Cancel
          </button>
          <button onClick={handleLeave} disabled={loading}
            className="pressable flex-1 h-12 rounded-[13px] bg-[#DC2626] text-white font-700 text-[15px] flex items-center justify-center gap-2">
            {loading ? "Leaving\u2026" : "Leave trip"}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
