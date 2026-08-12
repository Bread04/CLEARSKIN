"use client";

import Script from "next/script";
import FlarePrintMap from "@/components/flareprint/FlarePrintMap";

export default function FlarePrintClient() {
  return (
    <div className="p-4 space-y-4">
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        strategy="beforeInteractive"
      />
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-full bg-secondary-terracotta-50 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-secondary-terracotta-dark"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
        </div>
        <div>
          <h2 className="text-h2 text-neutral-800">Your Flare Map</h2>
          <p className="text-body-sm text-neutral-500">Where your symptoms flare up across Singapore</p>
        </div>
      </div>

      <FlarePrintMap />

      <div className="card rounded-xl p-4">
        <h3 className="text-h3 text-neutral-800 mb-2">Privacy</h3>
        <p className="text-body-sm text-neutral-600 mb-3">
          Your location data stays on your device by default. Community sharing requires a separate opt-in.
          All shared coordinates are fuzzed by 200m and grouped into 500m&sup2; grid cells — your exact location is never revealed.
        </p>
        <a href="/flareprint/settings" className="text-body-sm text-primary-sage font-semibold hover:underline">
          Manage privacy settings →
        </a>
      </div>
    </div>
  );
}
