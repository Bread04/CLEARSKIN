"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface BottomNavProps {
  streak?: number;
  highRiskActive?: boolean;
  newInsights?: boolean;
}

const TABS = [
  {
    route: "/flareprint",
    label: "Map",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    route: "/dashboard",
    label: "Home",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <path d="M9 22V12h6v10" />
      </svg>
    ),
  },
  {
    route: "/log",
    label: "Log",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v8" />
        <path d="M8 12h8" />
      </svg>
    ),
  },
  {
    route: "/insights",
    label: "Insights",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
      </svg>
    ),
  },
  {
    route: "/clearcart",
    label: "Shop",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
    ),
  },
  {
    route: "/hawker",
    label: "Hawker",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
        <path d="M7 2v20" />
        <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
      </svg>
    ),
  },
];

export default function BottomNav({
  streak = 0,
  highRiskActive = false,
  newInsights = false,
}: BottomNavProps) {
  const pathname = usePathname();
  const [hasNewInsights, setHasNewInsights] = useState(false);

  useEffect(() => {
    try {
      const lastVisit = localStorage.getItem("clearlah_last_insights_visit");
      const cacheTime = localStorage.getItem("clearlah_trigger_cache_updated");
      if (lastVisit && cacheTime && new Date(cacheTime) > new Date(lastVisit)) {
        setHasNewInsights(true);
      }
    } catch {}
  }, []);

  const showNewInsights = newInsights || hasNewInsights;

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 bg-neutral-50 border-t border-neutral-300 h-16 pb-safe flex items-center justify-around z-40"
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.route || pathname?.startsWith(tab.route + "/");
        return (
          <Link
            key={tab.route}
            href={tab.route}
            onKeyDown={(e) => {
              const currentIndex = TABS.indexOf(tab);
              if (e.key === "ArrowRight") {
                e.preventDefault();
                const next = TABS[(currentIndex + 1) % TABS.length];
                (document.querySelector(`[href="${next.route}"]`) as HTMLElement)?.focus();
              }
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                const prev = TABS[(currentIndex - 1 + TABS.length) % TABS.length];
                (document.querySelector(`[href="${prev.route}"]`) as HTMLElement)?.focus();
              }
            }}
            className={`flex flex-col items-center gap-0.5 min-h-[44px] min-w-[44px] justify-center relative transition-colors duration-ui ${
              isActive ? "text-primary-sage" : "text-neutral-500"
            }`}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.icon}

            {tab.route === "/log" && streak > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-secondary" />
            )}

            {tab.route === "/dashboard" && highRiskActive && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-status-warning" />
            )}

            {tab.route === "/insights" && showNewInsights && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary-sage" />
            )}

            <span className="text-caption">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
