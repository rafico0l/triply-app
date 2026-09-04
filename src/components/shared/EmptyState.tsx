import type { ReactNode } from "react";

export default function EmptyState({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="w-16 h-16 rounded-[18px] bg-[#F1F5F9] flex items-center justify-center text-[#94A3B8] mb-4">
        {icon}
      </div>
      <p className="text-[16px] font-700 text-[#0F172A] mb-2">{title}</p>
      <p className="text-[14px] text-[#94A3B8] font-500 leading-relaxed max-w-[260px]">{body}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}