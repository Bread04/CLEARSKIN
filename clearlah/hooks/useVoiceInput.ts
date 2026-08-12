"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface VoiceInputState {
  status: "idle" | "listening" | "processing" | "result" | "error";
  transcript: string;
  error: string | null;
}

interface VoiceInputOptions {
  onResult: (text: string) => void;
  wakeWord?: string;
}

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? (window as unknown as Record<string, unknown>).SpeechRecognition ||
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    : null;

export function useVoiceInput({ onResult, wakeWord }: VoiceInputOptions) {
  const [state, setState] = useState<VoiceInputState>({
    status: "idle",
    transcript: "",
    error: null,
  });

  const recognitionRef = useRef<InstanceType<typeof SpeechRecognitionAPI> | null>(null);
  const wakeDetectorRef = useRef<{ ctx: AudioContext; analyser: AnalyserNode; stream: MediaStream } | null>(null);
  const finalTranscriptRef = useRef("");
  const wakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopWakeDetection = useCallback(() => {
    if (wakeTimeoutRef.current) {
      clearTimeout(wakeTimeoutRef.current);
      wakeTimeoutRef.current = null;
    }
    if (wakeDetectorRef.current) {
      wakeDetectorRef.current.stream.getTracks().forEach((t) => t.stop());
      wakeDetectorRef.current.ctx.close();
      wakeDetectorRef.current = null;
    }
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognitionAPI) {
      setState({ status: "error", transcript: "", error: "Voice input not supported in this browser. Try Chrome or Edge." });
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-SG";

    recognition.onstart = () => {
      setState({ status: "listening", transcript: "", error: null });
      finalTranscriptRef.current = "";
    };

    recognition.onresult = (event: Event) => {
      const e = event as { resultIndex: number; results: { isFinal: boolean; 0: { transcript: string } }[][] };
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
      const e = event as { error: string };
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
      const final = finalTranscriptRef.current.trim();
      if (final) {
        setState({ status: "result", transcript: final, error: null });
        onResult(final);
      } else if (state.status === "listening") {
        setState({ status: "idle", transcript: "", error: null });
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [onResult, state.status]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const startWakeDetection = useCallback(async () => {
    if (!wakeWord) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      wakeDetectorRef.current = { ctx, analyser, stream };

      const buffer = new Uint8Array(analyser.frequencyBinCount);
      const check = () => {
        if (!wakeDetectorRef.current) return;
        analyser.getByteFrequencyData(buffer);
        const avg = buffer.reduce((a, b) => a + b, 0) / buffer.length;
        if (avg > 30) {
          stopWakeDetection();
          startListening();
          return;
        }
        wakeTimeoutRef.current = setTimeout(check, 200);
      };
      check();
    } catch {
      // Microphone denied — fall back to button activation
    }
  }, [wakeWord, stopWakeDetection, startListening]);

  const requestMicAndListen = useCallback(async () => {
    try {
      setState({ status: "idle", transcript: "", error: null });
      await navigator.mediaDevices.getUserMedia({ audio: true });
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
    stopWakeDetection();
    setState({ status: "idle", transcript: "", error: null });
    finalTranscriptRef.current = "";
  }, [stopListening, stopWakeDetection]);

  useEffect(() => {
    return () => {
      stopListening();
      stopWakeDetection();
    };
  }, [stopListening, stopWakeDetection]);

  return {
    state,
    startListening: requestMicAndListen,
    stopListening,
    startWakeDetection,
    reset,
    isSupported: !!SpeechRecognitionAPI,
  };
}
