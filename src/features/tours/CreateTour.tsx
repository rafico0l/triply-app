import { useState, useRef, useId } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  MapPinIcon,
  Calendar01Icon,
  ArrowRight01Icon,
  UserIcon,
  ChevronDownIcon,
  Image01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import BottomNav from "../../components/navigation/BottomNav";

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
  name?:        string;
  destination?: string;
  startDate?:   string;
  endDate?:     string;
  budget?:      string;
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
  label:     string;
  required?: boolean;
  optional?: boolean;
  error?:    string;
  children:  React.ReactNode;
  htmlFor?:  string;
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

const inputIdle  = "border-[#E1E7EF] focus:border-[#0A86A0]";
const inputError = "border-[#FECACA] bg-[#FFF5F5] focus:border-[#DC2626]";

// ─── Create Trip Screen ───────────────────────────────────────────────────────
export default function CreateTour({ onBack, onCreate }: {
  onBack:   () => void;
  onCreate: (data: CreateTourData) => void;
}) {
  const nameId       = useId();
  const destId       = useId();
  const startDateId  = useId();
  const endDateId    = useId();
  const budgetId     = useId();
  const currencyId   = useId();
  const noteId       = useId();

  const coverInputRef = useRef<HTMLInputElement>(null);

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
  const [errors, setErrors]   = useState<FieldError>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

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

    if (!data.destination.trim()) {
      errs.destination = "Destination is required.";
    }

    if (!data.startDate) {
      errs.startDate = "Start date is required.";
    }

    if (data.startDate && data.endDate && data.endDate < data.startDate) {
      errs.endDate = "End date can't be before start date.";
    }

    if (!data.name.trim()) {
      errs.name = "Trip name is required.";
    }

    if (
      spendingStyle === "budget" &&
      data.budget !== "" &&
      (isNaN(Number(data.budget)) || Number(data.budget) <= 0)
    ) {
      errs.budget = "Budget must be greater than zero.";
    }

    setErrors(errs);
    return errs;
  };

  const handleSubmit = () => {
    setTouched(new Set(["destination", "startDate", "endDate", "name", "budget"]));
    const errs = validate(form);
    if (Object.keys(errs).length === 0) {
      onCreate(form);
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    }
  };

  const selectedCurrency = CURRENCIES.find((c) => c.code === form.currency) ?? CURRENCIES[0];

  const contentBottomPad = "calc(env(safe-area-inset-bottom, 0px) + 60px + 16px)";

  return (
    <div className="h-full bg-[#F4F6F9] flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E1E7EF] shrink-0">
        <div className="safe-top" />
        <div className="flex items-center justify-center px-4 h-[56px] relative">
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
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: contentBottomPad }}>
        <div className="px-5 pt-5 pb-2 space-y-5 max-w-[520px] mx-auto w-full">

          {/* 1. Destination */}
          <Field label="Destination" required error={errors.destination} htmlFor={destId}>
            <div
              className={`flex items-center bg-white rounded-[12px] border transition-colors h-[48px] ${
                errors.destination ? "border-[#FECACA] bg-[#FFF5F5]" : "border-[#E1E7EF] focus-within:border-[#0A86A0]"
              }`}
            >
              <span className="pl-3.5 text-[#0A86A0] shrink-0">
                <HugeiconsIcon icon={MapPinIcon} size={18} color="currentColor" strokeWidth={1.75} />
              </span>
              <input
                id={destId}
                type="text"
                placeholder="Rangamati"
                value={form.destination}
                onChange={set("destination")}
                onBlur={() => { touch("destination"); validate(form); }}
                className="flex-1 bg-transparent pl-2.5 pr-4 h-full text-[15px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none"
              />
            </div>
          </Field>

          {/* 2. Trip dates */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-[13px] font-600 text-[#475569]">Trip dates</span>
              <span className="text-[13px] font-600 text-[#DC2626]">*</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Start date */}
              <div
                className={`flex-1 flex items-center bg-white rounded-[12px] border transition-colors h-[48px] ${
                  errors.startDate ? "border-[#FECACA] bg-[#FFF5F5]" : "border-[#E1E7EF] focus-within:border-[#0A86A0]"
                }`}
              >
                <span className="pl-3 text-[#0A86A0] shrink-0">
                  <HugeiconsIcon icon={Calendar01Icon} size={17} color="currentColor" strokeWidth={1.75} />
                </span>
                <input
                  id={startDateId}
                  type="date"
                  value={form.startDate}
                  onChange={set("startDate")}
                  onBlur={() => { touch("startDate"); validate(form); }}
                  className="flex-1 bg-transparent pl-2 pr-2 h-full text-[14px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none min-w-0"
                  placeholder="Start date"
                  aria-label="Start date"
                />
              </div>

              {/* Arrow */}
              <span className="text-[#94A3B8] shrink-0">
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="currentColor" strokeWidth={1.75} />
              </span>

              {/* End date */}
              <div
                className={`flex-1 flex items-center bg-white rounded-[12px] border transition-colors h-[48px] ${
                  errors.endDate ? "border-[#FECACA] bg-[#FFF5F5]" : "border-[#E1E7EF] focus-within:border-[#0A86A0]"
                }`}
              >
                <span className="pl-3 text-[#0A86A0] shrink-0">
                  <HugeiconsIcon icon={Calendar01Icon} size={17} color="currentColor" strokeWidth={1.75} />
                </span>
                <input
                  id={endDateId}
                  type="date"
                  value={form.endDate}
                  onChange={set("endDate")}
                  onBlur={() => { touch("endDate"); validate(form); }}
                  className="flex-1 bg-transparent pl-2 pr-2 h-full text-[14px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none min-w-0"
                  placeholder="End date"
                  aria-label="End date"
                />
              </div>
            </div>
            {(errors.startDate || errors.endDate) && (
              <p className="text-[12px] font-500 text-[#DC2626] flex items-center gap-1">
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
                {errors.startDate ?? errors.endDate}
              </p>
            )}
          </div>

          {/* 3. Trip name */}
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

          {/* 4. Spending style */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-600 text-[#475569]">Spending style</span>
            <div className="flex bg-white rounded-[12px] p-1 border border-[#E1E7EF]">
              <button
                type="button"
                onClick={() => setSpendingStyle("pay-as-you-go")}
                className={`flex-1 h-[40px] rounded-[10px] text-[14px] font-600 transition-all ${
                  spendingStyle === "pay-as-you-go"
                    ? "bg-[#EFF9FB] text-[#0A86A0] border border-[#A3DFE9]"
                    : "text-[#64748B] hover:text-[#475569]"
                }`}
                aria-pressed={spendingStyle === "pay-as-you-go"}
              >
                Pay as you go
              </button>
              <button
                type="button"
                onClick={() => setSpendingStyle("budget")}
                className={`flex-1 h-[40px] rounded-[10px] text-[14px] font-600 transition-all ${
                  spendingStyle === "budget"
                    ? "bg-[#EFF9FB] text-[#0A86A0] border border-[#A3DFE9]"
                    : "text-[#64748B] hover:text-[#475569]"
                }`}
                aria-pressed={spendingStyle === "budget"}
              >
                Set a budget
              </button>
            </div>
          </div>

          {/* 5. Budget — only when Set a budget is selected */}
          {spendingStyle === "budget" && (
            <Field label="Trip budget" error={errors.budget} htmlFor={budgetId}>
              <div
                className={`flex items-center bg-white rounded-[12px] border transition-colors h-[48px] ${
                  errors.budget
                    ? "border-[#FECACA] bg-[#FFF5F5]"
                    : "border-[#E1E7EF] focus-within:border-[#0A86A0]"
                }`}
              >
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
                  className="flex-1 bg-transparent pl-1.5 pr-2 h-full text-[15px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none num"
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
            </Field>
          )}

          {/* 6. Trip cover */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-600 text-[#475569]">Trip cover</span>

            {coverPreview ? (
              /* Selected state — compact image preview */
              <div className="relative w-full rounded-[12px] overflow-hidden border border-[#E1E7EF]">
                <img
                  src={coverPreview}
                  alt="Trip cover"
                  className="w-full aspect-video object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="pressable px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-[12px] font-600 hover:bg-black/70 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverPreview(null)}
                    className="pressable px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-[12px] font-600 hover:bg-black/70 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              /* Empty state — upload row */
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                className="pressable w-full flex items-center gap-3.5 bg-white rounded-[12px] border border-[#E1E7EF] px-4 py-3.5 hover:border-[#CBD5E1] transition-colors text-left"
                aria-label="Add a cover photo"
              >
                <span className="text-[#0A86A0] shrink-0">
                  <HugeiconsIcon icon={Image01Icon} size={22} color="currentColor" strokeWidth={1.75} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-600 text-[#0F172A] leading-snug">Add a cover photo</p>
                  <p className="text-[12px] font-500 text-[#94A3B8] mt-0.5">Make this trip yours</p>
                </div>
                <span className="text-[#94A3B8] shrink-0">
                  <HugeiconsIcon icon={Upload01Icon} size={20} color="currentColor" strokeWidth={1.75} />
                </span>
              </button>
            )}

            {/* Hidden file input */}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
              aria-label="Upload cover photo"
            />
          </div>

          {/* 7. Note */}
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

          {/* 8. Owner info strip */}
          <div className="flex items-center gap-2.5 pt-1">
            <span className="text-[#94A3B8]">
              <HugeiconsIcon icon={UserIcon} size={16} color="currentColor" strokeWidth={1.75} />
            </span>
            <p className="text-[13px] font-500 text-[#94A3B8]">You'll be added as the trip owner.</p>
          </div>

          {/* 9. Create trip CTA */}
          <div className="pt-2 pb-2">
            <button
              onClick={handleSubmit}
              className="pressable w-full flex items-center justify-center h-[52px] rounded-[14px] bg-[#0A86A0] text-white font-700 text-[16px] shadow-[0_2px_10px_rgba(10,134,160,0.18)] active:scale-[0.985] transition-all"
            >
              Create trip
            </button>
          </div>

        </div>
      </div>

      {/* ── Bottom Navigation ────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-[#E1E7EF] safe-bottom shrink-0">
        <BottomNav activeTab="trips" onTabChange={() => { /* navigation handled by App */ }} />
      </div>
    </div>
  );
}
