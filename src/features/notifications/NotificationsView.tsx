import { useState, useEffect, useCallback } from "react";
import { IconChevronLeft, IconNotification } from "../../components/shared/icons";
import { Avatar } from "../../components/shared/Avatar";
import { fmt } from "../../lib/format";
import { toMajorUnits } from "../../domain/finance";
import type { Member } from "../../domain/types";
import type { NotificationItem } from "./notificationLoader";
import { loadPendingNotifications, formatNotificationError } from "./notificationLoader";
import ReviewRequestSheet from "./ReviewRequestSheet";

export default function NotificationsView({
  me,
  currentTripId,
  currentMembers,
  onBack,
  onRefreshTrip,
}: {
  me: Member;
  currentTripId: string;
  currentMembers: Member[];
  onBack: () => void;
  onRefreshTrip: () => void;
}) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [devError, setDevError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<NotificationItem | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setDevError(null);
      const result = await loadPendingNotifications(currentMembers);
      setNotifications(result.items);
    } catch (err) {
      console.error("[notifications] fetch error:", err);
      setError("Failed to load notifications.");
      if (import.meta.env.DEV) {
        const detail = formatNotificationError(err);
        const parts: string[] = [];
        if (detail.message) parts.push(`message: ${detail.message}`);
        if (detail.code) parts.push(`code: ${detail.code}`);
        if (detail.details) parts.push(`details: ${detail.details}`);
        if (detail.hint) parts.push(`hint: ${detail.hint}`);
        setDevError(parts.join("\n"));
      }
    } finally {
      setLoading(false);
    }
  }, [currentMembers]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  function handleRequestComplete() {
    setSelectedRequest(null);
    fetchNotifications();
    onRefreshTrip();
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#F4F6F9] flex flex-col overflow-hidden" style={{ animation: "slideInFromRight 220ms cubic-bezier(0.32,0.72,0,1)" }}>
      <div className="bg-white border-b border-[#E1E7EF] safe-top shrink-0">
        <div className="flex items-center gap-1 px-2 h-[52px] max-w-[720px] mx-auto w-full">
          <button onClick={onBack} className="pressable w-10 h-10 flex items-center justify-center rounded-full text-[#475569]" aria-label="Go back">
            <IconChevronLeft size={22} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-700 text-[#0F172A] truncate leading-none text-center">Notifications</h1>
          </div>
          <div className="w-10" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-24 max-w-[720px] mx-auto w-full">
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#0A86A0] border-t-transparent rounded-full animate-spin" />
            <p className="text-[13px] font-500 text-[#94A3B8] mt-3">Loading notifications…</p>
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-[14px] font-600 text-[#DC2626] mb-2">{error}</p>
            {import.meta.env.DEV && devError && (
              <pre className="mt-2 px-3 py-2 rounded-[8px] bg-[#F8FAFC] border border-[#E1E7EF] text-[11px] font-500 text-[#0F172A] whitespace-pre-wrap max-w-full mb-3">
                {devError}
              </pre>
            )}
            <button onClick={fetchNotifications} className="pressable text-[13px] font-600 text-[#0A86A0]">Retry</button>
          </div>
        )}

        {!loading && !error && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] mb-3">
              <IconNotification size={24} />
            </div>
            <p className="text-[15px] font-700 text-[#0F172A] mb-1">You're all caught up</p>
            <p className="text-[13px] font-500 text-[#94A3B8]">No settlement requests need your approval.</p>
          </div>
        )}

        {!loading && !error && notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map((n) => (
              <button
                key={n.requestId}
                onClick={() => setSelectedRequest(n)}
                className="pressable w-full text-left bg-white rounded-[14px] border border-[#E1E7EF] px-4 py-3.5 hover:bg-[#F8FAFC] transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0 mt-0.5">
                    <Avatar
                      member={{ initials: n.fromMember.initials, color: n.fromMember.color }}
                      size={38}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-600 text-[#0F172A] leading-snug">
                      {n.requestType === "edit" ? "Settlement change requested" : "Settlement deletion requested"}
                    </p>
                    <p className="text-[13px] font-500 text-[#475569] mt-1 leading-snug">
                      {n.requestType === "edit" ? (
                        <>
                          {n.requesterName} wants to change a settlement from{" "}
                          {fmt(toMajorUnits(n.originalAmountMinor))} to{" "}
                          {fmt(toMajorUnits(n.proposedAmountMinor ?? 0))}.
                        </>
                      ) : (
                        <>
                          {n.requesterName} wants to delete a{" "}
                          {fmt(toMajorUnits(n.originalAmountMinor))} settlement.
                        </>
                      )}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] font-500 text-[#94A3B8]">{n.tripName}</span>
                      <span className="text-[11px] font-500 text-[#94A3B8]">·</span>
                      <span className="text-[11px] font-500 text-[#94A3B8]">
                        {new Date(n.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                      {n.totalApprovalRows > 1 && (
                        <>
                          <span className="text-[11px] font-500 text-[#94A3B8]">·</span>
                          <span className="text-[11px] font-500 text-[#B45309]">
                            {n.approvalCount}/{n.totalApprovalRows} approvals
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 self-center">
                    <div className="w-2 h-2 rounded-full bg-[#0A86A0]" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedRequest && (
        <ReviewRequestSheet
          request={selectedRequest}
          me={me}
          onClose={() => setSelectedRequest(null)}
          onComplete={handleRequestComplete}
        />
      )}
    </div>
  );
}
