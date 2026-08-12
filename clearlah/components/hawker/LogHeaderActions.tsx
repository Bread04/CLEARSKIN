"use client";

import VoiceButton from "@/components/ui/VoiceButton";
import LogScanButton from "@/components/hawker/LogScanButton";

export default function LogHeaderActions() {
  return (
    <div className="flex items-center gap-2">
      <VoiceButton
        onResult={(text) => {
          sessionStorage.setItem("clearlah_voice_text", text);
          window.location.reload();
        }}
      />
      <LogScanButton />
    </div>
  );
}
