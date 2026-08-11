"use client";

import { useState } from "react";
import ProgressRing from "@/components/ui/ProgressRing";

interface BuildingPictureProps {
  logCount: number;
  singlishUnlocked: boolean;
}

const STANDARD_MESSAGES = [
  "Building your picture — each day tells us more.",
  "A few more days and we'll start spotting patterns.",
  "Your health story is taking shape. Keep going.",
  "Every log entry is a piece of the puzzle.",
];
const SINGLISH_MESSAGE = "Eh, you doing pretty well leh. Keep going ah.";

export default function BuildingPicture({
  logCount,
  singlishUnlocked,
}: BuildingPictureProps) {
  const [messageIndex] = useState(() => Math.floor(Math.random() * STANDARD_MESSAGES.length));

  if (logCount === 0) {
    return (
      <div className="card rounded-xl p-6">
        <p className="text-body-md text-neutral-500 text-center">
          Log your first day to start building your health picture.
        </p>
      </div>
    );
  }

  if (logCount >= 7) {
    return null;
  }

  const daysRemaining = 7 - logCount;
  const message =
    singlishUnlocked && logCount >= 3
      ? SINGLISH_MESSAGE
      : STANDARD_MESSAGES[messageIndex];

  return (
    <div className="card rounded-xl p-6">
      <h3 className="text-h3 text-neutral-800 mb-4">Building Your Picture</h3>
      <div className="flex items-center gap-4">
        <ProgressRing progress={logCount / 7} size={48} stroke={4}>
          {logCount}
        </ProgressRing>
        <div>
          <p className="text-body-md text-neutral-700">{message}</p>
          <p className="text-body-sm text-neutral-500 mt-1">
            {daysRemaining} more day{daysRemaining === 1 ? "" : "s"} to unlock your first insight
          </p>
        </div>
      </div>
    </div>
  );
}
