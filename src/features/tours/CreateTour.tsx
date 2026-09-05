import { useState, useId } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, MapPinIcon, UserIcon, ChevronDownIcon } from "@hugeicons/core-free-icons";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface CreateTourData {
  name:        string;
  destination: string;
  startDate:   string;
  endDate:     string;
  budget:      string;
  currency:    string;
  note:        string;
}

interface FieldError {
  name?: string;
  endDate?: string;
  budget?: string;
}

// ─── Currency options ─────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: "BDT", symbol: "৳", label: "BDT — ৳" },
  { code: "USD", symbol: "$", label: "USD — $" },
  { code: "EUR", symbol: "€", label: "EUR — €" },
  { code: "GBP", symbol: "£", label: "GBP — £" },
  { code: "INR", symbol: "₹", label: "INR — ₹" },
];

// ─── Spending style ───────────────────────────────────────────────────────────
type SpendingStyle = "pay-as-you-go" | "budget";

// ─── Field wrapper ─────────────────────────────────────────────────────────────
function Field({
  label,
  required,
  optional,
  error,
  children,
  htmlFor,
}: {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-1.5">
        <label htmlFor={htmlFor} className="text-[13px] font-600 text-[#475569]">
          {label}
        </label>
        {required && (
          <span className="text-[13px] font-600 text-[#DC2626]">*</span>
        )}
        {optional && (
          <span className="text-[11px] font-500 text-[#94A3B8]">optional</span>
        )}
      </div>
      {children}
      {error && (
        <p className="text-[12px] font-500 text-[#DC2626] flex items-center gap-1">
          <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Input base styles ─────────────────────────────────────────────────────────
const inputBase =
  "w-full bg-white rounded-[12px] px-4 h-[48px] text-[15px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none border transition-colors";

const inputIdle   = "border-[#E1E7EF] focus:border-[#0A86A0]";
const inputError  = "border-[#FECACA] bg-[#FFF5F5] focus:border-[#DC2626]";

// ─── Create Trip Screen ───────────────────────────────────────────────────────
export default function CreateTour({ onBack, onCreate }: {
  onBack:    () => void;
  onCreate:  (data: CreateTourData) => void;
}) {
  const nameId       = useId();
  const destId       = useId();
  const budgetId     = useId();
  const currencyId   = useId();
  const noteId       = useId();

  const [form, setForm] = useState<CreateTourData>({
    name:        "",
    destination: "",
    startDate:   "",
    endDate:     "",
    budget:      "",
    currency:    "BDT",
    note:        "",
  });

  const [spendingStyle, setSpendingStyle] = useState<SpendingStyle>("pay-as-you-go");
  const [errors, setErrors]     = useState<FieldError>({});
  const [touched, setTouched]   = useState<Set<string>>(new Set());

  const set = (key: keyof CreateTourData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (touched.has(key)) validate({ ...form, [key]: e.target.value });
  };

  const touch = (key: string) =>
    setTouched((prev) => new Set([...prev, key]));

  const validate = (data: CreateTourData): FieldError => {
    const errs: FieldError = {};

    if (!data.name.trim()) {
      errs.name = "Trip name is required.";
    }

    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      errs.endDate = "End date can't be before start date.";
    }

    if (spendingStyle === "budget" && data.budget !== "" && (isNaN(Number(data.budget)) || Number(data.budget) <= 0)) {
      errs.budget = "Budget must be greater than zero.";
    }

    setErrors(errs);
    return errs;
  };

  const handleSubmit = () => {
    setTouched(new Set(["name", "endDate", "budget"]));
    const errs = validate(form);
    if (Object.keys(errs).length === 0) {
      onCreate(form);
    }
  };

  const selectedCurrency = CURRENCIES.find((c) => c.code === form.currency) ?? CURRENCIES[0];

  return (
    <div className="h-full bg-[#F4F6F9] flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white shrink-0">
        <div className="flex items-center justify-center px-4 h-[56px] relative safe-top">
          <button
            onClick={onBack}
            className="pressable absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full text-[#475569] hover:bg-[#F4F6F9] transition-colors"
            aria-label="Go back"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="currentColor" strokeWidth={1.75} />
          </button>
          <h1 className="text-[16px] font-700 text-[#0F172A] leading-none">New trip</h1>
        </div>
      </div>

      {/* ── Scrollable form ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pt-6 pb-6 space-y-5 max-w-[520px] mx-auto w-full">

          {/* Trip name */}
          <Field label="Trip name" required error={errors.name} htmlFor={nameId}>
            <input
              id={nameId}
              type="text"
              placeholder="Tour de Rangamati"
              value={form.name}
              onChange={set("name")}
              onBlur={() => { touch("name"); validate(form); }}
              className={`${inputBase} ${errors.name ? inputError : inputIdle}`}
            />
          </Field>

          {/* Destination */}
          <Field label="Destination" optional htmlFor={destId}>
            <div className={`flex items-center bg-white rounded-[12px] border transition-colors h-[48px] ${inputIdle}`}>
              <span className="pl-3.5 text-[#0A86A0] shrink-0">
                <HugeiconsIcon icon={MapPinIcon} size={18} color="currentColor" strokeWidth={1.75} />
              </span>
              <input
                id={destId}
                type="text"
                placeholder="Rangamati"
                value={form.destination}
                onChange={set("destination")}
                className="flex-1 bg-transparent pl-2.5 pr-4 h-full text-[15px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none"
              />
            </div>
          </Field>

          {/* Spending style */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-600 text-[#475569]">Spending style</span>
            <div className="flex bg-[#F4F6F9] rounded-[12px] p-1 border border-[#E1E7EF]">
              <button
                type="button"
                onClick={() => setSpendingStyle("pay-as-you-go")}
                className={`flex-1 h-[42px] rounded-[10px] text-[14px] font-600 transition-all ${
                  spendingStyle === "pay-as-you-go"
                    ? "bg-[#0A86A0] text-white shadow-[0_1px_4px_rgba(10,134,160,0.18)]"
                    : "text-[#64748B] hover:text-[#475569]"
                }`}
                aria-pressed={spendingStyle === "pay-as-you-go"}
              >
                Pay as you go
              </button>
              <button
                type="button"
                onClick={() => setSpendingStyle("budget")}
                className={`flex-1 h-[42px] rounded-[10px] text-[14px] font-600 transition-all ${
                  spendingStyle === "budget"
                    ? "bg-[#0A86A0] text-white shadow-[0_1px_4px_rgba(10,134,160,0.18)]"
                    : "text-[#64748B] hover:text-[#475569]"
                }`}
                aria-pressed={spendingStyle === "budget"}
              >
                Set a budget
              </button>
            </div>
          </div>

          {/* Budget field — only visible when "Set a budget" is selected */}
          {spendingStyle === "budget" && (
            <Field label="Trip budget" error={errors.budget} htmlFor={budgetId}>
              <div className={`flex items-center bg-white rounded-[12px] border transition-colors h-[48px] ${errors.budget ? "border-[#FECACA] bg-[#FFF5F5]" : "border-[#E1E7EF] focus-within:border-[#0A86A0]"}`}>
                <span className="pl-4 text-[16px] font-600 text-[#94A3B8] shrink-0 select-none">
                  {selectedCurrency.symbol}
                </span>
                <input
                  id={budgetId}
                  type="number"
                  inputMode="decimal"
                  placeholder="50,000"
                  value={form.budget}
                  onChange={set("budget")}
                  onBlur={() => { touch("budget"); validate(form); }}
                  className="flex-1 bg-transparent pl-1.5 pr-4 h-full text-[15px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none num"
                />
                <div className="relative shrink-0 pr-2">
                  <select
                    id={currencyId}
                    value={form.currency}
                    onChange={set("currency")}
                    className="appearance-none bg-[#F4F6F9] border border-[#E1E7EF] rounded-[8px] pl-3 pr-7 py-1.5 text-[13px] font-600 text-[#0F172A] outline-none focus:border-[#0A86A0] transition-colors cursor-pointer"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code}</option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[#94A3B8]">
                    <HugeiconsIcon icon={ChevronDownIcon} size={14} color="currentColor" strokeWidth={2} />
                  </span>
                </div>
              </div>
              {errors.budget && (
                <p className="text-[12px] font-500 text-[#DC2626] flex items-center gap-1 mt-1">
                  <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                  </svg>
                  {errors.budget}
                </p>
              )}
            </Field>
          )}

          {/* Note */}
          <Field label="Note" optional htmlFor={noteId}>
            <textarea
              id={noteId}
              placeholder="Anything your group should know?"
              value={form.note}
              onChange={set("note")}
              rows={3}
              className={`${inputBase} h-auto py-3 resize-none leading-relaxed ${inputIdle}`}
            />
          </Field>

          {/* ── Owner info strip ──────────────────────────────────────────── */}
          <div className="flex items-center gap-2.5 pt-1">
            <span className="text-[#94A3B8]">
              <HugeiconsIcon icon={UserIcon} size={16} color="currentColor" strokeWidth={1.75} />
            </span>
            <p className="text-[13px] font-500 text-[#94A3B8]">You'll be added as the trip owner.</p>
          </div>

        </div>
      </div>

      {/* ── Sticky bottom CTA ────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-[#E1E7EF] px-5 py-3 safe-bottom shrink-0">
        <button
          onClick={handleSubmit}
          className="pressable w-full flex items-center justify-center h-[52px] rounded-[14px] bg-[#0A86A0] text-white font-700 text-[16px] shadow-[0_2px_10px_rgba(10,134,160,0.18)] active:scale-[0.985] transition-all"
        >
          Create trip
        </button>
      </div>
    </div>
  );
}
