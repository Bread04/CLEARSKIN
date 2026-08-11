"use client";

import { useState, useEffect } from "react";
import InsightCard from "@/components/insights/InsightCard";
import InsufficientData from "@/components/insights/InsufficientData";
import type { CorrelationResult, Pillar } from "@/lib/pattern-engine";

interface CorrelationsResponse {
  status: string;
  entries_needed?: number;
  correlations?: CorrelationResult[];
  lastUpdated?: string;
}

export default function InsightsPage() {
  const [data, setData] = useState<CorrelationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [narrations, setNarrations] = useState<string[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/insights/correlate");
      const json = await res.json();
      setData(json);

      if (json.status === "ok" && json.correlations?.length) {
        const narrRes = await fetch("/api/ai/narrate-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ correlations: json.correlations }),
        });
        const narrData = await narrRes.json();
        setNarrations(narrData.narrations ?? []);
      }
    } catch {
      // keep previous data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 py-10">
        <div className="max-w-md mx-auto space-y-6">
          <h1 className="text-h2 text-neutral-900">Insights</h1>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-32 rounded-md" />
          ))}
        </div>
      </main>
    );
  }

  if (data?.status === "insufficient_data") {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 py-10">
        <div className="max-w-md mx-auto space-y-8">
          <h1 className="text-h2 text-neutral-900">Insights</h1>
          <InsufficientData
            entriesNeeded={data.entries_needed ?? 7}
            logCount={7 - (data.entries_needed ?? 7)}
          />
        </div>
      </main>
    );
  }

  const correlations = data?.correlations ?? [];

  if (correlations.length === 0) {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 py-10">
        <div className="max-w-md mx-auto space-y-8">
          <h1 className="text-h2 text-neutral-900">Insights</h1>
          <div className="card rounded-xl p-8 text-center">
            <h2 className="text-h3 text-neutral-800 mb-2">No patterns yet</h2>
            <p className="text-body-md text-neutral-500">
              Not enough patterns yet — keep logging and I&apos;ll keep looking, lah.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10">
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-h2 text-neutral-900">Insights</h1>

        {correlations.map((c, i) => (
          <InsightCard
            key={c.trigger}
            trigger={c.trigger}
            pillar={c.pillar as Pillar}
            confidence={c.confidence}
            narration={narrations[i] ?? `${c.trigger} — ${c.confidence}% confidence`}
            affectedDays={c.affected_days}
            index={i}
          />
        ))}

        <div className="text-center pt-4">
          <a
            href="/insights/report"
            className="btn-secondary inline-block text-body-md py-3 px-6 rounded-full"
          >
            Generate Doctor Report
          </a>
        </div>
      </div>
    </main>
  );
}
