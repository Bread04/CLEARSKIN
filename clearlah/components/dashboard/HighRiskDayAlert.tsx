"use client";

interface HighRiskDayAlertProps {
  triggerSummary: string;
  onDismiss: () => void;
}

export default function HighRiskDayAlert({
  triggerSummary,
  onDismiss,
}: HighRiskDayAlertProps) {
  return (
    <div
      onClick={onDismiss}
      role="alert"
      aria-live="assertive"
      className="rounded-lg p-4 bg-secondary-light border-l-4 border-secondary cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="w-5 h-5 text-secondary flex-shrink-0 mt-0.5"
          aria-hidden="true"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <div>
          <p className="text-body-sm font-semibold text-neutral-800">
            High Risk Day — {triggerSummary}
          </p>
          <a
            href="/insights"
            className="text-body-sm text-secondary underline"
            onClick={(e) => e.stopPropagation()}
          >
            See why
          </a>
        </div>
      </div>
    </div>
  );
}
