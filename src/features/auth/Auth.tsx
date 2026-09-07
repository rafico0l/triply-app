import { useState, useRef, useEffect, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { signIn, signUp } from "../../lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────
type AuthScreen = "signin" | "signup" | "otp" | "verification-success" | "forgot" | "reset-sent";

// ─── Inline Icons ─────────────────────────────────────────────────────────────
function IconEye({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconEyeOff({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" />
      <path d="M8.71 8.71a4 4 0 005.58 5.58" />
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

function IconAlertSmall({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconMailCheck({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 13V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2h8" />
      <path d="M2 6l10 7 10-7" />
      <path d="M16 19l2 2 4-4" />
    </svg>
  );
}

function IconSpinner({ size = 18 }: { size?: number }) {
  return (
    <svg className="spin" width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeOpacity="0.25" />
      <path d="M12 2a10 10 0 010 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Product Mark ─────────────────────────────────────────────────────────────
function ProductMark() {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* App mark — rounded square with a split-path icon */}
      <div className="w-12 h-12 rounded-[14px] bg-[#0A86A0] flex items-center justify-center shadow-[0_2px_12px_rgba(10,134,160,0.22)]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          {/* Fork/split path: represents group expense sharing */}
          <circle cx="12" cy="5"  r="2" fill="white" />
          <circle cx="7"  cy="19" r="2" fill="white" />
          <circle cx="17" cy="19" r="2" fill="white" />
          <path d="M12 7v5M12 12l-3.5 5M12 12l3.5 5" stroke="white" strokeWidth="1.75" strokeLinecap="round" />
        </svg>
      </div>
      <span className="text-[18px] font-800 text-[#0F172A] tracking-tight">Triply</span>
    </div>
  );
}

// ─── Shared Form Primitives ───────────────────────────────────────────────────
const INPUT_BASE =
  "w-full h-12 px-4 bg-white border rounded-[12px] text-[15px] font-500 text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-colors";
const INPUT_NORMAL  = `${INPUT_BASE} border-[#E1E7EF] focus:border-[#0A86A0] focus:ring-2 focus:ring-[#0A86A0]/10`;
const INPUT_ERROR   = `${INPUT_BASE} border-[#DC2626] focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/10 bg-[#FFFBFB]`;

function FieldError({ message }: { message: string }) {
  return (
    <p className="flex items-center gap-1 text-[12px] font-500 text-[#DC2626] mt-0.5">
      <IconAlertSmall />
      {message}
    </p>
  );
}

function FormField({
  label,
  labelRight,
  error,
  children,
}: {
  label: string;
  labelRight?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[13px] font-600 text-[#0F172A]">{label}</label>
        {labelRight}
      </div>
      {children}
      {error && <FieldError message={error} />}
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  hasError,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hasError?: boolean;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "••••••••"}
        autoComplete={autoComplete ?? "current-password"}
        className={`${hasError ? INPUT_ERROR : INPUT_NORMAL} pr-11`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-[#94A3B8] hover:text-[#475569] transition-colors"
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
      >
        {show ? <IconEyeOff size={17} /> : <IconEye size={17} />}
      </button>
    </div>
  );
}

function PrimaryButton({
  children,
  loading,
  disabled,
  type = "submit",
  onClick,
}: {
  children: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: "submit" | "button";
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className="w-full h-12 rounded-[12px] bg-[#0A86A0] text-white text-[15px] font-700 flex items-center justify-center gap-2 shadow-[0_1px_4px_rgba(10,134,160,0.16)] transition-opacity disabled:opacity-60 active:scale-[0.98]"
    >
      {loading && <IconSpinner size={17} />}
      {children}
    </button>
  );
}

function AuthError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 px-3.5 py-3 rounded-[10px] bg-[#FFF5F5] border border-[#FECACA]">
      <IconAlertSmall size={14} />
      <p className="text-[13px] font-500 text-[#DC2626] leading-snug">{message}</p>
    </div>
  );
}

// ─── Auth Shell Wrapper ───────────────────────────────────────────────────────
// The safe-area zone is a dedicated structural block, kept separate from
// application content so the two never overlap on any device.
//
// Zone map (mobile):
//   ┌──────────────────────────────────┐
//   │  System / Dynamic Island / notch  │  ← NOT our content
//   ├──────────────────────────────────┤  ← safe-area boundary
//   │  safe-top spacer (env inset)     │
//   ├──────────────────────────────────┤
//   │  pt-9 breathing room             │
//   │  ProductMark (logo + wordmark)   │
//   │  ...content...                   │
//   └──────────────────────────────────┘
//
// viewport-fit=cover (set in index.html) must be present for
// env(safe-area-inset-top) to return a real value on iOS devices.
function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-white md:bg-[#F4F6F9] flex flex-col">
      {/* Safe-area spacer: height = env(safe-area-inset-top, 0px).
          This is purely structural — it has no visible background or border.
          Content never starts until this block ends. */}
      <div className="safe-top shrink-0" />

      {/* Application content area */}
      <div className="flex-1 flex flex-col md:items-center md:justify-center md:py-10">
        <div className="w-full md:max-w-[420px] md:bg-white md:border md:border-[#E1E7EF] md:rounded-[20px] md:shadow-[0_4px_32px_rgba(15,23,42,0.08)] px-6 pt-9 pb-10 md:px-8 md:py-10 safe-bottom flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

/**
 * Normalizes Bangladesh mobile numbers.
 * Accepts full "+88017XXXXXXXX", "88017XXXXXXXX", "017XXXXXXXX", or "17XXXXXXXX".
 * Strips non-digits, strips leading 880 or 0, and returns the 10-digit local number (e.g. "17XXXXXXXX").
 */
function cleanBdMobile(raw: string): string {
  let cleaned = raw.replace(/\D/g, "");
  if (cleaned.startsWith("880")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.slice(1);
  }
  return cleaned.slice(0, 10);
}

/**
 * Validates a Bangladesh mobile number local portion.
 * Must be 10 digits starting with 13-19 (e.g. 17XXXXXXXX).
 */
function isValidBdMobile(mobile: string): boolean {
  return /^1[3-9]\d{8}$/.test(mobile);
}

/**
 * Formats a 10-digit Bangladesh mobile number (e.g. "1712345678")
 * into "+880 1712 345 678" for clean presentation.
 */
function formatBdMobile(mobile: string): string {
  const clean = cleanBdMobile(mobile);
  if (clean.length === 10) {
    return `+880 ${clean.slice(0, 4)} ${clean.slice(4, 7)} ${clean.slice(7)}`;
  }
  return `+880 ${clean}`;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// ─── Bangladesh Mobile Input ──────────────────────────────────────────────────
function BdMobileInput({
  value,
  onChange,
  hasError,
  autoFocus,
  autoComplete = "tel-national",
}: {
  value: string;
  onChange: (val: string) => void;
  hasError?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleaned = cleanBdMobile(raw);
    onChange(cleaned);
  };

  return (
    <div
      className={`w-full h-12 bg-white rounded-[12px] border transition-colors flex items-center overflow-hidden ${
        hasError
          ? "border-[#DC2626] bg-[#FFFBFB] ring-2 ring-[#DC2626]/10"
          : isFocused
          ? "border-[#0A86A0] ring-2 ring-[#0A86A0]/10"
          : "border-[#E1E7EF]"
      }`}
    >
      {/* Country code prefix */}
      <div className="h-full px-3.5 bg-[#F8FAFC] border-r border-[#E1E7EF] flex items-center justify-center shrink-0 select-none">
        <span className="text-[14px] font-700 text-[#475569] tracking-tight">+880</span>
      </div>

      {/* Local number input */}
      <input
        type="tel"
        inputMode="numeric"
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="17XXXXXXXX"
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        maxLength={10}
        className="w-full h-full px-3.5 bg-transparent text-[15px] font-500 text-[#0F172A] placeholder:text-[#94A3B8] outline-none"
      />
    </div>
  );
}

// ─── Sign In Screen ───────────────────────────────────────────────────────────
function SignInScreen({
  onAuthenticate,
  onSignUp,
  onForgot,
}: {
  onAuthenticate: () => void;
  onSignUp: () => void;
  onForgot: () => void;
}) {
  const [mobile,   setMobile]   = useState("");
  const [password, setPassword] = useState("");
  const [errors,   setErrors]   = useState<{ mobile?: string; password?: string }>({});
  const [authErr,  setAuthErr]  = useState("");
  const [loading,  setLoading]  = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!mobile.trim()) {
      e.mobile = "Mobile number is required.";
    } else if (!isValidBdMobile(mobile)) {
      e.mobile = "Enter a valid 10-digit mobile number (e.g. 17XXXXXXXX).";
    }
    if (!password) {
      e.password = "Password is required.";
    } else if (password.length < 6) {
      e.password = "Password must be at least 6 characters.";
    }
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setAuthErr("");
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    const { error } = await signIn(mobile, password);
    setLoading(false);
    if (error) {
      setAuthErr(error);
      return;
    }
    onAuthenticate();
  };

  return (
    <AuthShell>
      {/* Identity — stands alone with generous breathing room below */}
      <ProductMark />

      {/* Welcome section — clear break from the logo */}
      <div className="flex flex-col gap-1.5 mt-9">
        <h1 className="text-[24px] font-800 text-[#0F172A] tracking-tight leading-tight">Welcome back</h1>
        <p className="text-[15px] font-500 text-[#64748B] leading-snug">Sign in to continue managing your trips.</p>
      </div>

      {/* Form — tighter bond with heading above it */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 mt-7">
        {authErr && <AuthError message={authErr} />}

        <FormField label="Mobile number *" error={errors.mobile}>
          <BdMobileInput
            value={mobile}
            onChange={setMobile}
            hasError={!!errors.mobile}
          />
        </FormField>

        <FormField
          label="Password *"
          error={errors.password}
          labelRight={
            <button
              type="button"
              onClick={onForgot}
              className="text-[12px] font-600 text-[#0A86A0] hover:underline"
            >
              Forgot password?
            </button>
          }
        >
          <PasswordInput
            value={password}
            onChange={setPassword}
            hasError={!!errors.password}
            autoComplete="current-password"
          />
        </FormField>

        <div className="pt-2">
          <PrimaryButton loading={loading}>
            {loading ? "Logging in…" : "Log in"}
          </PrimaryButton>
        </div>
      </form>

      {/* Secondary — clear separation from the primary action */}
      <p className="text-center text-[14px] font-500 text-[#64748B] mt-8">
        New here?{" "}
        <button onClick={onSignUp} className="font-700 text-[#0A86A0] hover:underline">
          Create account
        </button>
      </p>
    </AuthShell>
  );
}

// ─── Create Account Screen ────────────────────────────────────────────────────
function CreateAccountScreen({
  onAuthenticate,
  onSignIn,
  onEmailConfirmationRequired,
}: {
  onAuthenticate: () => void;
  onSignIn: () => void;
  onEmailConfirmationRequired?: () => void;
}) {
  const [name,     setName]     = useState("");
  const [mobile,   setMobile]   = useState("");
  const [password, setPassword] = useState("");
  const [errors,   setErrors]   = useState<{ name?: string; mobile?: string; password?: string }>({});
  const [authErr,  setAuthErr]  = useState("");
  const [loading,  setLoading]  = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim()) {
      e.name = "Your name is required.";
    }
    if (!mobile.trim()) {
      e.mobile = "Mobile number is required.";
    } else if (!isValidBdMobile(mobile)) {
      e.mobile = "Enter a valid 10-digit mobile number (e.g. 17XXXXXXXX).";
    }
    if (!password) {
      e.password = "Password is required.";
    } else if (password.length < 8) {
      e.password = "Use at least 8 characters.";
    }
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setAuthErr("");
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setLoading(true);
    const { error, user } = await signUp(name.trim(), mobile, password);
    setLoading(false);
    if (error) {
      setAuthErr(error);
      return;
    }
    // If user exists with a session, account is confirmed — proceed.
    // If user exists but no session, email confirmation is required.
    if (user) {
      onAuthenticate();
    } else if (onEmailConfirmationRequired) {
      onEmailConfirmationRequired();
    } else {
      onAuthenticate();
    }
  };

  return (
    <AuthShell>
      {/* Identity */}
      <ProductMark />

      {/* Heading */}
      <div className="flex flex-col gap-1.5 mt-9">
        <h1 className="text-[24px] font-800 text-[#0F172A] tracking-tight leading-tight">Create your account</h1>
        <p className="text-[15px] font-500 text-[#64748B] leading-snug">Start tracking your group trip expenses.</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 mt-7">
        {authErr && <AuthError message={authErr} />}

        <FormField label="Your name *" error={errors.name}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rafi Cool"
            autoComplete="name"
            autoCapitalize="words"
            className={errors.name ? INPUT_ERROR : INPUT_NORMAL}
          />
        </FormField>

        <FormField label="Mobile number *" error={errors.mobile}>
          <BdMobileInput
            value={mobile}
            onChange={setMobile}
            hasError={!!errors.mobile}
          />
        </FormField>

        <FormField label="Password *" error={errors.password}>
          <PasswordInput
            value={password}
            onChange={setPassword}
            placeholder="8+ characters"
            hasError={!!errors.password}
            autoComplete="new-password"
          />
        </FormField>

        {/* Password strength hint — appears only once user starts typing */}
        {password.length > 0 && password.length < 8 && !errors.password && (
          <p className="text-[12px] font-500 text-[#94A3B8] -mt-2">
            {8 - password.length} more character{8 - password.length !== 1 ? "s" : ""} needed
          </p>
        )}

        <div className="pt-2">
          <PrimaryButton loading={loading}>
            {loading ? "Signing up…" : "Sign up"}
          </PrimaryButton>
        </div>
      </form>

      {/* Terms note */}
      <p className="text-center text-[12px] font-500 text-[#94A3B8] leading-relaxed mt-4">
        By creating an account you agree to our{" "}
        <span className="text-[#475569] underline underline-offset-2 cursor-pointer">Terms</span>
        {" "}and{" "}
        <span className="text-[#475569] underline underline-offset-2 cursor-pointer">Privacy Policy</span>.
      </p>

      {/* Secondary */}
      <p className="text-center text-[14px] font-500 text-[#64748B] mt-6">
        Already have an account?{" "}
        <button onClick={onSignIn} className="font-700 text-[#0A86A0] hover:underline">
          Log in
        </button>
      </p>
    </AuthShell>
  );
}

// ─── OTP Verification Screen ──────────────────────────────────────────────────
export function OtpVerificationScreen({
  mobile,
  onBack,
  onSuccess,
}: {
  mobile?: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(59);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Live countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleDigitChange = (index: number, val: string) => {
    setError("");
    // Take the last entered digit (if user typed into a filled field)
    const cleaned = val.replace(/\D/g, "");
    const singleDigit = cleaned.slice(-1);

    const nextDigits = [...digits];
    nextDigits[index] = singleDigit;
    setDigits(nextDigits);

    // Auto-advance focus to next field if a digit was entered
    if (singleDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Current is already empty: clear previous and shift focus back
        const nextDigits = [...digits];
        nextDigits[index - 1] = "";
        setDigits(nextDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current
        const nextDigits = [...digits];
        nextDigits[index] = "";
        setDigits(nextDigits);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    setError("");
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const nextDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      nextDigits[i] = pasted[i] ?? "";
    }
    setDigits(nextDigits);

    // Focus appropriate box
    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setCountdown(59);
    setError("");
  };

  const isComplete = digits.every((d) => d.length === 1);
  const otpCode = digits.join("");

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isComplete || loading) return;

    setError("");
    setLoading(true);
    await sleep(800);
    setLoading(false);

    // Demo invalid OTP code check: e.g. "000000" triggers error state
    if (otpCode === "000000") {
      setError("The code you entered is incorrect. Try again.");
      return;
    }

    onSuccess();
  };

  const displayMobile = mobile ? formatBdMobile(mobile) : "+880 1712 345 678";
  const timerDisplay = `0:${countdown.toString().padStart(2, "0")}`;

  return (
    <div className="min-h-[100dvh] bg-white md:bg-[#F4F6F9] flex flex-col">
      {/* Safe-area spacer */}
      <div className="safe-top shrink-0" />

      {/* Centered auth card container */}
      <div className="flex-1 flex flex-col md:items-center md:justify-center md:py-10">
        <div className="w-full md:max-w-[420px] md:bg-white md:border md:border-[#E1E7EF] md:rounded-[20px] md:shadow-[0_4px_32px_rgba(15,23,42,0.08)] px-6 pt-4 pb-10 md:px-8 md:py-10 safe-bottom flex flex-col flex-1 md:flex-initial">
          
          {/* Focused Header: Back button + Title */}
          <div className="relative flex items-center justify-center min-h-[44px]">
            <button
              type="button"
              onClick={onBack}
              className="pressable absolute left-0 w-10 h-10 rounded-full border border-[#E1E7EF] bg-white flex items-center justify-center text-[#0F172A] shadow-sm hover:bg-[#F8FAFC] active:scale-95 transition-all"
              aria-label="Back"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="currentColor" strokeWidth={2} />
            </button>
            <h2 className="text-[17px] font-700 text-[#0F172A] tracking-tight">
              OTP Verification
            </h2>
          </div>

          {/* Heading & description */}
          <div className="flex flex-col gap-1.5 mt-8">
            <h1 className="text-[24px] font-800 text-[#0F172A] tracking-tight leading-tight">
              Verify your account
            </h1>
            <p className="text-[15px] font-500 text-[#64748B] leading-snug">
              We sent a 6-digit verification code to your mobile
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[14px] font-600 text-[#0F172A]">
                {displayMobile}
              </span>
              <button
                type="button"
                onClick={onBack}
                className="text-[13px] font-600 text-[#0A86A0] hover:underline"
              >
                Change number
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col mt-7">
            {error && (
              <div className="mb-4">
                <AuthError message={error} />
              </div>
            )}

            {/* 6 OTP Digit Inputs */}
            <div
              className="flex items-center justify-between gap-2 sm:gap-2.5"
              onPaste={handlePaste}
            >
              {digits.map((digit, idx) => {
                const hasDigit = digit.length > 0;
                return (
                  <input
                    key={idx}
                    ref={(el) => {
                      inputRefs.current[idx] = el;
                    }}
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    autoFocus={idx === 0}
                    aria-label={`Digit ${idx + 1}`}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    className={`w-11 h-13 sm:w-12 sm:h-14 rounded-[14px] text-center text-[22px] font-700 text-[#0F172A] bg-white outline-none transition-all ${
                      error
                        ? "border-2 border-[#DC2626] bg-[#FFFBFB]"
                        : "border border-[#E1E7EF] focus:border-2 focus:border-[#0A86A0] focus:ring-2 focus:ring-[#0A86A0]/10"
                    }`}
                  />
                );
              })}
            </div>

            {/* Resend section */}
            <div className="flex items-center justify-center text-[14px] font-500 text-[#64748B] mt-8">
              <span>Didn't receive code?&nbsp;</span>
              {countdown > 0 ? (
                <span className="font-600 text-[#0A86A0]">
                  Resend in {timerDisplay}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="font-700 text-[#0A86A0] hover:underline"
                >
                  Resend code
                </button>
              )}
            </div>

            {/* Submit button */}
            <div className="mt-8">
              <PrimaryButton disabled={!isComplete} loading={loading}>
                {loading ? "Submitting…" : "Submit"}
              </PrimaryButton>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}

// ─── Verification Success Screen ──────────────────────────────────────────────
export function VerificationSuccessScreen({
  onContinue,
}: {
  onContinue: () => void;
}) {
  return (
    <div className="min-h-[100dvh] bg-white md:bg-[#F4F6F9] flex flex-col">
      {/* Safe-area spacer */}
      <div className="safe-top shrink-0" />

      {/* Centered usable mobile viewport */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 safe-bottom">
        <div className="w-full max-w-[380px] md:bg-white md:border md:border-[#E1E7EF] md:rounded-[24px] md:shadow-[0_4px_32px_rgba(15,23,42,0.08)] md:px-8 md:py-12 flex flex-col items-center text-center">
          
          {/* Concentric circular teal check badge */}
          <div className="w-[140px] h-[140px] rounded-full bg-[#EFF9FB] flex items-center justify-center mb-8 select-none">
            <div className="w-[104px] h-[104px] rounded-full bg-[#D4F0F5] flex items-center justify-center">
              <div className="w-[68px] h-[68px] rounded-full bg-[#0A86A0] flex items-center justify-center text-white shadow-[0_4px_16px_rgba(10,134,160,0.28)]">
                <HugeiconsIcon icon={Tick02Icon} size={32} color="currentColor" strokeWidth={2.75} />
              </div>
            </div>
          </div>

          {/* Heading & description */}
          <h1 className="text-[26px] font-800 text-[#0F172A] tracking-tight leading-tight mb-3">
            You’re all set!
          </h1>
          <p className="text-[15px] font-500 text-[#64748B] leading-relaxed max-w-[320px] mb-9">
            Your account has been verified successfully. Start managing your group tour expenses seamlessly with your travel mates.
          </p>

          {/* Primary CTA */}
          <div className="w-full">
            <PrimaryButton type="button" onClick={onContinue}>
              Explore Triply
            </PrimaryButton>
          </div>

        </div>
      </div>
    </div>
  );
}

// ─── Forgot Password Screen ───────────────────────────────────────────────────
function ForgotPasswordScreen({
  onBack,
  onSent,
}: {
  onBack: () => void;
  onSent: (email: string) => void;
}) {
  const [email,   setEmail]   = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!email.trim())          { setError("Email is required.");              return; }
    if (!isValidEmail(email))   { setError("Enter a valid email address.");    return; }
    setError("");
    setLoading(true);
    await sleep(900);
    setLoading(false);
    onSent(email.trim());
  };

  return (
    <AuthShell>
      {/* Back navigation — sits just below the safe area with the shell's pt-9 */}
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[14px] font-600 text-[#475569] hover:text-[#0F172A] -ml-1 w-fit transition-colors"
        aria-label="Back to sign in"
      >
        <IconChevronLeft size={18} />
        Back
      </button>

      {/* Heading */}
      <div className="flex flex-col gap-1.5 mt-8">
        <h1 className="text-[24px] font-800 text-[#0F172A] tracking-tight leading-tight">Reset password</h1>
        <p className="text-[15px] font-500 text-[#64748B] leading-snug">
          Enter your email and we'll send you a password reset link.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 mt-7">
        <FormField label="Email" error={error}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            inputMode="email"
            autoFocus
            className={error ? INPUT_ERROR : INPUT_NORMAL}
          />
        </FormField>

        <div className="pt-2">
          <PrimaryButton loading={loading}>
            {loading ? "Sending…" : "Send reset link"}
          </PrimaryButton>
        </div>
      </form>
    </AuthShell>
  );
}

// ─── Reset Email Sent Screen ──────────────────────────────────────────────────
function ResetEmailSentScreen({
  email,
  onBack,
}: {
  email: string;
  onBack: () => void;
}) {
  return (
    <AuthShell>
      {/* Success indicator */}
      <div className="flex flex-col items-center pt-2">
        <div className="w-16 h-16 rounded-[20px] bg-[#F0FDF4] border border-[#BBF7D0] flex items-center justify-center text-[#15803D]">
          <IconMailCheck size={32} />
        </div>
      </div>

      {/* Heading */}
      <div className="flex flex-col gap-2 text-center mt-8">
        <h1 className="text-[24px] font-800 text-[#0F172A] tracking-tight leading-tight">Check your email</h1>
        <p className="text-[15px] font-500 text-[#64748B] leading-snug">
          We sent a password reset link to:
        </p>
        <p className="text-[15px] font-700 text-[#0F172A]">{email}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-9">
        <a
          href={`mailto:${email}`}
          className="w-full h-12 rounded-[12px] bg-[#0A86A0] text-white text-[15px] font-700 flex items-center justify-center shadow-[0_1px_4px_rgba(10,134,160,0.16)] active:scale-[0.98] transition-transform"
        >
          Open email app
        </a>
        <button
          onClick={onBack}
          className="w-full h-12 rounded-[12px] border border-[#E1E7EF] bg-white text-[15px] font-600 text-[#475569] flex items-center justify-center hover:bg-[#F4F6F9] active:scale-[0.98] transition-all"
        >
          Back to sign in
        </button>
      </div>

      {/* Hint */}
      <p className="text-center text-[13px] font-500 text-[#94A3B8] leading-relaxed mt-7">
        Didn't receive it? Check your spam folder, or{" "}
        <button onClick={onBack} className="text-[#0A86A0] font-600 hover:underline">
          try again
        </button>
        .
      </p>
    </AuthShell>
  );
}

// ─── Auth Flow ────────────────────────────────────────────────────────────────
// Manages screen transitions. Exported for use in App.tsx.
export function AuthFlow({ onAuthenticate }: { onAuthenticate: () => void }) {
  const [screen,        setScreen]        = useState<AuthScreen>("signin");
  const [resetEmail,    setResetEmail]    = useState("");

  return (
    <>
      {screen === "signin" && (
        <SignInScreen
          onAuthenticate={onAuthenticate}
          onSignUp={() => setScreen("signup")}
          onForgot={() => setScreen("forgot")}
        />
      )}
      {screen === "signup" && (
        <CreateAccountScreen
          onAuthenticate={onAuthenticate}
          onSignIn={() => setScreen("signin")}
          onEmailConfirmationRequired={() => setScreen("verification-success")}
        />
      )}
      {screen === "verification-success" && (
        <VerificationSuccessScreen
          onContinue={() => setScreen("signin")}
        />
      )}
      {screen === "forgot" && (
        <ForgotPasswordScreen
          onBack={() => setScreen("signin")}
          onSent={(email) => { setResetEmail(email); setScreen("reset-sent"); }}
        />
      )}
      {screen === "reset-sent" && (
        <ResetEmailSentScreen
          email={resetEmail}
          onBack={() => setScreen("signin")}
        />
      )}
    </>
  );
}
