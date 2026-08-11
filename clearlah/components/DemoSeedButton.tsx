"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { SeedApiResponse } from "@/lib/types/database";

interface DemoSeedButtonProps {
  className?: string;
}

export default function DemoSeedButton({ className = "" }: DemoSeedButtonProps) {
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimeouts();
      controllerRef.current?.abort();
    };
  }, [clearTimeouts]);

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    setToast(null);
    clearTimeouts();
    controllerRef.current?.abort();
    controllerRef.current = new AbortController();

    try {
      const res = await fetch("/api/demo/seed", {
        method: "POST",
        signal: controllerRef.current.signal,
      });
      const json = (await res.json()) as SeedApiResponse & { error?: string };

      if (!mountedRef.current) return;

      if (json.error) {
        setToast(`Could not load demo data: ${json.error}`);
        return;
      }

      setToast(`${json.entries} days of demo data ready!`);
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          router.push("/dashboard");
        }
      }, 1200);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (mountedRef.current) {
        setToast("Network error — try again?");
      }
    } finally {
      if (mountedRef.current) {
        setSeeding(false);
      }
      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setToast(null);
        }
      }, 3000);
    }
  }, [router, clearTimeouts]);

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={handleSeed}
        disabled={seeding}
        className="btn-primary text-body-md w-full max-w-sm py-3 rounded-lg min-h-[44px]"
        aria-label="Load demo data"
      >
        {seeding ? "Loading demo data…" : "Load Demo Data"}
      </button>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="w-full max-w-sm rounded-lg border-l-4 border-primary-sage bg-primary-sage-50 px-4 py-3 text-body-sm text-neutral-700 animate-fade-in"
        >
          {toast}
        </div>
      )}

      <p className="text-caption text-neutral-500 max-w-sm text-center">
        Pre-loaded with 14 days of realistic eczema tracking data — perfect for
        exploring ClearLah&apos;s insights instantly.
      </p>
    </div>
  );
}
