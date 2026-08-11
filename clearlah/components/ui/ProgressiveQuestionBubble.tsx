"use client";

interface ProgressiveQuestionBubbleProps {
  question: string;
  onSkip: () => void;
  isVisible: boolean;
}

export default function ProgressiveQuestionBubble({
  question,
  onSkip,
  isVisible,
}: ProgressiveQuestionBubbleProps) {
  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="motion-safe:animate-fade-in-up bubble-ai flex flex-col gap-3"
    >
      <p className="text-body-md leading-relaxed">{question}</p>

      <button
        type="button"
        onClick={onSkip}
        aria-label="Skip for now"
        className="btn-ghost text-body-sm min-h-[44px] min-w-[44px] px-4 py-2 rounded-full self-start"
      >
        Skip for now
      </button>
    </div>
  );
}
