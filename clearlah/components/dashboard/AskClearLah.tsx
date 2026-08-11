"use client";

import { useState, useRef, useCallback } from "react";

const SUGGESTIONS = [
  "Can I eat laksa today?",
  "What triggered my last flare?",
  "Is today a high-risk day for me?",
  "Which hawker dishes should I avoid?",
] as const;

export default function AskClearLah() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAsk = useCallback(async (q: string) => {
    const text = q.trim();
    if (!text || isLoading) return;

    setIsLoading(true);
    setAnswer(null);
    setQuestion("");

    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });

      if (res.ok) {
        const data = await res.json();
        setAnswer(data.answer);
      } else {
        setAnswer("I couldn't process that — try again?");
      }
    } catch {
      setAnswer("Connection lost. Try again in a moment?");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleAsk(question);
      }
    },
    [question, handleAsk]
  );

  return (
    <div className="card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-5 h-5 text-primary-sage"
          aria-hidden="true"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
        </svg>
        <h2 className="text-h3 text-neutral-800">Ask ClearLah</h2>
        <span className="text-caption-sm bg-accent-yellow/10 text-accent-yellow px-2 py-0.5 rounded-full ml-auto font-medium">
          AI Agent
        </span>
      </div>

      <p className="text-body-sm text-neutral-500">
        Ask me anything about your triggers, today&apos;s weather risks, or which hawker food is safe.
      </p>

      {answer && (
        <div className="bg-primary-sage-50 border border-primary-sage/20 rounded-lg p-4 motion-safe:animate-fade-in-up">
          <p className="text-body-md text-neutral-700 leading-relaxed">{answer}</p>
        </div>
      )}

      {isLoading && (
        <div className="bg-neutral-100 rounded-lg p-4 skeleton h-16 flex items-center justify-center">
          <span className="text-caption-sm text-neutral-400">AI detective thinking…</span>
        </div>
      )}

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='e.g. "Can I eat laksa today?"'
          disabled={isLoading}
          className="input flex-1"
          aria-label="Ask ClearLah a question"
        />
        <button
          type="button"
          onClick={() => handleAsk(question)}
          disabled={!question.trim() || isLoading}
          className="btn-primary rounded-full w-[44px] h-[44px] min-w-[44px] min-h-[44px] flex items-center justify-center p-0"
          aria-label="Send question"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
            aria-hidden="true"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleAsk(s)}
            disabled={isLoading}
            className="text-body-sm text-primary-sage bg-primary-sage-50 hover:bg-primary-sage-100 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
