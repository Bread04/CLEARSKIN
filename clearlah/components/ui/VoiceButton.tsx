"use client";

import { useState, useEffect } from "react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface VoiceButtonProps {
  onResult: (text: string) => void;
  className?: string;
}

export default function VoiceButton({ onResult, className = "" }: VoiceButtonProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { state, startListening, stopListening, isSupported } = useVoiceInput({
    onResult,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Render nothing until mounted to avoid a server/client hydration mismatch
  // (window.SpeechRecognition is undefined on the server).
  if (!mounted) return null;

  if (!isSupported) return null;

  const handleClick = () => {
    if (!privacyAccepted) {
      setShowPrompt(true);
      return;
    }
    if (state.status === "listening") {
      stopListening(true);
    } else {
      startListening();
    }
  };

  if (showPrompt) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
        <div className="card rounded-xl p-6 max-w-sm w-full space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary-sage-50 flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-primary-sage"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
          </div>
          <h3 className="text-h3 text-center text-neutral-800">Voice Logging</h3>
          <p className="text-body-sm text-neutral-500 text-center">
            Speak naturally and ClearLah will transcribe and log your day. Voice is processed on your device — nothing is recorded or stored.
          </p>
          <button type="button" onClick={() => { setPrivacyAccepted(true); setShowPrompt(false); startListening(); }}
            className="btn-primary w-full">
            Got it — start listening
          </button>
          <button type="button" onClick={() => setShowPrompt(false)}
            className="btn-ghost w-full text-neutral-500">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`relative min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-colors ${className}`}
      aria-label={state.status === "listening" ? "Stop listening" : "Start voice input"}
    >
      {state.status === "listening" ? (
        <span className="relative flex h-11 w-11">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary-terracotta opacity-30" />
          <span className="relative inline-flex rounded-full h-11 w-11 bg-secondary-terracotta items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-5 h-5"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
          </span>
        </span>
      ) : state.status === "error" ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-status-error"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-neutral-600 hover:text-primary-sage"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" /></svg>
      )}

      {state.status === "listening" && state.transcript && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 min-w-[200px] card rounded-lg p-3 text-body-sm text-neutral-700 shadow-lg z-10">
          {state.transcript}
        </div>
      )}

      {state.status === "error" && state.error && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 min-w-[200px] card rounded-lg p-3 text-body-sm text-status-error shadow-lg z-10">
          {state.error}
        </div>
      )}
    </button>
  );
}
