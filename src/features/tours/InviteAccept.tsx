import { useState, useEffect } from "react";
import Avatar from "../../components/shared/Avatar";
import { IconMapPin } from "../../components/shared/icons";
import { AuthFlow } from "../auth/Auth";

// ─── Demo invite data ─────────────────────────────────────────────────────────
// In production, this would be resolved from the invite code via API.
const INVITE_TOUR = {
  name:      "Cox's Bazar Getaway",
  location:  "Cox's Bazar",
  dates:     "Aug 22–27, 2026",
  organizer: "Rafi",
  code:      "K7DQ92",
  valid:     true,
};

// Guest members in this tour who might be claiming their spot.
// In production, fetched alongside the invite token.
const INVITE_GUESTS = [
  { id: "7", name: "Hasan Ahmed",  initials: "HA", color: "#64748B" },
  { id: "8", name: "Rahim Ahmed",  initials: "RA", color: "#64748B" },
];

// Demo: name used for "Join as …" after authentication.
const JOINER_NAME = "Nadia Islam";

// ─── Types ────────────────────────────────────────────────────────────────────
type JoinStep =
  | "landing"
  | "auth"
  | "resolution"
  | "claimConfirm"
  | "joinConfirm"
  | "invalid";

type Guest = (typeof INVITE_GUESTS)[number];

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconCalendar({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconChevronRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function IconChevronLeft({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconLinkBroken({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}

function IconCheck({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── Product mark (matches Auth.tsx) ─────────────────────────────────────────
function AppMark() {
  return (
    <div className="w-10 h-10 rounded-[12px] bg-[#0A86A0] flex items-center justify-center shadow-[0_2px_12px_rgba(10,134,160,0.22)] shrink-0">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="5"  r="2" fill="white" />
        <circle cx="7"  cy="19" r="2" fill="white" />
        <circle cx="17" cy="19" r="2" fill="white" />
        <path d="M12 7v5M12 12l-3.5 5M12 12l3.5 5" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
    </div>
  );
}

// Avatar provided by src/components/shared/Avatar

// ─── Toast ────────────────────────────────────────────────────────────────────
function JoinedToast({ tourName }: { tourName: string }) {
  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] safe-bottom"
      style={{ animation: "toastIn 300ms cubic-bezier(0.32,0.72,0,1)" }}
    >
      <div className="flex items-center gap-2.5 bg-[#0F172A] text-white px-4 py-3 rounded-[14px] shadow-[0_8px_32px_rgba(15,23,42,0.22)] max-w-[320px]">
        <div className="w-6 h-6 rounded-full bg-[#15803D] flex items-center justify-center shrink-0">
          <IconCheck size={13} />
        </div>
        <p className="text-[14px] font-600 leading-snug">Joined {tourName}</p>
      </div>
    </div>
  );
}

// ─── Step: Invite Landing ─────────────────────────────────────────────────────
function InviteLanding({ onJoin, onInvalid }: { onJoin: () => void; onInvalid: () => void }) {
  return (
    <div
      className="fixed inset-0 flex flex-col bg-white"
      style={{ animation: "slideInFromRight 280ms cubic-bezier(0.32,0.72,0,1)" }}
    >
      {/* Safe-area spacer */}
      <div className="safe-top shrink-0" />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[480px] mx-auto px-6 pt-8 pb-6 flex flex-col">

          {/* Brand + invitation attribution */}
          <div className="flex items-center gap-2.5 mb-10">
            <AppMark />
            <span className="text-[17px] font-800 text-[#0F172A] tracking-tight">Triply</span>
          </div>

          {/* Invitation copy */}
          <p className="text-[14px] font-500 text-[#94A3B8] mb-1.5">
            <span className="font-700 text-[#475569]">{INVITE_TOUR.organizer}</span> invited you to
          </p>
          <h1 className="text-[28px] font-800 text-[#0F172A] tracking-[-0.4px] leading-tight mb-8">
            {INVITE_TOUR.name}
          </h1>

          {/* Tour context card — restrained, no financials */}
          <div className="bg-[#F4F6F9] rounded-[16px] border border-[#E1E7EF] px-5 py-4 space-y-3">
            <div className="flex items-center gap-2 text-[#475569]">
              <IconMapPin size={14} />
              <span className="text-[14px] font-600 text-[#0F172A]">{INVITE_TOUR.location}</span>
            </div>
            <div className="flex items-center gap-2 text-[#94A3B8]">
              <IconCalendar size={13} />
              <span className="text-[13px] font-500 text-[#475569]">{INVITE_TOUR.dates}</span>
            </div>
          </div>

          {/* Subtle invite URL context */}
          <p className="mt-5 text-[12px] font-500 text-[#94A3B8]">
            tourapp.com/join/{INVITE_TOUR.code}
          </p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="bg-white border-t border-[#E1E7EF] safe-bottom shrink-0">
        <div className="max-w-[480px] mx-auto px-6 py-4 space-y-2.5">
          <button
            onClick={onJoin}
            className="pressable w-full h-[52px] rounded-[14px] bg-[#0A86A0] text-white font-700 text-[16px] shadow-[0_4px_16px_rgba(10,134,160,0.22)] active:scale-[0.98] transition-transform"
          >
            Join tour
          </button>
          <p className="text-center text-[13px] font-500 text-[#94A3B8]">
            By joining you agree to share expenses with the group.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Step: Membership resolution ─────────────────────────────────────────────
function MemberResolution({
  userName,
  guests,
  onClaimGuest,
  onNotListed,
}: {
  userName: string;
  guests: Guest[];
  onClaimGuest: (g: Guest) => void;
  onNotListed: () => void;
}) {
  return (
    <div
      className="fixed inset-0 flex flex-col bg-[#F4F6F9]"
      style={{ animation: "slideInFromRight 280ms cubic-bezier(0.32,0.72,0,1)" }}
    >
      <div className="safe-top shrink-0" />

      {/* Header */}
      <div className="bg-white border-b border-[#E1E7EF] shrink-0">
        <div className="max-w-[480px] mx-auto px-6 h-[52px] flex items-center">
          <div className="flex items-center gap-2">
            <AppMark />
            <span className="text-[15px] font-700 text-[#0F172A]">Cox's Bazar Getaway</span>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[480px] mx-auto px-5 pt-7 pb-8">

          <h2 className="text-[22px] font-800 text-[#0F172A] tracking-tight leading-tight mb-2">
            Are you already in this group?
          </h2>
          <p className="text-[14px] font-500 text-[#475569] leading-relaxed mb-6 max-w-[340px]">
            {INVITE_TOUR.organizer} may have added you earlier so expenses could be tracked before you joined.
          </p>

          {/* Guest list */}
          <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
            {guests.map((g) => (
              <div key={g.id} className="flex items-center gap-3 px-4 py-3.5">
                <Avatar member={g} size={40} />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-600 text-[#0F172A] leading-snug">{g.name}</p>
                  <span className="text-[11px] font-600 text-[#94A3B8] bg-[#F1F5F9] px-1.5 py-[2px] rounded-full leading-none">
                    Guest
                  </span>
                </div>
                <button
                  onClick={() => onClaimGuest(g)}
                  className="pressable flex items-center gap-1 px-3 h-8 rounded-full bg-[#EFF9FB] text-[#0A7490] font-700 text-[13px] border border-[#A3DFE9] shrink-0"
                >
                  This is me
                  <IconChevronRight size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-[#E1E7EF] safe-bottom shrink-0">
        <div className="max-w-[480px] mx-auto px-6 py-4">
          <button
            onClick={onNotListed}
            className="pressable w-full h-11 flex items-center justify-center text-[14px] font-600 text-[#475569]"
          >
            I'm not listed — join as {userName.split(" ")[0]}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step: Claim guest confirmation ──────────────────────────────────────────
function ClaimConfirm({
  guest,
  onConfirm,
  onBack,
}: {
  guest: Guest;
  onConfirm: () => void;
  onBack: () => void;
}) {
  return (
    <div
      className="fixed inset-0 flex flex-col bg-white"
      style={{ animation: "slideInFromRight 280ms cubic-bezier(0.32,0.72,0,1)" }}
    >
      <div className="safe-top shrink-0" />

      {/* Back nav */}
      <div className="bg-white border-b border-[#E1E7EF] shrink-0">
        <div className="max-w-[480px] mx-auto px-4 h-[52px] flex items-center gap-2">
          <button
            onClick={onBack}
            className="pressable -ml-1 w-9 h-9 flex items-center justify-center rounded-full text-[#475569]"
            aria-label="Go back"
          >
            <IconChevronLeft />
          </button>
          <span className="text-[15px] font-700 text-[#0F172A]">Confirm your identity</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[480px] mx-auto px-6 pt-8 pb-6">

          {/* Guest being claimed */}
          <div className="flex items-center gap-4 mb-8">
            <Avatar member={guest} size={40} />
            <div>
              <p className="text-[18px] font-800 text-[#0F172A] leading-snug">
                Claim {guest.name}?
              </p>
              <span className="text-[11px] font-600 text-[#94A3B8] bg-[#F1F5F9] px-1.5 py-[2px] rounded-full leading-none">
                Guest
              </span>
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-[#EFF9FB] border border-[#A3DFE9] rounded-[14px] px-4 py-4">
            <p className="text-[14px] font-600 text-[#0A7490] leading-relaxed">
              Your account will be connected to this member and its existing expenses and balance.
            </p>
          </div>

          <p className="mt-4 text-[13px] font-500 text-[#94A3B8] leading-relaxed">
            All past expenses, payments, and settlement obligations will carry over to your account.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-[#E1E7EF] safe-bottom shrink-0">
        <div className="max-w-[480px] mx-auto px-6 py-4 space-y-2.5">
          <button
            onClick={onConfirm}
            className="pressable w-full h-[52px] rounded-[14px] bg-[#0A86A0] text-white font-700 text-[15px] shadow-[0_4px_16px_rgba(10,134,160,0.22)] active:scale-[0.98] transition-transform"
          >
            Yes, that's me
          </button>
          <button
            onClick={onBack}
            className="pressable w-full h-11 text-[14px] font-600 text-[#94A3B8]"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step: Join as new member confirmation ────────────────────────────────────
function JoinConfirm({
  userName,
  onConfirm,
  onBack,
}: {
  userName: string;
  onConfirm: () => void;
  onBack: () => void;
}) {
  const firstName = userName.split(" ")[0];
  return (
    <div
      className="fixed inset-0 flex flex-col bg-white"
      style={{ animation: "slideInFromRight 280ms cubic-bezier(0.32,0.72,0,1)" }}
    >
      <div className="safe-top shrink-0" />

      {/* Back nav */}
      <div className="bg-white border-b border-[#E1E7EF] shrink-0">
        <div className="max-w-[480px] mx-auto px-4 h-[52px] flex items-center gap-2">
          <button
            onClick={onBack}
            className="pressable -ml-1 w-9 h-9 flex items-center justify-center rounded-full text-[#475569]"
            aria-label="Go back"
          >
            <IconChevronLeft />
          </button>
          <span className="text-[15px] font-700 text-[#0F172A]">Join tour</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[480px] mx-auto px-6 pt-8 pb-6">

          <h2 className="text-[22px] font-800 text-[#0F172A] tracking-tight leading-tight mb-2">
            Join as {userName}?
          </h2>
          <p className="text-[14px] font-500 text-[#475569] leading-relaxed mb-8 max-w-[320px]">
            You'll be added to {INVITE_TOUR.name} as a new member.
          </p>

          {/* Tour recap */}
          <div className="bg-[#F4F6F9] rounded-[14px] border border-[#E1E7EF] px-4 py-4 space-y-3">
            <div className="flex items-center gap-2">
              <IconMapPin size={13} />
              <span className="text-[13px] font-600 text-[#0F172A]">{INVITE_TOUR.location}</span>
            </div>
            <div className="flex items-center gap-2 text-[#94A3B8]">
              <IconCalendar size={12} />
              <span className="text-[13px] font-500 text-[#475569]">{INVITE_TOUR.dates}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-[#E1E7EF] safe-bottom shrink-0">
        <div className="max-w-[480px] mx-auto px-6 py-4 space-y-2.5">
          <button
            onClick={onConfirm}
            className="pressable w-full h-[52px] rounded-[14px] bg-[#0A86A0] text-white font-700 text-[16px] shadow-[0_4px_16px_rgba(10,134,160,0.22)] active:scale-[0.98] transition-transform"
          >
            Join as {firstName}
          </button>
          <button
            onClick={onBack}
            className="pressable w-full h-11 text-[14px] font-600 text-[#94A3B8]"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Step: Invalid invite ─────────────────────────────────────────────────────
function InvalidInvite({ onGoToTours }: { onGoToTours: () => void }) {
  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      <div className="safe-top shrink-0" />

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-16 h-16 rounded-[20px] bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] mb-6">
          <IconLinkBroken size={28} />
        </div>
        <h2 className="text-[22px] font-800 text-[#0F172A] tracking-tight mb-2">
          This invite is no longer valid
        </h2>
        <p className="text-[14px] font-500 text-[#64748B] leading-relaxed max-w-[280px]">
          Ask the tour organizer for a new invitation.
        </p>
      </div>

      <div className="bg-white border-t border-[#E1E7EF] safe-bottom shrink-0">
        <div className="max-w-[480px] mx-auto px-6 py-4">
          <button
            onClick={onGoToTours}
            className="pressable w-full h-[50px] rounded-[13px] bg-[#F4F6F9] text-[#475569] font-700 text-[15px]"
          >
            Go to my tours
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main flow ────────────────────────────────────────────────────────────────
export default function InviteAcceptFlow({
  isAuthenticated,
  onAuthenticate,
  onJoined,
  onGoToTours,
}: {
  isAuthenticated: boolean;
  onAuthenticate: () => void;
  onJoined: () => void;
  onGoToTours: () => void;
}) {
  const [step,         setStep]         = useState<JoinStep>(
    // Invalid invite short-circuits to error state immediately
    INVITE_TOUR.valid ? "landing" : "invalid"
  );
  const [authed,       setAuthed]       = useState(isAuthenticated);
  const [claimTarget,  setClaimTarget]  = useState<Guest | null>(null);
  const [showToast,    setShowToast]    = useState(false);

  // After joining, show toast then hand off
  function triggerJoined() {
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      onJoined();
    }, 2400);
  }

  // "Join tour" tapped from landing
  function handleJoinTap() {
    if (!INVITE_TOUR.valid) { setStep("invalid"); return; }

    if (!authed) {
      setStep("auth");
    } else {
      // Already a member: skip straight to tour (demo: never triggered)
      // Has guests: show resolution
      if (INVITE_GUESTS.length > 0) {
        setStep("resolution");
      } else {
        setStep("joinConfirm");
      }
    }
  }

  // Auth completed
  function handleAuthDone() {
    setAuthed(true);
    onAuthenticate();
    if (INVITE_GUESTS.length > 0) {
      setStep("resolution");
    } else {
      setStep("joinConfirm");
    }
  }

  // "This is me" on a guest row
  function handleClaimGuest(g: Guest) {
    setClaimTarget(g);
    setStep("claimConfirm");
  }

  // "I'm not listed"
  function handleNotListed() {
    setStep("joinConfirm");
  }

  // Claim confirmed
  function handleConfirmClaim() {
    triggerJoined();
  }

  // New join confirmed
  function handleConfirmJoin() {
    triggerJoined();
  }

  // ── Auth step (uses existing AuthFlow) ──────────────────────────────────────
  if (step === "auth") {
    return (
      <>
        <AuthFlow onAuthenticate={handleAuthDone} />
        {showToast && <JoinedToast tourName={INVITE_TOUR.name} />}
      </>
    );
  }

  // ── Invalid invite ──────────────────────────────────────────────────────────
  if (step === "invalid") {
    return <InvalidInvite onGoToTours={onGoToTours} />;
  }

  // ── Main screens ────────────────────────────────────────────────────────────
  return (
    <>
      {step === "landing" && (
        <InviteLanding
          onJoin={handleJoinTap}
          onInvalid={() => setStep("invalid")}
        />
      )}

      {step === "resolution" && (
        <MemberResolution
          userName={JOINER_NAME}
          guests={INVITE_GUESTS}
          onClaimGuest={handleClaimGuest}
          onNotListed={handleNotListed}
        />
      )}

      {step === "claimConfirm" && claimTarget && (
        <ClaimConfirm
          guest={claimTarget}
          onConfirm={handleConfirmClaim}
          onBack={() => setStep("resolution")}
        />
      )}

      {step === "joinConfirm" && (
        <JoinConfirm
          userName={JOINER_NAME}
          onConfirm={handleConfirmJoin}
          onBack={() =>
            INVITE_GUESTS.length > 0 ? setStep("resolution") : setStep("landing")
          }
        />
      )}

      {showToast && <JoinedToast tourName={INVITE_TOUR.name} />}
    </>
  );
}
