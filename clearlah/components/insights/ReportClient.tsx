"use client";

import PillarTag from "@/components/ui/PillarTag";

interface Trigger {
  trigger: string;
  confidence: number;
}

interface LogEntry {
  logged_at: string;
  food: { items: Array<{ name: string }> };
  lifestyle: { sleep_hours: number | null; stress_level: number | null };
  skincare: string | null;
  symptoms: { skin: number | null; gut: number | null; respiratory: number | null };
  weather_snapshot: { temp: number; humidity: number; psi: number } | null;
}

interface ReportClientProps {
  conditions: string[];
  topTriggers: Trigger[];
  entries: LogEntry[];
}

export default function ReportClient({ conditions, topTriggers, entries }: ReportClientProps) {
  return (
    <main className="min-h-screen bg-white px-6 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="no-print flex justify-between items-center">
          <h1 className="text-h2 text-neutral-900">Report</h1>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-secondary text-body-md py-2 px-5 rounded-full min-h-[44px] flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5" aria-hidden="true">
              <path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
            </svg>
            Save as PDF
          </button>
        </div>

        <p className="text-caption text-neutral-500 italic">
          Patient-reported data summary — not a medical diagnosis. Consult a qualified healthcare professional.
        </p>

        <section className="report-section">
          <h2 className="text-h2 text-neutral-900 mb-4">ClearLah Trigger Summary Report</h2>
          <p className="text-body-md text-neutral-600">
            Generated {new Date().toLocaleDateString("en-SG")} · Tracking for {conditions.join(", ") || "general health"}
          </p>
        </section>

        <section className="report-section">
          <h3 className="text-h3 text-neutral-800 mb-3">Top Suspected Triggers</h3>
          <div className="space-y-3">
            {topTriggers.map((t) => (
              <div key={t.trigger} className="flex items-center justify-between border-b border-neutral-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-body-md text-neutral-800">{t.trigger}</span>
                </div>
                <span className="text-body-md font-semibold text-neutral-800">{Math.round(t.confidence * 100)}% confidence</span>
              </div>
            ))}
            {topTriggers.length === 0 && (
              <p className="text-body-md text-neutral-500">No triggers identified yet. Keep logging to build your profile.</p>
            )}
          </div>
        </section>

        <section className="report-section">
          <h3 className="text-h3 text-neutral-800 mb-3">Symptom Trend (Last 14 Days)</h3>
          <div className="overflow-x-auto">
            <div className="flex items-end gap-1 h-32 min-w-max">
              {entries.map((e) => {
                const skin = e.symptoms.skin ?? 0;
                const gut = e.symptoms.gut ?? 0;
                const respiratory = e.symptoms.respiratory ?? 0;
                const maxH = 120;
                const skinH = (skin / 10) * maxH;
                const gutH = (gut / 10) * maxH;
                const respH = (respiratory / 10) * maxH;
                return (
                  <div key={e.logged_at} className="flex flex-col items-center gap-0.5" title={`${e.logged_at}: Skin ${skin}/10, Gut ${gut}/10, Respiratory ${respiratory}/10`}>
                    <div className="flex items-end gap-0.5">
                      <div className="w-5 bg-primary-sage rounded-t" style={{ height: `${Math.max(skinH, 4)}px` }} />
                      <div className="w-5 bg-secondary-terracotta rounded-t" style={{ height: `${Math.max(gutH, 4)}px` }} />
                      <div className="w-5 bg-primary-sky rounded-t" style={{ height: `${Math.max(respH, 4)}px` }} />
                    </div>
                    <span className="text-caption text-neutral-500 w-10 text-center">
                      {new Date(e.logged_at).getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-caption text-neutral-500 mt-2">Skin (sage) · Gut (terracotta) · Respiratory (sky) severity over time</p>
        </section>

        <section className="report-section">
          <h3 className="text-h3 text-neutral-800 mb-3">Log Timeline</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-neutral-300">
                  <th className="text-left py-2 pr-3">Date</th>
                  <th className="text-left py-2 pr-3">Food</th>
                  <th className="text-left py-2 pr-3">Sleep</th>
                  <th className="text-left py-2 pr-3">Stress</th>
                  <th className="text-left py-2 pr-3">Skin</th>
                  <th className="text-left py-2 pr-3">Gut</th>
                  <th className="text-left py-2 pr-3">Resp</th>
                  <th className="text-left py-2 pr-3">Weather</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.logged_at} className="border-b border-neutral-100">
                    <td className="py-2 pr-3">{new Date(e.logged_at).toLocaleDateString("en-SG", { day: "numeric", month: "short" })}</td>
                    <td className="py-2 pr-3">{e.food.items.map((i) => i.name).join(", ") || "—"}</td>
                    <td className="py-2 pr-3">{e.lifestyle.sleep_hours ? `${e.lifestyle.sleep_hours}h` : "—"}</td>
                    <td className="py-2 pr-3">{e.lifestyle.stress_level ? `${e.lifestyle.stress_level}/5` : "—"}</td>
                    <td className="py-2 pr-3">{e.symptoms.skin ? `${e.symptoms.skin}/10` : "—"}</td>
                    <td className="py-2 pr-3">{e.symptoms.gut ? `${e.symptoms.gut}/10` : "—"}</td>
                    <td className="py-2 pr-3">{e.symptoms.respiratory ? `${e.symptoms.respiratory}/10` : "—"}</td>
                    <td className="py-2 pr-3">{e.weather_snapshot ? `${e.weather_snapshot.temp}°C ${e.weather_snapshot.humidity}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-caption text-neutral-500 italic pt-4 border-t border-neutral-200">
          Patient-reported data summary — not a medical diagnosis. Consult a qualified healthcare professional.
        </p>
      </div>
    </main>
  );
}
