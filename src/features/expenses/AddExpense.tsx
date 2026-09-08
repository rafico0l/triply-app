import { useState, useRef, useEffect, useId } from "react";
import PaidBySheet, { type SheetMember } from "./components/PaidBySheet";
import SplitBetweenSheet from "./components/SplitBetweenSheet";
import CategorySheet, { type CategoryDef, BUILTIN_CATEGORIES } from "./components/CategorySheet";
import DateSheet from "./components/DateSheet";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormState {
  amount:      string;
  description: string;
  category:    string | null;
  paidBy:      string;
  splitIds:    string[];
  date:        string;
  expenseId?:  string;
}

interface FormErrors {
  amount?:      string;
  description?: string;
  category?:    string;
  paidBy?:      string;
  splitIds?:    string;
}

export interface InitialExpenseData {
  id:       string;
  amount:   number;
  title:    string;
  category: string;
  paidBy:   string;
  splitIds: string[];
  dateIso:  string;
  note?:    string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDateDisplay(iso: string): string {
  const today = todayISO();
  if (!iso || iso === today) return "Today";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconChevronLeft({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
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

function IconPaperclip({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function IconAlertCircle({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
    </svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InlineError({ msg }: { msg: string }) {
  return (
    <p className="flex items-center gap-1 text-[12px] font-500 text-[#DC2626] mt-1.5">
      <IconAlertCircle size={12} />
      {msg}
    </p>
  );
}

// Tappable selection row — for Paid By, Split, Date (sheets come later)
function SelectionRow({
  label,
  value,
  placeholder,
  hasError,
  onClick,
}: {
  label:       string;
  value?:      string;
  placeholder?: string;
  hasError?:   boolean;
  onClick:     () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pressable w-full flex items-center justify-between px-4 h-[52px] bg-white rounded-[12px] border transition-colors text-left ${
        hasError ? "border-[#FECACA]" : "border-[#E1E7EF] active:border-[#0A86A0]"
      }`}
    >
      <span className="text-[14px] font-600 text-[#475569]">{label}</span>
      <div className="flex items-center gap-1.5">
        <span className={`text-[14px] font-600 ${value ? "text-[#0F172A]" : "text-[#C9D4DF]"}`}>
          {value ?? placeholder}
        </span>
        <span className="text-[#C9D4DF]">
          <IconChevronRight size={16} />
        </span>
      </div>
    </button>
  );
}

// ─── Add Expense Screen ───────────────────────────────────────────────────────
export default function AddExpense({
  tourName,
  members,
  tourStartDate,
  tourEndDate,
  initialExpense,
  mode = "add",
  onClose,
  onSave,
}: {
  tourName:         string;
  members:          SheetMember[];
  tourStartDate?:   string;
  tourEndDate?:     string;
  initialExpense?:  InitialExpenseData;
  mode?:            "add" | "edit";
  onClose:          () => void;
  onSave:           (data: FormState) => void;
}) {
  const amountId      = useId();
  const descriptionId = useId();
  const amountRef     = useRef<HTMLInputElement>(null);

  const defaultPayer = members.find((m) => m.isMe) ?? members[0];

  const [form, setForm] = useState<FormState>(() =>
    initialExpense
      ? {
          amount:      String(initialExpense.amount),
          description: initialExpense.title,
          category:    initialExpense.category,
          paidBy:      initialExpense.paidBy,
          splitIds:    initialExpense.splitIds,
          date:        initialExpense.dateIso,
          expenseId:   initialExpense.id,
        }
      : {
          amount:      "",
          description: "",
          category:    null,
          paidBy:      defaultPayer?.id ?? "",
          splitIds:    members.map((m) => m.id),
          date:        "",
        }
  );

  const [showPaidBySheet,       setShowPaidBySheet]       = useState(false);
  const [showSplitBetweenSheet, setShowSplitBetweenSheet] = useState(false);
  const [showCategorySheet,     setShowCategorySheet]     = useState(false);
  const [showDateSheet,         setShowDateSheet]         = useState(false);
  const [customCategories,      setCustomCategories]      = useState<CategoryDef[]>([]);

  const [errors,  setErrors]  = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<keyof FormState>>(new Set());

  // Auto-focus amount on mount.
  useEffect(() => {
    const t = setTimeout(() => amountRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  const touch = (field: keyof FormState) =>
    setTouched((prev) => new Set([...prev, field]));

  const validate = (f: FormState): FormErrors => {
    const e: FormErrors = {};
    const num = parseFloat(f.amount);
    if (!f.amount || isNaN(num) || num <= 0) e.amount = "Enter an amount greater than 0.";
    if (!f.description.trim())               e.description = "Describe what this expense was for.";
    if (!f.category)                         e.category = "Select a category.";
    if (!f.paidBy)                           e.paidBy = "Select who paid.";
    if (f.splitIds.length === 0)             e.splitIds = "Select at least one person to split with.";
    return e;
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip any non-numeric except decimal point
    const raw = e.target.value.replace(/[^\d.]/g, "");
    setForm((f) => ({ ...f, amount: raw }));
    if (touched.has("amount")) setErrors((prev) => ({ ...prev, ...validate({ ...form, amount: raw }) }));
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setForm((f) => ({ ...f, description: v }));
    if (touched.has("description")) setErrors((prev) => ({ ...prev, ...validate({ ...form, description: v }) }));
  };

  const handleSave = () => {
    const allTouched = new Set<keyof FormState>(["amount", "description", "category", "paidBy", "splitIds"]);
    setTouched(allTouched);
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onSave(form);
    }
  };

  const formattedDate = form.date ? formatDateDisplay(form.date) : "Today";

  return (
    <div
      className="fixed inset-0 z-50 bg-[#F4F6F9] flex flex-col overflow-hidden"
      style={{ animation: "slideInFromRight 220ms cubic-bezier(0.32,0.72,0,1)" }}
    >

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E1E7EF] safe-top shrink-0">
        <div className="flex items-center gap-1 px-2 h-[52px]">
          <button
            onClick={onClose}
            className="pressable w-10 h-10 flex items-center justify-center rounded-full text-[#475569]"
            aria-label="Discard and go back"
          >
            <IconChevronLeft size={22} />
          </button>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h1 className="text-[16px] font-700 text-[#0F172A] leading-none">{mode === "edit" ? "Edit expense" : "Add expense"}</h1>
            <p className="text-[12px] text-[#94A3B8] font-500 mt-[3px] truncate leading-none">
              {tourName}
            </p>
          </div>
        </div>
      </div>

      {/* ── Scrollable form ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-5 pb-6 space-y-4 max-w-[520px] mx-auto w-full">

          {/* ── Amount ─────────────────────────────────────────────────────── */}
          <div>
            <label
              htmlFor={amountId}
              className="text-[11px] font-700 text-[#475569] uppercase tracking-wide block mb-2"
            >
              Amount
            </label>
            <div
              className={`flex items-center bg-white rounded-[13px] border-2 transition-colors h-[64px] px-4 gap-2 ${
                errors.amount && touched.has("amount")
                  ? "border-[#FECACA] bg-[#FFF5F5]"
                  : "border-[#E1E7EF] focus-within:border-[#0A86A0] focus-within:bg-white"
              }`}
            >
              <span className="text-[26px] font-700 text-[#94A3B8] leading-none select-none shrink-0">৳</span>
              <input
                id={amountId}
                ref={amountRef}
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={form.amount}
                onChange={handleAmountChange}
                onBlur={() => { touch("amount"); setErrors(validate(form)); }}
                className="flex-1 bg-transparent text-[30px] font-800 text-[#0F172A] outline-none num placeholder:text-[#E1E7EF] leading-none"
                autoComplete="off"
              />
            </div>
            {errors.amount && touched.has("amount") && <InlineError msg={errors.amount} />}
          </div>

          {/* ── Description ────────────────────────────────────────────────── */}
          <div>
            <label
              htmlFor={descriptionId}
              className="text-[11px] font-700 text-[#475569] uppercase tracking-wide block mb-2"
            >
              What was it for?
            </label>
            <input
              id={descriptionId}
              type="text"
              placeholder="e.g. Dinner at Jhawban"
              value={form.description}
              onChange={handleDescriptionChange}
              onBlur={() => { touch("description"); setErrors(validate(form)); }}
              className={`w-full bg-white rounded-[12px] px-4 h-12 text-[15px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none border-2 transition-colors ${
                errors.description && touched.has("description")
                  ? "border-[#FECACA] bg-[#FFF5F5]"
                  : "border-[#E1E7EF] focus:border-[#0A86A0]"
              }`}
            />
            {errors.description && touched.has("description") && <InlineError msg={errors.description} />}
          </div>

          {/* ── Divider ────────────────────────────────────────────────────── */}
          <div className="border-t border-[#E1E7EF]" />

          {/* ── Selection rows ─────────────────────────────────────────────── */}
          <div className="space-y-2">
            <SelectionRow
              label="Category"
              value={(() => {
                if (!form.category) return undefined;
                const all = [...BUILTIN_CATEGORIES, ...customCategories];
                return all.find((c) => c.id === form.category)?.label ?? form.category;
              })()}
              placeholder="Select a category"
              hasError={!!(touched.has("category") && errors.category)}
              onClick={() => setShowCategorySheet(true)}
            />
            {touched.has("category") && errors.category && <InlineError msg={errors.category} />}
            <SelectionRow
              label="Paid by"
              value={(() => {
                const m = members.find((m) => m.id === form.paidBy);
                if (!m) return undefined;
                return m.isMe ? `${m.name} · You` : m.name;
              })()}
              onClick={() => setShowPaidBySheet(true)}
            />
            {touched.has("paidBy") && errors.paidBy && <InlineError msg={errors.paidBy} />}
            <SelectionRow
              label="Split between"
              value={`${form.splitIds.length} ${form.splitIds.length === 1 ? "person" : "people"}`}
              onClick={() => setShowSplitBetweenSheet(true)}
            />
            {touched.has("splitIds") && errors.splitIds && <InlineError msg={errors.splitIds} />}
            <SelectionRow
              label="Date"
              value={formattedDate}
              onClick={() => setShowDateSheet(true)}
            />
          </div>

          {/* ── Attachment ─────────────────────────────────────────────────── */}
          <button
            type="button"
            className="pressable w-full flex items-center gap-3 px-4 h-[48px] rounded-[12px] border border-dashed border-[#C9D4DF] text-[#94A3B8] hover:border-[#94A3B8] hover:text-[#475569] transition-colors"
          >
            <IconPaperclip size={15} />
            <span className="text-[14px] font-500">Add image of receipt</span>
            <span className="ml-auto text-[11px] font-500 text-[#C9D4DF]">Optional</span>
          </button>

        </div>
      </div>

      {/* ── Sticky bottom CTA ─────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-[#E1E7EF] px-4 py-3 safe-bottom shrink-0">
        <button
          onClick={handleSave}
          className="pressable w-full flex items-center justify-center rounded-[13px] bg-[#0A86A0] text-white font-700 text-[15px] shadow-[0_2px_10px_rgba(10,134,160,0.18)] active:scale-[0.985] transition-all"
          style={{ height: 52 }}
        >
          {mode === "edit" ? "Save changes" : "Save expense"}
        </button>
      </div>

      {/* ── Category sheet ───────────────────────────────────────────────────── */}
      {showCategorySheet && (
        <CategorySheet
          selected={form.category}
          customCategories={customCategories}
          onSelect={(id, label, isNew) => {
            if (isNew) {
              setCustomCategories((prev) => [...prev, { id, label, icon: null }]);
            }
            setForm((f) => ({ ...f, category: id }));
            touch("category");
            setErrors((prev) => ({ ...prev, category: undefined }));
          }}
          onClose={() => setShowCategorySheet(false)}
        />
      )}

      {/* ── Paid By sheet ────────────────────────────────────────────────────── */}
      {showPaidBySheet && (
        <PaidBySheet
          members={members}
          selectedId={form.paidBy}
          onSelect={(id) => setForm((f) => ({ ...f, paidBy: id }))}
          onClose={() => setShowPaidBySheet(false)}
        />
      )}

      {/* ── Date sheet ───────────────────────────────────────────────────────── */}
      {showDateSheet && (
        <DateSheet
          selectedDate={form.date}
          tourStartDate={tourStartDate}
          tourEndDate={tourEndDate}
          onConfirm={(iso) => setForm((f) => ({ ...f, date: iso }))}
          onClose={() => setShowDateSheet(false)}
        />
      )}

      {/* ── Split Between sheet ──────────────────────────────────────────────── */}
      {showSplitBetweenSheet && (
        <SplitBetweenSheet
          members={members}
          selectedIds={form.splitIds}
          amount={form.amount}
          onConfirm={(ids) => setForm((f) => ({ ...f, splitIds: ids }))}
          onClose={() => setShowSplitBetweenSheet(false)}
        />
      )}
    </div>
  );
}
