"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  SKIN_DISCLAIMER,
  type SkinAssessment,
  type SkinSeverity,
} from "@/lib/skin-check";
import { getDemoDateForSave } from "@/lib/utils/demo";

interface SkinCheckProps {
  onClose: () => void;
}

type Step = "prompt" | "preview" | "analyzing" | "result";

const SEVERITY_BADGE: Record<SkinSeverity, string> = {
  clear: "bg-severity-1 text-white",
  mild: "bg-severity-3 text-white",
  moderate: "bg-severity-5 text-white",
  severe: "bg-severity-9 text-white",
};

const SEVERITY_LABELS: Record<SkinSeverity, string> = {
  clear: "Clear",
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
};

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB — reject before reading to avoid freezing the tab

async function fileToCompressedDataUrl(file: File, maxDim = 1024): Promise<string> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("That photo is too large. Choose an image under 10MB.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

  // Prefer createImageBitmap with EXIF orientation so rotated phone photos are
  // assessed upright; fall back to <img> on older browsers.
  let source: CanvasImageSource;
  let w: number;
  let h: number;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    source = bitmap;
    w = bitmap.width;
    h = bitmap.height;
  } catch {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Could not load image"));
      el.src = dataUrl;
    });
    source = img;
    w = img.naturalWidth || img.width;
    h = img.naturalHeight || img.height;
  }

  if (!w || !h) throw new Error("Unsupported image format. Try a JPEG or PNG photo.");

  if (w > maxDim || h > maxDim) {
    const ratio = Math.min(maxDim / w, maxDim / h);
    w = Math.round(w * ratio);
    h = Math.round(h * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process the image on this device.");
  ctx.drawImage(source, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export default function SkinCheck({ onClose }: SkinCheckProps) {
  const [step, setStep] = useState<Step>("prompt");
  const [image, setImage] = useState<string | null>(null);
  const [assessment, setAssessment] = useState<SkinAssessment | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File | null) => {
    if (!file) return;
    setError(null);
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      setImage(dataUrl);
      setAssessment(null);
      setMessage(null);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Couldn't read that photo. Try another one.");
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const analyze = useCallback(async () => {
    if (!image) return;
    setStep("analyzing");
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/ai/assess-skin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to assess skin");
      }

      const data = await res.json();
      if (!data.assessment) {
        setMessage(data.message || "Couldn't get a clear read. Try a closer photo in good light.");
        setStep("result");
        return;
      }
      setAssessment(data.assessment);
      setStep("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't assess your skin. Try again.");
      setStep("preview");
    }
  }, [image]);

  const handleLog = useCallback(async () => {
    if (!assessment) return;
    setSaving(true);
    try {
      const weatherRes = await fetch("/api/weather");
      if (!weatherRes.ok) throw new Error("Could not fetch weather data.");
      const weatherSnapshot = await weatherRes.json();

      const skinScore = assessment.score < 1 ? null : Math.max(1, Math.round(assessment.score));

      const log = {
        food: { items: [] as string[] },
        lifestyle: {
          sleep_hours: null,
          stress_level: null,
          stress_type: null,
          exercise_minutes: null,
          water_ml: null,
          caffeine_cups: null,
          alcohol_drinks: null,
        },
        skincare: null,
        symptoms: { skin: skinScore, gut: null, respiratory: null },
        summary: `Skin check: ${assessment.summary}`,
      };

      const saveBody: Record<string, unknown> = {
        log,
        weather_snapshot: weatherSnapshot,
      };
      const demoDate = getDemoDateForSave();
      if (demoDate) saveBody.demo_date = demoDate;

      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saveBody),
      });

      if (!res.ok) throw new Error("Could not save your log.");
      onClose();
    } catch {
      setError("Could not save your log. Please try again.");
      setSaving(false);
    }
  }, [assessment, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-neutral-900 flex flex-col"
      role="dialog"
      aria-modal="true"
      aria-label="Skin check"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white/80 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Close skin check"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>

      {error && (
        <div className="absolute top-16 left-4 right-4 bg-secondary-terracotta text-white text-body-sm p-3 rounded-lg z-10">
          {error}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {step === "prompt" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10"><path d="M12 2a5 5 0 0 1 5 5c0 2-1 3.5-2 4.5V13a3 3 0 0 1-6 0v-1.5C8 10.5 7 9 7 7a5 5 0 0 1 5-5z" /><path d="M9 20h6" /><path d="M12 17v3" /></svg>
          </div>
          <h2 className="text-h2 text-white mb-2">Skin Check</h2>
          <p className="text-body-md text-white/60 mb-3">
            Upload a photo of your skin to get a flare tracking score — watch how it changes over time.
          </p>
          <p className="text-caption text-white/40 mb-8">
            Photos are sent to our AI provider for analysis and never stored. This is a tracking score, not a diagnosis.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn-primary bg-white text-neutral-900 hover:bg-neutral-100"
          >
            Choose a photo
          </button>
        </div>
      )}

      {step === "preview" && image && (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <img src={image} alt="Skin photo to analyze" className="max-h-[55vh] max-w-full object-contain rounded-xl" />
          <div className="flex gap-3 mt-6">
            <button type="button" onClick={() => inputRef.current?.click()} className="btn-secondary bg-white/20 text-white hover:bg-white/30 border-white/30">
              Retake
            </button>
            <button type="button" onClick={analyze} className="btn-primary bg-white text-neutral-900 hover:bg-neutral-100">
              Analyze skin
            </button>
          </div>
        </div>
      )}

      {step === "analyzing" && (
        <div className="flex-1 flex items-center justify-center">
          <div className="card rounded-xl px-6 py-4 bg-white text-neutral-800 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary-sage border-t-transparent rounded-full animate-spin" />
            <span className="text-body-md">Reading your skin…</span>
          </div>
        </div>
      )}

      {step === "result" && assessment && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-md mx-auto space-y-4 pb-10">
            <div className="card rounded-xl p-6 bg-white text-center">
              <p className="text-caption text-neutral-500 mb-1">Your flare tracking score</p>
              <div className="flex items-center justify-center gap-3 mb-2">
                <span className="text-numeric text-neutral-800">
                  {assessment.score < 1 ? 0 : Math.max(1, Math.round(assessment.score))}
                </span>
                <span className="text-caption text-neutral-400">/ 10</span>
                <span className={`text-label-sm font-semibold px-3 py-1 rounded-full ${SEVERITY_BADGE[assessment.severity]}`}>
                  {SEVERITY_LABELS[assessment.severity]}
                </span>
              </div>
              <p className="text-body-sm text-neutral-600">{assessment.summary}</p>

              {assessment.indicators.length > 0 && (
                <div className="flex flex-wrap gap-1 justify-center mt-3">
                  {assessment.indicators.map((i) => (
                    <span key={i} className="pill bg-neutral-100 text-neutral-700 text-caption">{i}</span>
                  ))}
                </div>
              )}
            </div>

            {assessment.escalate && (
              <div className="card rounded-xl p-4 bg-status-warning-bg border border-status-warning/40">
                <p className="text-body-md font-semibold text-neutral-800 mb-1">
                  Consider seeing a dermatologist
                </p>
                <p className="text-body-sm text-neutral-600">{assessment.escalationReason}</p>
              </div>
            )}

            <div className="card rounded-xl p-4">
              <h3 className="text-h3 text-neutral-800 mb-2">Ways to care for your skin today</h3>
              <ul className="space-y-2">
                {assessment.selfCare.map((tip) => (
                  <li key={tip} className="flex gap-2 text-body-sm text-neutral-600">
                    <span aria-hidden="true" className="text-primary-sage">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-caption text-neutral-500 text-center">{SKIN_DISCLAIMER}</p>

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Close
              </button>
              <button type="button" onClick={handleLog} disabled={saving} className="btn-primary flex-1">
                {saving ? "Saving…" : "Log it"}
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "result" && !assessment && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-body-md text-white/70 mb-4">{message}</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => setStep("prompt")} className="btn-secondary bg-white/20 text-white hover:bg-white/30 border-white/30">
              Choose again
            </button>
            <button type="button" onClick={onClose} className="btn-ghost text-white/60 hover:text-white">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
