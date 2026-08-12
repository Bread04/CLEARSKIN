"use client";

import { useState } from "react";

export default function FlarePrintSettings() {
  const [locationEnabled, setLocationEnabled] = useState(() => {
    try { return localStorage.getItem("clearlah_location_enabled") === "true"; } catch { return false; }
  });
  const [communitySharing, setCommunitySharing] = useState(() => {
    try { return localStorage.getItem("clearlah_community_sharing") === "true"; } catch { return false; }
  });

  return (
    <div className="p-4 space-y-6">
      <div className="card rounded-xl p-4">
        <h3 className="text-h3 text-neutral-800 mb-1">Location Logging</h3>
        <p className="text-body-sm text-neutral-500 mb-3">
          When enabled, your flare entries include your GPS location to build your personal FlarePrint map.
        </p>
        <button
          type="button"
          onClick={() => {
            const next = !locationEnabled;
            setLocationEnabled(next);
            localStorage.setItem("clearlah_location_enabled", String(next));
          }}
          className={`text-body-sm px-4 py-2 rounded-full min-h-[44px] transition-colors ${
            locationEnabled ? "bg-primary-sage text-white" : "bg-neutral-100 text-neutral-600"
          }`}
        >
          {locationEnabled ? "Location: On" : "Location: Off"}
        </button>
      </div>

      <div className="card rounded-xl p-4">
        <h3 className="text-h3 text-neutral-800 mb-1">Community Sharing</h3>
        <p className="text-body-sm text-neutral-500 mb-3">
          Contribute anonymised, fuzzed data to Singapore&apos;s first community trigger map. Individual coordinates are never shared.
        </p>
        <button
          type="button"
          onClick={() => {
            const next = !communitySharing;
            setCommunitySharing(next);
            localStorage.setItem("clearlah_community_sharing", String(next));
          }}
          className={`text-body-sm px-4 py-2 rounded-full min-h-[44px] transition-colors ${
            communitySharing ? "bg-secondary-terracotta text-white" : "bg-neutral-100 text-neutral-600"
          }`}
        >
          {communitySharing ? "Community Sharing: On" : "Community Sharing: Off"}
        </button>
        {communitySharing && (
          <p className="text-caption text-neutral-400 mt-2">
            Coordinates are fuzzed by ±200m and grouped into 500m&sup2; grid cells.
          </p>
        )}
      </div>

      <div className="card rounded-xl p-4">
        <h3 className="text-h3 text-neutral-800 mb-1">Delete My Location Data</h3>
        <p className="text-body-sm text-neutral-500 mb-3">
          Remove all GPS data from your log entries. This is permanent.
        </p>
        <button
          type="button"
          onClick={async () => {
            try {
              await fetch("/api/logs", { method: "DELETE" });
              alert("Location data deleted from your records.");
            } catch {
              alert("Could not delete data. Try again.");
            }
          }}
          className="btn-danger text-body-sm"
        >
          Delete my location data
        </button>
      </div>
    </div>
  );
}
