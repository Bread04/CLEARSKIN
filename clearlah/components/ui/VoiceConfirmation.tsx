"use client";

import { useEffect, useRef, useState } from "react";

interface VoiceConfirmationProps {
  items: string[];
  onConfirm: () => void;
  onEdit: () => void;
  speaking: boolean;
}

export default function VoiceConfirmation({ items, onConfirm, onEdit, speaking }: VoiceConfirmationProps) {
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [listening, setListening] = useState(false);
  const [voiceResponse, setVoiceResponse] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const confirmText = `Got it — ${items.join(", ")}. Say yes to save, no to cancel, or edit to fix.`;

  useEffect(() => {
    if (!speaking) return;
    const utterance = new SpeechSynthesisUtterance(confirmText);
    utterance.lang = "en-SG";
    utterance.rate = 0.9;
    synthRef.current = utterance;

    const voices = speechSynthesis.getVoices();
    const sgVoice = voices.find((v) => v.lang.startsWith("en-SG") || v.lang.startsWith("en-GB"));
    if (sgVoice) utterance.voice = sgVoice;

    speechSynthesis.speak(utterance);

    return () => {
      speechSynthesis.cancel();
    };
  }, [speaking, confirmText]);

  useEffect(() => {
    if (!speaking) return;

    const timer = setTimeout(() => {
      const SpeechRecognitionAPI: any =
        (window as unknown as Record<string, unknown>).SpeechRecognition ||
        (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

      if (!SpeechRecognitionAPI) return;

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-SG";

      recognition.onresult = (event: Event) => {
        const e = event as unknown as { results: { 0: { transcript: string } }[] };
        const text = e.results[0][0].transcript.toLowerCase().trim();
        setVoiceResponse(text);

        if (text.includes("yes") || text.includes("save") || text.includes("yeah")) {
          onConfirm();
        } else if (text.includes("no") || text.includes("cancel")) {
          // do nothing, stay on chat
        } else if (text.includes("edit") || text.includes("fix") || text.includes("change")) {
          onEdit();
        }
      };

      recognition.onerror = () => {
        setListening(false);
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
    }, 2000);

    return () => {
      clearTimeout(timer);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [speaking, onConfirm, onEdit]);

  return (
    <div className="card rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${listening ? "bg-primary-sage-50" : "bg-neutral-100"}`}>
          {listening ? (
            <div className="w-3 h-3 border-2 border-primary-sage border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-neutral-500"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /></svg>
          )}
        </div>
        <div>
          <p className="text-body-sm text-neutral-800">{confirmText}</p>
          {listening && <p className="text-caption text-primary-sage mt-0.5">Listening for your response...</p>}
          {voiceResponse && !listening && <p className="text-caption text-neutral-500 mt-0.5">Heard: &quot;{voiceResponse}&quot;</p>}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={onConfirm} className="btn-primary flex-1 text-body-sm">Yes, save</button>
        <button type="button" onClick={onEdit} className="btn-secondary flex-1 text-body-sm">Edit</button>
      </div>
    </div>
  );
}
