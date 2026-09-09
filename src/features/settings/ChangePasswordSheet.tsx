import { useState } from "react";
import Sheet from "../../components/shared/Sheet";
import { getSupabase } from "../../lib/supabase";
import type { User } from "@supabase/supabase-js";

export default function ChangePasswordSheet({ currentUser, onClose }: {
  currentUser: User;
  onClose: () => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = (): string | null => {
    if (!currentPassword.trim()) return "Current password is required.";
    if (!newPassword.trim()) return "New password is required.";
    if (newPassword.length < 8) return "New password must be at least 8 characters.";
    if (newPassword === currentPassword) return "New password must differ from current password.";
    if (newPassword !== confirmPassword) return "Passwords do not match.";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const sb = getSupabase();
      const email = currentUser.email;
      if (!email) {
        setError("Unable to determine account email.");
        setLoading(false);
        return;
      }

      const { error: verifyError } = await sb.auth.signInWithPassword({
        email,
        password: currentPassword,
      });

      if (verifyError) {
        setError("Current password is incorrect.");
        setLoading(false);
        return;
      }

      const { error: updateError } = await sb.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || "Failed to update password.");
        setLoading(false);
        return;
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        <h2 className="text-[17px] font-700 text-[#0F172A]">Change password</h2>
        <button onClick={onClose} className="pressable text-[14px] font-600 text-[#94A3B8]">Cancel</button>
      </div>
      <div className="px-5 pb-6 pt-3 space-y-4">
        {error && (
          <div className="flex items-start gap-2 px-3.5 py-3 rounded-[10px] bg-[#FFF5F5] border border-[#FECACA]">
            <p className="text-[13px] font-500 text-[#DC2626] leading-snug">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 px-3.5 py-3 rounded-[10px] bg-[#F0FDF4] border border-[#BBF7D0]">
            <p className="text-[13px] font-500 text-[#065F46] leading-snug">Password updated successfully.</p>
          </div>
        )}

        <div>
          <label className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wide block mb-2">Current password</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full bg-[#F4F6F9] rounded-[12px] px-4 h-12 text-[15px] font-500 text-[#0F172A] outline-none border border-[#E1E7EF] focus:border-[#0A86A0] focus:bg-white transition-colors pr-11"
            />
            <button
              type="button"
              onClick={() => setShowCurrent((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-[#475569] transition-colors"
              aria-label={showCurrent ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showCurrent ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.88 9.88 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wide block mb-2">New password</label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full bg-[#F4F6F9] rounded-[12px] px-4 h-12 text-[15px] font-500 text-[#0F172A] outline-none border border-[#E1E7EF] focus:border-[#0A86A0] focus:bg-white transition-colors pr-11"
            />
            <button
              type="button"
              onClick={() => setShowNew((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-[#475569] transition-colors"
              aria-label={showNew ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showNew ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.88 9.88 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wide block mb-2">Confirm new password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full bg-[#F4F6F9] rounded-[12px] px-4 h-12 text-[15px] font-500 text-[#0F172A] outline-none border border-[#E1E7EF] focus:border-[#0A86A0] focus:bg-white transition-colors pr-11"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-[#475569] transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showConfirm ? (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.88 9.88 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              )}
            </button>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading || success}
          className="w-full h-[50px] rounded-[13px] bg-[#0A86A0] text-white font-700 text-[15px] shadow-[0_4px_16px_rgba(10,134,160,0.22)] transition-opacity disabled:opacity-60 active:scale-[0.98]"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </div>
    </Sheet>
  );
}
