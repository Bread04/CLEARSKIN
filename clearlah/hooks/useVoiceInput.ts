"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface VoiceInputState {
  status: "idle" | "listening" | "processing" | "result" | "error";
  transcript: string;
  error: string | null;
}

interface VoiceInputOptions {
  onResult: (text: string) => void;
}

const SpeechRecognitionAPI: any =
  typeof window !== "undefined"
    ? (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    : null;

export function useVoiceInput({ onResult }: VoiceInputOptions) {
  const [state, setState] = useState<VoiceInputState>({
    status: "idle",
    transcript: "",
    error: null,
  });

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");
  const stoppingRef = useRef(false);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const stopListening = useCallback(() => {
    stoppingRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // already stopped
      }
      recognitionRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setState({ status: "error", transcript: "", error: "Voice input not supported in this browser. Try Chrome or Edge." });
      return;
    }

    stoppingRef.current = false;
    finalTranscriptRef.current = "";

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-SG";

    recognition.onstart = () => {
      setState({ status: "listening", transcript: "", error: null });
    };

    recognition.onresult = (event: Event) => {
      const e = event as unknown as { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[] };
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      setState({
        status: "listening",
        transcript: (finalTranscriptRef.current + interim).trim(),
        error: null,
      });
    };

    recognition.onerror = (event: Event) => {
      const e = event as unknown as { error: string };
      if (e.error === "no-speech") {
        setState((s) => ({ ...s, transcript: finalTranscriptRef.current.trim() }));
        return;
      }
      if (e.error === "aborted") return;
      setState({
        status: "error",
        transcript: finalTranscriptRef.current.trim(),
        error: `Voice error: ${e.error}. Try again or type instead.`,
      });
    };

    recognition.onend = () => {
      const wasStopped = stoppingRef.current;
      const final = finalTranscriptRef.current.trim();
      if (final && !wasStopped) {
        setState({ status: "result", transcript: final, error: null });
        onResultRef.current(final);
      } else if (!final && !wasStopped) {
        setState({ status: "idle", transcript: "", error: null });
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const requestMicAndListen = useCallback(async () => {
    try {
      setState({ status: "idle", transcript: "", error: null });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      startListening();
    } catch {
      setState({
        status: "error",
        transcript: "",
        error: "Microphone access denied. You can still type your log.",
      });
    }
  }, [startListening]);

  const reset = useCallback(() => {
    stopListening();
    setState({ status: "idle", transcript: "", error: null });
    finalTranscriptRef.current = "";
  }, [stopListening]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    state,
    startListening: requestMicAndListen,
    stopListening,
    reset,
    isSupported: !!SpeechRecognitionAPI,
  };
}
