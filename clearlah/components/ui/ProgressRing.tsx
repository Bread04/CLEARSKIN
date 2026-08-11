interface ProgressRingProps {
  progress: number;
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}

export default function ProgressRing({
  progress,
  size = 48,
  stroke = 4,
  children,
}: ProgressRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - progress * circumference;

  return (
    <div className="inline-flex items-center justify-center relative" aria-label={`Progress: ${Math.round(progress * 100)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-neutral-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary-sage transition-all duration-300"
        />
      </svg>
      {children && (
        <span className="absolute text-body-sm font-bold text-neutral-800">
          {children}
        </span>
      )}
    </div>
  );
}
