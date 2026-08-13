"use client";

import { useEffect, useState } from "react";

export default function FlarePrintSettings() {
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [communitySharing, setCommunitySharing] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setLocationEnabled(!!d.profile.location_enabled);
          setCommunitySharing(!!d.profile.community_sharing);
        }
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const persist = async (key: "location_enabled" | "community_sharing", value: boolean) => {
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
    } catch {
      // non-critical — keep local state
    }
  };

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
            persist("location_enabled", next);
          }}
          disabled={!loaded}
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
            persist("community_sharing", next);
          }}
          disabled={!loaded}
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
              const res = await fetch("/api/logs", { method: "DELETE" });
              if (res.ok) {
                alert("Location data deleted from your records.");
              } else {
                alert("Could not delete data. Try again.");
              }
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
