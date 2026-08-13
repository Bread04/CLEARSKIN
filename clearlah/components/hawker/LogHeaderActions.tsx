"use client";

import { useState } from "react";
import VoiceButton from "@/components/ui/VoiceButton";
import LogScanButton from "@/components/hawker/LogScanButton";
import SkinCheck from "@/components/skin/SkinCheck";

export default function LogHeaderActions() {
  const [skinCheckOpen, setSkinCheckOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <VoiceButton
        onResult={(text) => {
          sessionStorage.setItem("clearlah_voice_text", text);
          window.location.reload();
        }}
      />
      <LogScanButton />
      <button
        type="button"
        onClick={() => setSkinCheckOpen(true)}
        className="btn-secondary flex items-center gap-1.5 min-h-[44px]"
        aria-label="Check your skin"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <path d="M12 2a5 5 0 0 1 5 5c0 2-1 3.5-2 4.5V13a3 3 0 0 1-6 0v-1.5C8 10.5 7 9 7 7a5 5 0 0 1 5-5z" />
          <path d="M9 20h6" />
          <path d="M12 17v3" />
        </svg>
        <span className="hidden sm:inline text-body-sm">Skin check</span>
      </button>

      {skinCheckOpen && <SkinCheck onClose={() => setSkinCheckOpen(false)} />}
    </div>
  );
}
