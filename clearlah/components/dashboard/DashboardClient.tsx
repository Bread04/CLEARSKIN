"use client";

import { useState, useEffect, useCallback } from "react";
import StreakBadge from "@/components/ui/StreakBadge";
import WeatherWidget from "@/components/dashboard/WeatherWidget";
import BuildingPicture from "@/components/dashboard/BuildingPicture";
import HighRiskDayAlert from "@/components/dashboard/HighRiskDayAlert";
import AskClearLah from "@/components/dashboard/AskClearLah";
import MilestoneModal from "@/components/ui/MilestoneModal";
import { getDemoDayOffset, advanceDemoDay } from "@/lib/utils/demo";

interface DashboardClientProps {
  streak: number;
  logCount: number;
  singlishUnlocked: boolean;
  highRiskActive: boolean;
  triggerSummary: string;
}

const MILESTONES = [3, 7, 14, 21, 30];

export default function DashboardClient({
  streak,
  logCount,
  singlishUnlocked,
  highRiskActive,
  triggerSummary,
}: DashboardClientProps) {
  const dismissedToday = typeof window !== "undefined" && localStorage.getItem("highRiskDismissedDate") === new Date().toISOString().split("T")[0];
  const [milestone, setMilestone] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(dismissedToday);

  const checkMilestone = useCallback(() => {
    if (MILESTONES.includes(streak)) {
      const shown = localStorage.getItem("clearlah_shown_milestones");
      const shownList = shown ? JSON.parse(shown) : [];
      if (!shownList.includes(streak)) {
        setMilestone(streak);
      }
    }
  }, [streak]);

  useEffect(() => {
    checkMilestone();
  }, [checkMilestone]);

  const dismissHighRisk = () => {
    const today = new Date().toISOString().split("T")[0];
    try { localStorage.setItem("highRiskDismissedDate", today); } catch {}
    setDismissed(true);
  };

  const dismissMilestone = () => {
    if (milestone !== null) {
      const shown = localStorage.getItem("clearlah_shown_milestones");
      const shownList = shown ? JSON.parse(shown) : [];
      shownList.push(milestone);
      localStorage.setItem("clearlah_shown_milestones", JSON.stringify(shownList));
      setMilestone(null);
    }
  };

  const handleSkipDay = () => {
    advanceDemoDay();
    window.location.reload();
  };

  const [demoOffset, setDemoOffset] = useState(0);
  const [demoToday, setDemoToday] = useState<string | null>(null);

  useEffect(() => {
    const offset = getDemoDayOffset();
    setDemoOffset(offset);
    if (offset > 0) {
      const d = new Date();
      d.setDate(d.getDate() + offset);
      setDemoToday(d.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" }));
    }
  }, []);

  if (logCount === 0) {
    return (
      <main className="min-h-screen bg-neutral-50 px-6 py-10">
        <div className="max-w-md mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-h2 text-neutral-900">ClearLah</h1>
            <StreakBadge streak={streak} />
          </div>
          <div className="card rounded-xl p-6 text-center">
            <h2 className="text-h3 text-neutral-800 mb-2">Welcome</h2>
            <p className="text-body-md text-neutral-500 mb-4">
              Your trigger map starts here. Log Day 1 to begin.
            </p>
            <a href="/log" className="btn-primary inline-block text-body-md py-3 px-6 rounded-full">
              Start your first log
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-50 px-6 py-10">
      {milestone !== null && (
        <MilestoneModal milestone={milestone} onDismiss={dismissMilestone} />
      )}

      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-h2 text-neutral-900">ClearLah</h1>
          <StreakBadge streak={streak} aria-live="polite" />
        </div>

        (
          <div className="flex items-center justify-between bg-accent-yellow/5 border border-accent-yellow/20 rounded-lg px-4 py-2">
          <span className="text-body-sm text-neutral-600">
            {demoToday ? (
              <>Day: <span className="font-semibold text-neutral-800">{demoToday}</span>
                <span className="text-caption-sm text-neutral-400 ml-1">(+{demoOffset}d)</span></>
            ) : (
              <>Today: <span className="font-semibold text-neutral-800">{new Date().toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short" })}</span></>
            )}
          </span>
          <button
            type="button"
            onClick={handleSkipDay}
            className="btn-ghost text-body-sm text-primary-sage font-medium rounded-full px-3 py-1 flex items-center gap-1"
          >
            Next Day
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>

        {highRiskActive && !dismissed && (
          <HighRiskDayAlert
            triggerSummary={triggerSummary}
            onDismiss={dismissHighRisk}
          />
        )}

        <WeatherWidget />

        <BuildingPicture
          logCount={logCount}
          singlishUnlocked={singlishUnlocked}
        />

        <div className="card rounded-xl p-6">
          <h2 className="text-h3 text-neutral-800 mb-2">Today&apos;s Log</h2>
          <p className="text-body-md text-neutral-500 mb-3">
            {logCount} day{logCount === 1 ? "" : "s"} logged. Keep it up!
          </p>
          <a href="/log" className="btn-primary inline-block text-body-md py-2 px-5 rounded-full">
            Log today
          </a>
        </div>

        <AskClearLah />
      </div>
    </main>
  );
}
