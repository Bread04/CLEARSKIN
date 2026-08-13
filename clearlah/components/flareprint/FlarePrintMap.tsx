"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface Flare {
  lat: number;
  lng: number;
  severity: number;
  date: string;
  factors: string[];
}

interface CommunityCell {
  grid_cell_id: string;
  lat: number;
  lng: number;
  flare_count: number;
  common_triggers: string[];
}

export default function FlarePrintMap() {
  const [flares, setFlares] = useState<Flare[]>([]);
  const [communityCells, setCommunityCells] = useState<CommunityCell[]>([]);
  const [showCommunity, setShowCommunity] = useState(false);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const flareLayerRef = useRef<any>(null);
  const communityLayerRef = useRef<any>(null);

  useEffect(() => {
    fetch(`/api/flareprint/personal?days=${days}`)
      .then((r) => (r.ok ? r.json() : { flares: [] }))
      .then((d) => setFlares(d.flares || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/flareprint/community")
      .then((r) => (r.ok ? r.json() : { cells: [] }))
      .then((d) => setCommunityCells(d.cells || []))
      .catch(() => {});
  }, [days]);

  // Initialize the Leaflet map once after the container mounts and data loads.
  useEffect(() => {
    if (loading || flares.length === 0) return;
    if (mapRef.current) return;

    const L = (window as unknown as { L?: Record<string, any> }).L;
    if (!L || !containerRef.current) return;

    const el = containerRef.current;
    if (el.hasAttribute("data-leaflet-initialized")) return;

    const map = L.map(el, { center: [1.3521, 103.8198], zoom: 12 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    el.setAttribute("data-leaflet-initialized", "true");
    mapRef.current = map;
  }, [loading, flares.length]);

  // Draw personal flare markers.
  useEffect(() => {
    const L = (window as unknown as { L?: Record<string, any> }).L;
    const map = mapRef.current;
    if (!L || !map) return;

    if (flareLayerRef.current) {
      flareLayerRef.current.remove();
      flareLayerRef.current = null;
    }

    if (flares.length === 0) return;

    const group = L.layerGroup();
    for (const f of flares) {
      const color = f.severity >= 7 ? "#C0583A" : f.severity >= 4 ? "#E8A020" : "#5B7F6E";
      L.circleMarker([f.lat, f.lng], {
        radius: f.severity * 1.5,
        fillColor: color,
        color: color,
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.5,
      })
        .addTo(group)
        .bindPopup(`<b>${f.date}</b><br/>Severity: ${f.severity}/10<br/>${f.factors.join(", ")}`);
    }
    group.addTo(map);
    flareLayerRef.current = group;
  }, [flares]);

  // Draw community cells when toggled on.
  useEffect(() => {
    const L = (window as unknown as { L?: Record<string, any> }).L;
    const map = mapRef.current;
    if (!L || !map) return;

    if (communityLayerRef.current) {
      communityLayerRef.current.remove();
      communityLayerRef.current = null;
    }

    if (!showCommunity || communityCells.length === 0) return;

    const group = L.layerGroup();
    for (const cell of communityCells) {
      L.circleMarker([cell.lat, cell.lng], {
        radius: Math.min(20, 4 + cell.flare_count / 2),
        fillColor: "#C0583A",
        color: "#C0583A",
        weight: 1,
        opacity: 0.35,
        fillOpacity: 0.25,
      })
        .addTo(group)
        .bindPopup(
          `<b>${cell.common_triggers.slice(0, 2).join(", ") || "Various triggers"}</b><br/>${cell.flare_count} reported flares`,
        );
    }
    group.addTo(map);
    communityLayerRef.current = group;
  }, [showCommunity, communityCells]);

  if (loading) {
    return (
      <div className="card rounded-xl p-6">
        <div className="skeleton h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {[7, 14, 30, 60].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d)}
            className={`text-body-sm px-3 py-1 rounded-full min-h-[36px] transition-colors ${
              days === d ? "bg-primary-sage text-white" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {d}d
          </button>
        ))}
        {communityCells.length > 0 && (
          <button
            type="button"
            onClick={() => setShowCommunity(!showCommunity)}
            className={`text-body-sm px-3 py-1 rounded-full min-h-[36px] transition-colors ml-auto ${
              showCommunity ? "bg-secondary-terracotta-50 text-secondary-terracotta-dark" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {showCommunity ? "Community on" : "Show community"}
          </button>
        )}
      </div>

      <div className="card rounded-xl overflow-hidden relative">
        {flares.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary-sage-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-6 h-6 text-primary-sage"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
            </div>
            <p className="text-body-md text-neutral-800 mb-1">No flares mapped yet</p>
            <p className="text-body-sm text-neutral-500">
              Enable location when logging to build your personal flare map.
            </p>
          </div>
        ) : (
          <div ref={containerRef} className="h-80 w-full" />
        )}
      </div>

      {showCommunity && communityCells.length > 0 && (
        <div className="card rounded-xl p-4">
          <h3 className="text-h3 text-neutral-800 mb-2">Community Layer</h3>
          <p className="text-body-sm text-neutral-500 mb-3">
            Anonymised flare data from ClearLah users who opted in. Grid cells of 500m&sup2;. Coordinates fuzzed by 200m.
          </p>
          <div className="space-y-2">
            {communityCells.slice(0, 5).map((cell) => (
              <div key={cell.grid_cell_id} className="flex items-start justify-between py-2 border-b border-neutral-100 last:border-0">
                <div>
                  <p className="text-body-sm font-semibold text-neutral-800">
                    {cell.common_triggers.slice(0, 2).join(", ") || "Various triggers"}
                  </p>
                  <p className="text-caption text-neutral-500">{cell.flare_count} reported flares</p>
                </div>
                <span className="text-label-sm text-neutral-500">
                  [{cell.lat.toFixed(2)}, {cell.lng.toFixed(2)}]
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
