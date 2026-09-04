import { useState, useRef, useId } from "react";
import Avatar from "../../components/shared/Avatar";
import { IconTrash } from "../../components/shared/icons";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SetupMember {
  id: string;
  name: string;
  initials: string;
  color: string;
  isMe?: boolean;
}

interface CreateTourData {
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  budget: string;
  currency: string;
  note: string;
  addMe: boolean;
}

// ─── Avatar color pool ────────────────────────────────────────────────────────
const COLORS = [
  "#0A86A0", // teal (reserved for "me")
  "#7C3AED",
  "#059669",
  "#D97706",
  "#E11D48",
  "#2563EB",
  "#9333EA",
  "#0891B2",
  "#65A30D",
  "#DC2626",
];

let colorCursor = 1; // start at 1, 0 is reserved for "me"
function nextColor(): string {
  const c = COLORS[colorCursor % COLORS.length];
  colorCursor++;
  return c;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconChevronLeft({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function IconDots({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="5"  cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="19" cy="12" r="1.2" fill="currentColor" />
    </svg>
  );
}

function IconPlus({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function IconPencil({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}



// Avatar provided by src/components/shared/Avatar

// ─── Overflow menu ────────────────────────────────────────────────────────────
function OverflowMenu({
  onEdit,
  onRemove,
  onClose,
}: {
  onEdit: () => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-30" onClick={onClose} />
      <div className="absolute right-0 top-full mt-1 z-40 bg-white border border-[#E1E7EF] rounded-[12px] shadow-[0_4px_24px_rgba(15,23,42,0.10)] overflow-hidden min-w-[148px]">
        <button
          onClick={() => { onEdit(); onClose(); }}
          className="pressable flex items-center gap-2.5 w-full px-4 py-3 text-[14px] font-600 text-[#0F172A] hover:bg-[#F4F6F9] transition-colors"
        >
          <span className="text-[#475569]"><IconPencil size={14} /></span>
          Edit name
        </button>
        <div className="h-px bg-[#F1F5F9] mx-3" />
        <button
          onClick={() => { onRemove(); onClose(); }}
          className="pressable flex items-center gap-2.5 w-full px-4 py-3 text-[14px] font-600 text-[#DC2626] hover:bg-[#FFF5F5] transition-colors"
        >
          <IconTrash size={14} />
          Remove
        </button>
      </div>
    </>
  );
}

// ─── Member row ───────────────────────────────────────────────────────────────
function MemberRow({
  member,
  onEdit,
  onRemove,
}: {
  member: SetupMember;
  onEdit: (id: string, newName: string) => void;
  onRemove: (id: string) => void;
}) {
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [editMode,   setEditMode]   = useState(false);
  const [editName,   setEditName]   = useState(member.name);
  const editRef = useRef<HTMLInputElement>(null);
  const editId  = useId();

  const commitEdit = () => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== member.name) onEdit(member.id, trimmed);
    else setEditName(member.name);
    setEditMode(false);
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Avatar member={member} />

      <div className="flex-1 min-w-0">
        {editMode ? (
          <input
            id={editId}
            ref={editRef}
            autoFocus
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit();
              if (e.key === "Escape") { setEditName(member.name); setEditMode(false); }
            }}
            className="w-full bg-[#F4F6F9] border border-[#0A86A0] rounded-[8px] px-3 h-9 text-[14px] font-600 text-[#0F172A] outline-none"
          />
        ) : (
          <p className="text-[14px] font-600 text-[#0F172A] truncate leading-snug">
            {member.name}
          </p>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-2">
        {member.isMe ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-700 bg-[#EFF9FB] text-[#0A7490] border border-[#A3DFE9]">
            You
          </span>
        ) : (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="pressable w-8 h-8 flex items-center justify-center rounded-full text-[#94A3B8] hover:bg-[#F4F6F9] transition-colors"
              aria-label="Member options"
            >
              <IconDots size={18} />
            </button>
            {menuOpen && (
              <OverflowMenu
                onEdit={() => { setEditMode(true); setTimeout(() => editRef.current?.select(), 30); }}
                onRemove={() => onRemove(member.id)}
                onClose={() => setMenuOpen(false)}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Member Setup Screen ──────────────────────────────────────────────────────
export default function MemberSetup({
  tourData,
  onBack,
  onCreateTour,
}: {
  tourData: CreateTourData;
  onBack: () => void;
  onCreateTour: (members: SetupMember[]) => void;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [nameInput, setNameInput] = useState("");
  const [inputError, setInputError] = useState("");

  const initialMembers: SetupMember[] = tourData.addMe
    ? [{ id: "me", name: "Rafi", initials: "RI", color: COLORS[0], isMe: true }]
    : [];

  const [members, setMembers] = useState<SetupMember[]>(initialMembers);

  const addMember = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setInputError("Enter a name first.");
      inputRef.current?.focus();
      return;
    }
    const isDupe = members.some(
      (m) => m.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDupe) {
      setInputError(`${trimmed} is already on the list.`);
      return;
    }
    setMembers((prev) => [
      ...prev,
      { id: uid(), name: trimmed, initials: initials(trimmed), color: nextColor() },
    ]);
    setNameInput("");
    setInputError("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const editMember = (id: string, newName: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, name: newName, initials: initials(newName) } : m
      )
    );
  };

  const removeMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") addMember();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNameInput(e.target.value);
    if (inputError) setInputError("");
  };

  return (
    <div className="h-full bg-[#F4F6F9] flex flex-col overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[#E1E7EF] safe-top shrink-0">
        <div className="flex items-center gap-1 px-2 h-[52px]">
          <button
            onClick={onBack}
            className="pressable w-10 h-10 flex items-center justify-center rounded-full text-[#475569]"
            aria-label="Go back"
          >
            <IconChevronLeft size={22} />
          </button>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h1 className="text-[16px] font-700 text-[#0F172A] leading-none">Add members</h1>
            <p className="text-[12px] text-[#94A3B8] font-500 mt-[3px] truncate leading-none">
              {tourData.name || "New tour"}
            </p>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ─────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-6 pb-8 max-w-[520px] mx-auto w-full">

          {/* Intro */}
          <div className="mb-5">
            <h2 className="text-[20px] font-800 text-[#0F172A] leading-snug mb-1">
              Who&apos;s going?
            </h2>
            <p className="text-[14px] text-[#94A3B8] font-500 leading-relaxed">
              Add the people sharing expenses on this tour.
            </p>
          </div>

          {/* Quick-add input */}
          <div className="mb-5">
            <label htmlFor={inputId} className="text-[11px] font-700 text-[#475569] uppercase tracking-wide block mb-1.5">
              Member name
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  id={inputId}
                  ref={inputRef}
                  type="text"
                  placeholder="e.g. Nadia Islam"
                  value={nameInput}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className={`w-full bg-[#F4F6F9] rounded-[11px] px-4 h-12 text-[15px] font-500 text-[#0F172A] placeholder:text-[#C9D4DF] outline-none border transition-colors ${
                    inputError
                      ? "border-[#FECACA] bg-[#FFF5F5] focus:border-[#DC2626]"
                      : "border-[#E1E7EF] focus:border-[#0A86A0] focus:bg-white"
                  }`}
                />
              </div>
              <button
                onClick={addMember}
                className="pressable flex items-center gap-1.5 px-4 h-12 rounded-[11px] bg-[#0A86A0] text-white font-700 text-[14px] shrink-0 transition-opacity"
              >
                <IconPlus size={15} />
                Add
              </button>
            </div>
            {inputError && (
              <p className="mt-1.5 text-[12px] font-500 text-[#DC2626] flex items-center gap-1">
                <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                </svg>
                {inputError}
              </p>
            )}
          </div>

          {/* Member list */}
          {members.length > 0 && (
            <div>
              {/* Count */}
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="text-[11px] font-700 text-[#94A3B8] uppercase tracking-wider">
                  Members
                </p>
                <p className="text-[12px] font-600 text-[#475569]">
                  {members.length} {members.length === 1 ? "member" : "members"}
                </p>
              </div>

              <div className="bg-white rounded-[14px] border border-[#E1E7EF] overflow-hidden divide-y divide-[#F4F6F9]">
                {members.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    onEdit={editMember}
                    onRemove={removeMember}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty nudge — shown when addMe is off and no one added yet */}
          {members.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center px-4">
              <p className="text-[14px] font-600 text-[#C9D4DF]">No members yet</p>
              <p className="text-[13px] text-[#C9D4DF] font-500 mt-1">
                Add at least one person above.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* ── Sticky bottom CTA ────────────────────────────────────────────────── */}
      <div className="bg-white border-t border-[#E1E7EF] px-4 py-3 safe-bottom shrink-0">
        <button
          onClick={() => onCreateTour(members)}
          className="pressable w-full flex items-center justify-center rounded-[13px] bg-[#0A86A0] text-white font-700 text-[15px] shadow-[0_2px_10px_rgba(10,134,160,0.18)] transition-all"
          style={{ height: 52 }}
        >
          Create tour
        </button>
      </div>
    </div>
  );
}
