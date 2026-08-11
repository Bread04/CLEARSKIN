"use client";

import { useState, useEffect, useCallback } from "react";

interface WeatherData {
  temp: number;
  humidity: number;
  psi: number;
  uv: number;
  source: string;
  simulated?: boolean;
}

function psiLabel(psi: number): string {
  if (psi <= 50) return "Good";
  if (psi <= 100) return "Moderate";
  if (psi <= 200) return "Unhealthy";
  return "Hazardous";
}

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/weather");
      const data = await res.json();
      setWeather(data);
    } catch {
      // keep previous data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  const handleTouchEnd = useCallback(() => {
    fetchWeather();
  }, []);

  if (loading && !weather) {
    return <div className="card rounded-xl p-4 skeleton h-24" />;
  }

  if (!weather) return null;

  return (
    <div
      className="card rounded-xl p-4"
      style={{ overscrollBehaviorY: "contain" }}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-h3 text-neutral-800">Weather</h3>
        {weather.simulated && (
          <span className="text-caption text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full">
            Simulated data
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-neutral-500" aria-hidden="true">
            <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
          </svg>
          <span className="text-body-sm text-neutral-700">{weather.temp}°C</span>
        </div>
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-neutral-500" aria-hidden="true">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
          <span className="text-body-sm text-neutral-700">{weather.humidity}%</span>
        </div>
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-neutral-500" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span className="text-body-sm text-neutral-700">PSI {weather.psi} · {psiLabel(weather.psi)}</span>
        </div>
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-neutral-500" aria-hidden="true">
            <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
          </svg>
          <span className="text-body-sm text-neutral-700">UV {weather.uv}</span>
        </div>
      </div>
    </div>
  );
}
