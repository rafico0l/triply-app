import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Link01Icon, CheckIcon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { IconAlertCircle } from "../../components/shared/icons";
import { joinTripByInvite, type JoinTripResult } from "../../lib/tripRepository";
import { TripRepositoryError } from "../../lib/tripRepository";

const JOIN_TOKEN_KEY = "triply_pending_join_token";

interface JoinTripScreenProps {
  initialToken?: string;
  onBack: () => void;
  onJoined: () => void;
}

export default function JoinTripScreen({ initialToken, onBack, onJoined }: JoinTripScreenProps) {
  const [token, setToken] = useState(initialToken ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JoinTripResult | null>(null);
  const [needAuth, setNeedAuth] = useState(false);

  useEffect(() => {
    if (initialToken) {
      localStorage.setItem(JOIN_TOKEN_KEY, initialToken);
      handleJoin(initialToken);
    } else {
      const stored = localStorage.getItem(JOIN_TOKEN_KEY);
      if (stored) {
        setToken(stored);
        handleJoin(stored);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleJoin(code: string) {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await joinTripByInvite(code);
      setResult(res);
      localStorage.removeItem(JOIN_TOKEN_KEY);
      setTimeout(() => {
        onJoined();
      }, 800);
    } catch (err) {
      if (err instanceof TripRepositoryError) {
        if (err.message === "Not authenticated") {
          setNeedAuth(true);
          return;
        }
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = token.trim();
    if (!trimmed) return;
    localStorage.setItem(JOIN_TOKEN_KEY, trimmed);
    handleJoin(trimmed);
  }

  function handleBack() {
    localStorage.removeItem(JOIN_TOKEN_KEY);
    onBack();
  }

  function handleAuthThenJoin() {
    localStorage.setItem(JOIN_TOKEN_KEY, token.trim());
    onBack();
  }

  return (
    <div className="h-full bg-[#F4F6F9] flex flex-col overflow-hidden">
      <div className="bg-white shrink-0 safe-top">
        <div className="flex items-center justify-center px-4 h-[56px] relative">
          <button
            onClick={handleBack}
            className="pressable absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-[#475569] hover:bg-[#F4F6F9] transition-colors"
            aria-label="Go back"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="currentColor" strokeWidth={1.75} />
          </button>
          <h1 className="text-[16px] font-700 text-[#0F172A] leading-none">Join trip</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[480px] mx-auto px-5 pt-6 pb-10">
          <div className="mb-6">
            <h2 className="text-[22px] font-800 text-[#0F172A] leading-tight tracking-[-0.3px]">
              Enter invite code
            </h2>
            <p className="text-[14px] font-500 text-[#64748B] mt-1.5 leading-relaxed">
              Paste the invite code you received to join an existing trip.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] font-700 text-[#475569] uppercase tracking-wide block mb-1.5">
                Invite code
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={token}
                  onChange={(e) => setToken(e.target.value.toUpperCase())}
                  placeholder="e.g. ABC123"
                  className="flex-1 bg-white border border-[#E1E7EF] rounded-[11px] px-4 h-12 text-[15px] font-600 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none focus:border-[#0A86A0] transition-colors"
                  disabled={loading || !!result}
                />
                <button
                  type="submit"
                  disabled={loading || !!result || !token.trim()}
                  className="pressable shrink-0 px-5 h-12 rounded-[11px] bg-[#0A86A0] text-white font-700 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Joining…" : result ? "Joined" : "Join"}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-[#FEE2E2] border border-[#FECACA] rounded-[12px] px-4 py-3 flex items-start gap-2.5">
                <span className="text-[#DC2626] shrink-0 mt-0.5">
                  <IconAlertCircle size={16} />
                </span>
                <p className="text-[13px] font-600 text-[#DC2626]">{error}</p>
              </div>
            )}

            {needAuth && (
              <div className="bg-[#EFF9FB] border border-[#A3DFE9] rounded-[12px] px-4 py-3 flex items-start gap-2.5">
                <span className="text-[#0A86A0] shrink-0 mt-0.5">
                  <HugeiconsIcon icon={UserAdd01Icon} size={16} color="currentColor" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-[13px] font-700 text-[#0A86A0]">Sign in to join</p>
                  <p className="text-[12px] font-500 text-[#0A86A0] mt-0.5">You need an account to join this trip.</p>
                  <button
                    onClick={handleAuthThenJoin}
                    className="mt-2 pressable px-4 h-9 rounded-[10px] bg-[#0A86A0] text-white font-700 text-[13px]"
                  >
                    Sign in / Sign up
                  </button>
                </div>
              </div>
            )}

            {result && (
              <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-[12px] px-4 py-3 flex items-start gap-2.5">
                <span className="text-[#15803D] shrink-0 mt-0.5">
                  <HugeiconsIcon icon={CheckIcon} size={16} color="currentColor" strokeWidth={2.5} />
                </span>
                <div>
                  <p className="text-[13px] font-700 text-[#15803D]">You joined the trip</p>
                  <p className="text-[12px] font-500 text-[#15803D] mt-0.5">Opening trip…</p>
                </div>
              </div>
            )}
          </form>

          <div className="mt-8 p-4 bg-white rounded-[14px] border border-[#E1E7EF]">
            <p className="text-[12px] font-600 text-[#94A3B8] uppercase tracking-wider mb-2">How it works</p>
            <ul className="space-y-2 text-[13px] text-[#475569]">
              <li className="flex items-start gap-2">
                <span className="text-[#0A86A0] mt-0.5">•</span>
                Ask the trip organizer for their invite code.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0A86A0] mt-0.5">•</span>
                Paste it above and tap Join.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#0A86A0] mt-0.5">•</span>
                You will be added as a member and can start tracking expenses.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
