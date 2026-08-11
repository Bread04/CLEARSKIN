"use client";

import { useState, useCallback } from "react";

interface LocationPermissionBubbleProps {
  onDismiss: () => void;
}

interface LocationCoords {
  latitude: number;
  longitude: number;
  timestamp: number;
}

export default function LocationPermissionBubble({
  onDismiss,
}: LocationPermissionBubbleProps) {
  const [loading, setLoading] = useState(false);

  const handleAllow = useCallback(() => {
    setLoading(true);

    if (!navigator.geolocation) {
      localStorage.setItem("clearlah_location_permission_asked", "true");
      onDismiss();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: LocationCoords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
        };
        sessionStorage.setItem("clearlah_location", JSON.stringify(coords));
        localStorage.setItem("clearlah_location_permission_asked", "true");
        setLoading(false);
        onDismiss();
      },
      () => {
        localStorage.setItem("clearlah_location_permission_asked", "true");
        setLoading(false);
        onDismiss();
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 }
    );
  }, [onDismiss]);

  const handleSkip = useCallback(() => {
    localStorage.setItem("clearlah_location_permission_asked", "true");
    onDismiss();
  }, [onDismiss]);

  return (
    <div
      role="status"
      className="motion-safe:animate-fade-in-up bubble-ai flex flex-col gap-3"
    >
      <p className="text-body-md leading-relaxed">
        To show your local weather automatically, can I access your location?
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAllow}
          disabled={loading}
          aria-label="Allow location access"
          className="btn-primary text-body-sm min-h-[44px] min-w-[44px] px-4 py-2 rounded-full"
        >
          {loading ? "Locating…" : "Allow"}
        </button>

        <button
          type="button"
          onClick={handleSkip}
          disabled={loading}
          aria-label="Skip location"
          className="btn-ghost text-body-sm min-h-[44px] min-w-[44px] px-4 py-2 rounded-full"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
