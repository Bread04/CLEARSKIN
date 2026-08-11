"use client";

import { useState, useEffect, useCallback } from "react";
import StreakBadge from "@/components/ui/StreakBadge";
import WeatherWidget from "@/components/dashboard/WeatherWidget";
import BuildingPicture from "@/components/dashboard/BuildingPicture";
import HighRiskDayAlert from "@/components/dashboard/HighRiskDayAlert";
import MilestoneModal from "@/components/ui/MilestoneModal";

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
      </div>
    </main>
  );
}
