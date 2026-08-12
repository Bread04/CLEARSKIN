---
baseline_commit: 53b9747ad9adaf8fa4854f0c764a3824440dbb21
---

# Story 9.4: FlarePrint — Location Trigger Map

Status: review

## Story

As a user who has logged flares across multiple locations,
I want to see my flares mapped across Singapore and understand how my trigger patterns compare to the community,
so that I can identify location-specific triggers and contribute to Singapore's first eczema trigger map.

## Acceptance Criteria

1. Every log entry with symptoms GPS-tagged at time of logging
2. Personal heatmap renders on interactive Singapore map (Leaflet/MapLibre)
3. Heatmap colour intensity = flare severity at that location
4. Tap a hotspot: "3 flares here. Common factors: Geylang Serai, evening, humidity >85%"
5. Opt-in anonymised aggregation: user's flare data contributes to community map
6. Community layer: "Your flare pattern matches 47 other users in this area"
7. "Export my FlarePrint" generates shareable PDF with personal + community overlay
8. All location data stored locally by default; community sharing requires explicit opt-in
9. Privacy-preserving: GPS coordinates fuzzed by 200m before community aggregation

## Tasks / Subtasks

- [ ] Task 1: GPS-tag log entries (AC: 1)
  - [ ] 1.1 Add `location` field to `log_entries` jsonb: `{ lat, lng, accuracy }`
  - [ ] 1.2 On log save, capture `navigator.geolocation.getCurrentPosition()`
  - [ ] 1.3 Add location to `POST /api/logs` body; persist in Supabase
  - [ ] 1.4 Add `location_enabled` toggle to user settings (default: off)
  - [ ] 1.5 Handle geolocation denied gracefully: logs save without location

- [ ] Task 2: Personal FlarePrint heatmap (AC: 2, 3, 4)
  - [ ] 2.1 Create `app/flareprint/page.tsx` with interactive map component
  - [ ] 2.2 Integrate Leaflet + OpenStreetMap tiles (free, no API key)
  - [ ] 2.3 Create `app/api/flareprint/personal/route.ts` — GET with userId, returns `{ flares: { lat, lng, severity, date, factors }[] }`
  - [ ] 2.4 Render heatmap layer using Leaflet.heat plugin: colour = severity (green → amber → terracotta)
  - [ ] 2.5 Tap hotspot: show popup with flare count + common factors from that location
  - [ ] 2.6 Date range filter: "Last 7 days / 14 days / 30 days / All time"
  - [ ] 2.7 Empty state: "Log flares with location enabled to build your FlarePrint"

- [ ] Task 3: Community layer (AC: 5, 6)
  - [ ] 3.1 Add `community_flares` table: grid_cell_id, flare_count, common_triggers[], last_updated
  - [ ] 3.2 Create `app/api/flareprint/community/route.ts` — GET returns aggregated grid data
  - [ ] 3.3 Opt-in flow: "Share my FlarePrint" toggle in `/flareprint/settings`
  - [ ] 3.4 On opt-in: user's fuzzed flare data contributed to community grid on next log
  - [ ] 3.5 Render community heatmap as toggleable overlay on personal map
  - [ ] 3.6 "Your pattern matches N others" callout when personal hotspot overlaps community hotspot

- [ ] Task 4: PDF export (AC: 7)
  - [ ] 4.1 "Export FlarePrint" button captures map view + stats
  - [ ] 4.2 Generate static map image via Leaflet + canvas
  - [ ] 4.3 Include: personal heatmap image, top 3 flare locations, community comparison if opted in
  - [ ] 4.4 Print CSS: A4 layout, medical disclaimer, date stamp
  - [ ] 4.5 Follows existing Doctor Report export pattern (`window.print()` + `@media print`)

- [ ] Task 5: Privacy & fuzzing (AC: 8, 9)
  - [ ] 5.1 All location data stored in Supabase only if `location_enabled` is true
  - [ ] 5.2 Community sharing requires separate explicit opt-in toggle (not bundled with location)
  - [ ] 5.3 GPS coordinates fuzzed: add random offset of ±200m before community aggregation
  - [ ] 5.4 Grid cell resolution: 500m² minimum — no individual pinpoint possible
  - [ ] 5.5 "Delete my location data" button removes all user's GPS data from Supabase
  - [ ] 5.6 Privacy policy section added explaining location data handling

## Dev Notes

- **Architecture compliance (AD-2):** No AI calls needed — pure data aggregation and rendering
- **Architecture compliance (AD-3):** Location data stored in `log_entries` jsonb + new `community_flares` table for aggregation
- **Leaflet:** Free, open-source, no API key. Use `react-leaflet` for React integration
- **Heatmap:** `leaflet-heat` plugin renders intensity heatmap from lat/lng/severity tuples
- **Supabase migration:** Add `location jsonb` column to `log_entries`; create `community_flares` table
- **Privacy first:** Location disabled by default. Community sharing requires second opt-in. Fuzzing at 200m. No raw GPS stored in community table.
- **Design tokens:** Heatmap colours: green (`primary-sage`) = mild, amber (`risk-medium`) = moderate, terracotta (`secondary`) = severe
- **Dashboard integration:** Add FlarePrint tab to BottomNavigationBar

### Project Structure Notes

```
app/flareprint/
  page.tsx                  ← NEW: FlarePrint map page
  settings/page.tsx         ← NEW: Privacy & sharing settings
app/api/flareprint/
  personal/route.ts         ← NEW: Personal flare data endpoint
  community/route.ts        ← NEW: Community aggregation endpoint
components/flareprint/
  FlarePrintMap.tsx         ← NEW: Leaflet map with heatmap layers
  FlarePrintExport.tsx      ← NEW: Export controls
  FlarePrintPopup.tsx       ← NEW: Hotspot popup content
components/ui/
  BottomNavigationBar.tsx   ← UPDATE: Add FlarePrint tab
supabase/migrations/
  XXXX_add_location.sql     ← NEW: Add location column + community_flares table
```

### References

- [Source: epics.md#E9-S4]
- [Source: ClearLah-Architecture-Spine.md#AD-3] — Supabase as system of record
- [Source: ClearLah-Architecture-Spine.md#AD-6] — Deployment (Vercel)
- [Source: ClearLah-PRD.md#13.4] — FlarePrint feature spec
- [Source: DESIGN.md] — Color tokens for heatmap

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List
