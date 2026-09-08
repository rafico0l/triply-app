import { useState, useId } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Calendar01Icon, ArrowRight01Icon, AlertCircleIcon } from "@hugeicons/core-free-icons";
import Sheet from "../../../components/shared/Sheet";
import type { Trip } from "../../../domain/trip";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDates(start: string, end: string): string {
  if (!start) return "";
  const startStr = new Date(start + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (!end || end === start) return startStr;
  const endStr = new Date(end + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${startStr}–${endStr}`;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function EditTripSheet({ trip, onSave, onClose }: {
  trip: Trip; onSave: (patch: { name: string; startDate?: string; endDate?: string; budget?: number }) => void; onClose: () => void;
}) {
  const nameId = useId();
  const budgetId = useId();
  const startDateId = useId();
  const endDateId = useId();

  const [name, setName] = useState(trip.name);
  const [startDate, setStartDate] = useState(trip.startDate ?? "");
  const [endDate, setEndDate] = useState(trip.endDate ?? "");
  const [hasBudget, setHasBudget] = useState(trip.budget != null && trip.budget > 0);
  const [budgetStr, setBudgetStr] = useState(trip.budget != null && trip.budget > 0 ? String(trip.budget) : "");
  const [touchedName, setTouchedName] = useState(false);

  const trimmedName = name.trim();
  const budgetNum = hasBudget ? Number(budgetStr) : undefined;
  const budgetValid = !hasBudget || (budgetStr !== "" && !isNaN(budgetNum!) && budgetNum! > 0);
  const canSave = trimmedName.length > 0 && budgetValid;

  const hasChanges =
    trimmedName !== trip.name ||
    startDate !== (trip.startDate ?? "") ||
    endDate !== (trip.endDate ?? "") ||
    hasBudget !== (trip.budget != null && trip.budget > 0) ||
    (hasBudget && budgetStr !== String(trip.budget ?? ""));

  function handleSave() {
    if (!canSave) return;
    onSave({
      name: trimmedName,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      budget: hasBudget && budgetNum && budgetNum > 0 ? budgetNum : undefined,
    });
  }

  const inputBase = "w-full bg-white rounded-[12px] px-4 h-[48px] text-[15px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none border border-[#E1E7EF] focus:border-[#0A86A0] transition-colors";
  const inputError = "border-[#FECACA] bg-[#FFF5F5]";

  return (
    <Sheet onClose={onClose}>
      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        <h2 className="text-[17px] font-700 text-[#0F172A]">Edit trip</h2>
        <button onClick={onClose} className="pressable text-[14px] font-600 text-[#94A3B8]">Cancel</button>
      </div>

      <div className="max-h-[70dvh] overflow-y-auto">
        <div className="px-5 pb-6 pt-3 space-y-5">
          {/* 1. Trip name */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline gap-1.5">
              <label htmlFor={nameId} className="text-[13px] font-600 text-[#475569]">Trip name</label>
              <span className="text-[13px] font-600 text-[#DC2626]">*</span>
            </div>
            <input
              id={nameId}
              type="text"
              placeholder="Cox's Bazar Getaway"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setTouchedName(true)}
              className={`${inputBase} ${touchedName && !trimmedName ? inputError : ""}`}
            />
            {touchedName && !trimmedName && (
              <p className="text-[12px] font-500 text-[#DC2626] flex items-center gap-1">
                <HugeiconsIcon icon={AlertCircleIcon} size={12} color="currentColor" strokeWidth={2.5} />
                Trip name is required.
              </p>
            )}
          </div>

          {/* 2. Trip dates */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-600 text-[#475569]">Trip dates</span>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-white rounded-[12px] border border-[#E1E7EF] focus-within:border-[#0A86A0] transition-colors h-[48px]">
                <span className="pl-3 text-[#0A86A0] shrink-0">
                  <HugeiconsIcon icon={Calendar01Icon} size={17} color="currentColor" strokeWidth={1.75} />
                </span>
                <input
                  id={startDateId}
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 bg-transparent pl-2 pr-2 h-full text-[14px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none min-w-0"
                  aria-label="Start date"
                />
              </div>
              <span className="text-[#94A3B8] shrink-0">
                <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="currentColor" strokeWidth={1.75} />
              </span>
              <div className="flex-1 flex items-center bg-white rounded-[12px] border border-[#E1E7EF] focus-within:border-[#0A86A0] transition-colors h-[48px]">
                <span className="pl-3 text-[#0A86A0] shrink-0">
                  <HugeiconsIcon icon={Calendar01Icon} size={17} color="currentColor" strokeWidth={1.75} />
                </span>
                <input
                  id={endDateId}
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 bg-transparent pl-2 pr-2 h-full text-[14px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none min-w-0"
                  aria-label="End date"
                />
              </div>
            </div>
          </div>

          {/* 3. Spending style */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-600 text-[#475569]">Spending style</span>
            <div className="flex bg-white rounded-[12px] p-1 border border-[#E1E7EF]">
              <button
                type="button"
                onClick={() => setHasBudget(false)}
                className={`flex-1 h-[40px] rounded-[10px] text-[14px] font-600 transition-all ${
                  !hasBudget
                    ? "bg-[#EFF9FB] text-[#0A86A0] border border-[#A3DFE9]"
                    : "text-[#64748B] hover:text-[#475569]"
                }`}
                aria-pressed={!hasBudget}
              >
                Pay as you go
              </button>
              <button
                type="button"
                onClick={() => setHasBudget(true)}
                className={`flex-1 h-[40px] rounded-[10px] text-[14px] font-600 transition-all ${
                  hasBudget
                    ? "bg-[#EFF9FB] text-[#0A86A0] border border-[#A3DFE9]"
                    : "text-[#64748B] hover:text-[#475569]"
                }`}
                aria-pressed={hasBudget}
              >
                Set a budget
              </button>
            </div>
          </div>

          {/* 4. Budget amount — only when Set a budget is selected */}
          {hasBudget && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={budgetId} className="text-[13px] font-600 text-[#475569]">Trip budget</label>
              <div className={`flex items-center bg-white rounded-[12px] border transition-colors h-[48px] ${budgetStr !== "" && !budgetValid ? inputError : "border-[#E1E7EF] focus-within:border-[#0A86A0]"}`}>
                <span className="pl-4 text-[16px] font-600 text-[#94A3B8] shrink-0 select-none">৳</span>
                <input
                  id={budgetId}
                  type="number"
                  inputMode="decimal"
                  placeholder="50,000"
                  value={budgetStr}
                  onChange={(e) => setBudgetStr(e.target.value.replace(/[^\d]/g, ""))}
                  className="flex-1 bg-transparent pl-1.5 pr-2 h-full text-[15px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none num"
                />
              </div>
              {budgetStr !== "" && !budgetValid && (
                <p className="text-[12px] font-500 text-[#DC2626] flex items-center gap-1">
                  <HugeiconsIcon icon={AlertCircleIcon} size={12} color="currentColor" strokeWidth={2.5} />
                  Budget must be greater than 0.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save CTA */}
      <div className="px-5 pb-5 pt-2">
        <button
          onClick={handleSave}
          disabled={!canSave}
          className={`pressable w-full h-[50px] rounded-[13px] font-700 text-[15px] transition-all ${
            canSave
              ? "bg-[#0A86A0] text-white shadow-[0_4px_16px_rgba(10,134,160,0.22)] active:scale-[0.985]"
              : "bg-[#F1F5F9] text-[#C9D4DF]"
          }`}
        >
          Save changes
        </button>
      </div>
    </Sheet>
  );
}
