import type { ReactNode } from "react";

export type SharedAvatarMember = { initials: string; color: string };

export function Avatar({ member, size = "md" }: { member: SharedAvatarMember; size?: "sm" | "md" | "lg" | "xl" | number }) {
  const preset = { sm: 32, md: 38, lg: 48, xl: 56 } as const;
  const textPreset = { sm: "text-[11px]", md: "text-[13px]", lg: "text-[15px]", xl: "text-[17px]" } as const;
  let dim: number;
  let textClass: string;
  if (typeof size === "number") {
    dim = size;
    textClass = size <= 32 ? "text-[11px]" : size <= 38 ? "text-[13px]" : size <= 48 ? "text-[15px]" : "text-[17px]";
  } else {
    dim = preset[size];
    textClass = textPreset[size];
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 font-700 text-white ${textClass}`}
      style={{ width: dim, height: dim, backgroundColor: member.color }}
    >
      {member.initials}
    </div>
  );
}

export default Avatar;
