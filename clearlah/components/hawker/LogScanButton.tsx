"use client";

import { useState, useCallback } from "react";
import HawkerScan from "@/components/hawker/HawkerScan";
import { getDemoDateForSave } from "@/lib/utils/demo";

interface IdentifiedDish {
  dish_id: string;
  dish_name: string;
  confidence: number;
  allergens: string[];
  risk_score: number;
  risk_label: "high" | "moderate" | "safe";
  risk_reason: string;
}

export default function LogScanButton() {
  const [scanning, setScanning] = useState(false);

  const handleLog = useCallback(async (dish: IdentifiedDish) => {
    try {
      const weatherRes = await fetch("/api/weather");
      if (!weatherRes.ok) throw new Error("Could not fetch weather data.");
      const weatherSnapshot = await weatherRes.json();

      const log = {
        food: {
          items: [dish.dish_name],
        },
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
        symptoms: { skin: null, gut: null, respiratory: null },
        summary: `Scanned ${dish.dish_name} (${dish.risk_label}).`,
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
    } catch {
      throw new Error("Could not save your log.");
    } finally {
      setScanning(false);
    }
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setScanning(true)}
        className="btn-secondary flex items-center gap-1.5 min-h-[44px]"
        aria-label="Scan dish with camera"
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
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <span className="hidden sm:inline text-body-sm">Scan dish</span>
      </button>

      {scanning && (
        <HawkerScan
          onClose={() => setScanning(false)}
          onLog={handleLog}
        />
      )}
    </>
  );
}
