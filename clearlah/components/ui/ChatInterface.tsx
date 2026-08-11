"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { ParsedLog } from "@/lib/types/database";
import LocationPermissionBubble from "@/components/ui/LocationPermissionBubble";
import ProgressiveQuestionBubble from "@/components/ui/ProgressiveQuestionBubble";
import PreFillCard from "@/components/ui/PreFillCard";
import { isDemoMode } from "@/lib/utils/demo";

interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
  timestamp: number;
}

interface ChatInterfaceProps {
  trackingFor: string;
  conditions: string[];
  singlishUnlocked: boolean;
  logCount: number;
  onboardingStep: number;
  knownAllergens: string[];
  dailySkincare: string | null;
}

function getGreeting(props: ChatInterfaceProps): string {
  const hour = new Date().getHours();
  const timePrefix =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const formal = `${timePrefix}! Tell me how your day has been — what did you eat, how are you feeling?`;
  const casual = `${timePrefix}! How was today?`;
  const singlish = `${timePrefix}! Eh, how was today ah? Just lah tell me lah!`;

  if (props.singlishUnlocked && props.logCount >= 3) return singlish;
  if (props.logCount >= 3) return casual;
  return formal;
}

type QuestionMode = "none" | "allergens" | "skincare";

export default function ChatInterface(props: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [showLocationBubble, setShowLocationBubble] = useState(false);
  const [questionMode, setQuestionMode] = useState<QuestionMode>("none");
  const [questionSkipped, setQuestionSkipped] = useState(false);
  const [parsedLog, setParsedLog] = useState<ParsedLog | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      const greeting = getGreeting(props);
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "ai",
          content: greeting,
          timestamp: Date.now(),
        },
      ]);

      // Determine post-greeting bubbles
      if (!isDemoMode()) {
        if (props.logCount === 0) {
          const asked = localStorage.getItem("clearlah_location_permission_asked");
          if (asked !== "true") {
            setShowLocationBubble(true);
          }
        } else if (props.onboardingStep === 1) {
          setQuestionMode("allergens");
        } else if (props.onboardingStep === 2) {
          setQuestionMode("skincare");
        }
      }
    }
  }, [initialized, props]);

  useEffect(() => {
    const el = messagesEndRef.current;
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    const handleResize = () => {
      const viewport = window.visualViewport;
      if (viewport) {
        const keyboardHeight = window.innerHeight - viewport.height;
        document.documentElement.style.setProperty(
          "--keyboard-height",
          `${keyboardHeight}px`
        );
      }
    };

    window.visualViewport?.addEventListener("resize", handleResize);
    return () => {
      window.visualViewport?.removeEventListener("resize", handleResize);
    };
  }, []);

  // Retry pending log saves from previous session
  const retryPendingSave = useCallback(() => {
    const raw = sessionStorage.getItem("clearlah_pending_save");
    if (!raw) return;
    try {
      const pending = JSON.parse(raw);
      if (pending?.log && pending?.weather_snapshot) {
        fetch("/api/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ log: pending.log, weather_snapshot: pending.weather_snapshot }),
        })
          .then((res) => {
            if (res.ok) sessionStorage.removeItem("clearlah_pending_save");
          })
          .catch(() => {
            // will retry next mount or on online event
          });
      }
    } catch {
      sessionStorage.removeItem("clearlah_pending_save");
    }
  }, []);

  useEffect(() => { retryPendingSave(); }, [retryPendingSave]);

  useEffect(() => {
    const handleOnline = () => { retryPendingSave(); };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [retryPendingSave]);

  const handleLocationDismiss = useCallback(() => {
    setShowLocationBubble(false);
  }, []);

  const handleProgressiveSkip = useCallback(async () => {
    setQuestionMode("none");
    setQuestionSkipped(true);
    const newStep = props.onboardingStep + 1;
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboarding_step: newStep }),
      });
    } catch {
      // non-critical
    }
  }, [props.onboardingStep]);

  const handlePreFillConfirm = useCallback(async (logData: ParsedLog) => {
    setParsedLog(null);

    try {
      const weatherRes = await fetch("/api/weather");
      const weatherSnapshot = await weatherRes.json();

      const saveRes = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          log: logData,
          weather_snapshot: weatherSnapshot,
        }),
      });

      if (saveRes.ok) {
        const data = await saveRes.json();
        const streak = data.streak || 1;
        const today = new Date().toISOString().split("T")[0];
        try { localStorage.setItem("clearlah_last_log_date", today); } catch { /* non-critical */ }

        const confirmMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "ai",
          content: `\u2713 Log saved for today. <span class="inline-block motion-safe:animate-streak-pop">\uD83D\uDD25 ${streak} day streak!</span>`,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, confirmMessage]);
        setTimeout(() => { window.location.href = "/dashboard"; }, 1500);
      } else {
        sessionStorage.setItem(
          "clearlah_pending_save",
          JSON.stringify({ log: logData, weather_snapshot: weatherSnapshot, timestamp: Date.now() })
        );
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "ai",
          content: "Couldn't save \u2014 will retry when connected.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch {
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        content: "Couldn't save \u2014 check your connection and try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Progressive question mode: route to profile API
    if (questionMode !== "none") {
      const newStep = props.onboardingStep + 1;
      try {
        const payload: Record<string, unknown> = { onboarding_step: newStep };
        if (questionMode === "allergens") {
          const allergens = text
            .split(/[,;]/)
            .map((a) => a.trim())
            .filter((a) => a.length > 0);
          payload.known_allergens = allergens;
        } else if (questionMode === "skincare") {
          payload.daily_skincare = text;
        }

        await fetch("/api/profile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch {
        // non-critical — user can continue
      }

      const confirmMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "ai",
        content:
          questionMode === "allergens"
            ? "Got it — I'll keep an eye out for those allergens."
            : "Noted! I've saved your skincare routine.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, confirmMessage]);
      setQuestionMode("none");
      setIsLoading(false);
      return;
    }

    // Normal log flow — E3-S2 parse
    const skeletonId = crypto.randomUUID();
    const skeletonMessage: ChatMessage = {
      id: skeletonId,
      role: "ai",
      content: "",
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, skeletonMessage]);

    try {
      const res = await fetch("/api/ai/parse-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          userProfile: {
            conditions: props.conditions,
            known_allergens: props.knownAllergens,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.parsed) {
          setParsedLog(data.parsed);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === skeletonId
                ? {
                    ...m,
                    content: `Got it — ${data.parsed.summary || "I've noted what you shared."}`,
                  }
                : m
            )
          );
        }
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === skeletonId
              ? {
                  ...m,
                  content:
                    "I had a bit of trouble understanding that — could you try rephrasing?",
                }
              : m
          )
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === skeletonId
            ? {
                ...m,
                content: "Something went wrong — try again in a sec?",
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, props.conditions, props.knownAllergens, questionMode, props.onboardingStep]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const getDay2Question = () =>
    "By the way — do you have any known food allergies or sensitivities? Helps me watch for patterns.";

  const getDay3Question = () =>
    "Quick one — any skincare products you use daily? Moisturisers, creams, sunscreens…";

  const getPlaceholder = () => {
    if (questionMode === "allergens") return "e.g. shellfish, peanuts, dairy";
    if (questionMode === "skincare") return "e.g. Cetaphil cleanser, CeraVe moisturiser";
    return "Describe your day...";
  };

  return (
    <div className="flex-1 flex flex-col">
      <div
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        style={{ paddingBottom: "calc(var(--keyboard-height, 0px) + 80px)" }}
      >
        {messages.map((msg) =>
          msg.role === "ai" ? (
            msg.content ? (
              <div
                key={msg.id}
                className="bubble-ai motion-safe:animate-fade-in-up"
              >
                {msg.content}
              </div>
            ) : (
              <div key={msg.id} className="bubble-ai skeleton h-20 w-3/4 flex items-center justify-center">
                <span className="text-caption-sm text-neutral-400">AI analysing…</span>
              </div>
            )
          ) : (
            <div key={msg.id} className="flex justify-end">
              <div className="bubble-user">{msg.content}</div>
            </div>
          )
        )}

        {showLocationBubble && !questionSkipped && (
          <LocationPermissionBubble onDismiss={handleLocationDismiss} />
        )}

        {questionMode === "allergens" && !questionSkipped && (
          <ProgressiveQuestionBubble
            question={getDay2Question()}
            onSkip={handleProgressiveSkip}
            isVisible={true}
          />
        )}

        {questionMode === "skincare" && !questionSkipped && (
          <ProgressiveQuestionBubble
            question={getDay3Question()}
            onSkip={handleProgressiveSkip}
            isVisible={true}
          />
        )}

        {parsedLog && (
          <PreFillCard
            parsedLog={parsedLog}
            conditions={props.conditions}
            onConfirm={handlePreFillConfirm}
          />
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-neutral-200 bg-white px-4 py-3 pb-safe">
        <div className="flex items-end gap-2 max-w-lg mx-auto">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholder()}
            disabled={isLoading}
            rows={1}
            className="input flex-1 resize-none min-h-[44px] max-h-32"
            aria-label={
              questionMode !== "none" ? "Answer the question" : "Describe your day"
            }
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!inputValue.trim() || isLoading}
            aria-label="Send message"
            className="btn-primary rounded-full w-[44px] h-[44px] min-w-[44px] min-h-[44px] flex items-center justify-center p-0"
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
      </div>
    </div>
  );
}
