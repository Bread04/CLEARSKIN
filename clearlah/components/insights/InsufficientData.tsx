"use client";

import ProgressRing from "@/components/ui/ProgressRing";

interface InsufficientDataProps {
  entriesNeeded: number;
  logCount: number;
}

export default function InsufficientData({
  entriesNeeded,
  logCount,
}: InsufficientDataProps) {
  return (
    <div className="card rounded-xl p-8 text-center">
      <div className="flex justify-center mb-4">
        <ProgressRing progress={logCount / 7} size={64} stroke={4}>
          {logCount}
        </ProgressRing>
      </div>
      <h2 className="text-h3 text-neutral-800 mb-2">
        {entriesNeeded} more day{entriesNeeded === 1 ? "" : "s"} to unlock
      </h2>
      <p className="text-body-md text-neutral-500 mb-4">
        Each day of logging brings you closer to understanding your triggers.
      </p>
      <a
        href="/log"
        className="btn-primary inline-block text-body-md py-3 px-6 rounded-full"
      >
        Start logging
      </a>
    </div>
  );
}
