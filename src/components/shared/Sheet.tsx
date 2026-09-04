import React, { type ReactNode } from "react";

function Sheet({ onClose, children }: { onClose: () => void; children: ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} style={{ animation: "fadeIn 150ms ease" }} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white rounded-t-[24px] z-50 safe-bottom" style={{ animation: "sheetUp 240ms cubic-bezier(0.32,0.72,0,1)" }}>
        <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-[#E1E7EF] rounded-full" /></div>
        {children}
      </div>
    </>
  );
}

export default Sheet;
