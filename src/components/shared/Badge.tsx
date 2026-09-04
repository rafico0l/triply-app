import React from "react";

export default function Badge({ label, variant }: { label: string; variant: "positive" | "negative" | "warning" | "neutral" | "brand" }) {
  const styles = {
    positive: "bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]",
    negative: "bg-[#FFF5F5] text-[#DC2626] border-[#FECACA]",
    warning:  "bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]",
    neutral:  "bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]",
    brand:    "bg-[#EFF9FB] text-[#0A86A0] border-[#A3DFE9]",
  } as const;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-600 border ${styles[variant]}`}>
      {label}
    </span>
  );
}
