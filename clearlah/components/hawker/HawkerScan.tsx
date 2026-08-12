"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface IdentifiedDish {
  dish_id: string;
  dish_name: string;
  confidence: number;
  allergens: string[];
  risk_score: number;
  risk_label: "high" | "moderate" | "safe";
  risk_reason: string;
}

interface HawkerScanProps {
  onLog: (dish: IdentifiedDish, photoDataUrl: string) => void;
  onClose: () => void;
}

export default function HawkerScan({ onLog, onClose }: HawkerScanProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<"prompt" | "active" | "captured" | "analyzing" | "result">("prompt");
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [dish, setDish] = useState<IdentifiedDish | null>(null);
  const [logging, setLogging] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("active");
    } catch {
      setError("Camera access denied. Try searching for a dish instead.");
    }
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const maxDim = 1024;
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (w > maxDim || h > maxDim) {
      const ratio = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    setCameraState("captured");
    stopCamera();
  }, [stopCamera]);

  const analyze = useCallback(async () => {
    if (!capturedImage) return;
    setCameraState("analyzing");
    setError(null);

    try {
      const res = await fetch("/api/ai/identify-dish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: capturedImage }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to identify dish");
      }

      const result = await res.json();
      setDish(result.dish);
      setCameraState("result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not identify the dish. Try searching instead.");
      setCameraState("captured");
    }
  }, [capturedImage]);

  const handleLog = useCallback(async () => {
    if (!dish || !capturedImage) return;
    setLogging(true);
    onLog(dish, capturedImage);
  }, [dish, capturedImage, onLog]);

  const retake = useCallback(() => {
    setCapturedImage(null);
    setDish(null);
    setError(null);
    startCamera();
  }, [startCamera]);

  if (cameraState === "prompt") {
    return (
      <div className="fixed inset-0 z-50 bg-neutral-900 flex flex-col items-center justify-center p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white min-h-[44px] min-w-[44px]"
          aria-label="Close scanner"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
        <div className="text-center text-white">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
          </div>
          <h2 className="text-h2 text-white mb-2">Scan Your Dish</h2>
          <p className="text-body-md text-white/60 mb-3">Point your camera at your food or the stall signboard to check if it&apos;s safe for you.</p>
          <p className="text-caption text-white/40 mb-8">Photos are never stored — only the dish match is saved.</p>
          <button type="button" onClick={startCamera} className="btn-primary bg-white text-neutral-900 hover:bg-neutral-100">
            Open Camera
          </button>
          <button type="button" onClick={onClose} className="btn-ghost mt-3 text-white/60 hover:text-white">
            Search instead
          </button>
        </div>
      </div>
    );
  }

  if (cameraState === "result" && dish) {
    const riskStyles: Record<string, string> = {
      high: "bg-secondary-terracotta-50 text-secondary-terracotta-dark",
      moderate: "bg-status-warning-bg text-status-warning",
      safe: "bg-primary-sage-50 text-primary-sage-dark",
    };

    return (
      <div className="fixed inset-0 z-50 bg-neutral-900 flex flex-col">
        <div className="relative flex-1 flex items-center justify-center p-4">
          <img
            src={capturedImage!}
            alt="Captured dish"
            className="max-w-full max-h-full object-contain rounded-xl"
          />
          <div className="absolute bottom-4 left-4 right-4 card rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-h3 text-neutral-800">{dish.dish_name}</h3>
                <p className="text-body-sm text-neutral-500">
                  {dish.confidence}% match
                </p>
              </div>
              <span className={`text-label-sm font-semibold px-3 py-1 rounded-full capitalize ${riskStyles[dish.risk_label] || ""}`}>
                {dish.risk_label === "high" ? "High Risk" : dish.risk_label === "moderate" ? "Moderate" : "Safe"}
              </span>
            </div>
            <p className="text-body-sm text-neutral-600">{dish.risk_reason}</p>
            {dish.allergens.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {dish.allergens.map((a) => (
                  <span key={a} className="pill bg-neutral-100 text-neutral-700 text-caption">{a}</span>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={handleLog} disabled={logging}
                className="btn-primary flex-1">
                {logging ? "Saving..." : "Log it"}
              </button>
              <button type="button" onClick={retake}
                className="btn-secondary flex-1">
                Retake
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <button
        type="button"
        onClick={() => { stopCamera(); onClose(); }}
        className="absolute top-4 right-4 z-10 text-white/80 hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Close scanner"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="flex-1 w-full object-cover"
      />

      <canvas ref={canvasRef} className="hidden" />

      {error && (
        <div className="absolute top-16 left-4 right-4 bg-secondary-terracotta text-white text-body-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-4">
        {cameraState === "active" && (
          <button
            type="button"
            onClick={capture}
            className="w-18 h-18 rounded-full border-4 border-white bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center"
            aria-label="Capture photo"
          >
            <div className="w-14 h-14 rounded-full bg-white" />
          </button>
        )}

        {cameraState === "captured" && (
          <div className="flex gap-3">
            <button type="button" onClick={retake} className="btn-secondary bg-white/20 text-white hover:bg-white/30 border-white/30">
              Retake
            </button>
            <button type="button" onClick={analyze} className="btn-primary bg-white text-neutral-900 hover:bg-neutral-100">
              Identify Dish
            </button>
          </div>
        )}

        {cameraState === "analyzing" && (
          <div className="card rounded-xl px-6 py-4 bg-white text-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary-sage border-t-transparent rounded-full animate-spin" />
              <span className="text-body-md">AI detective thinking...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
