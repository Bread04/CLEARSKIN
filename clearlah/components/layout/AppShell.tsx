"use client";

import { usePathname } from "next/navigation";
import BottomNav from "@/components/ui/BottomNav";

interface AppShellProps {
  children: React.ReactNode;
  streak?: number;
  highRiskActive?: boolean;
}

export default function AppShell({ children, streak = 0, highRiskActive = false }: AppShellProps) {
  const pathname = usePathname();
  const isAppRoute =
    pathname === "/dashboard" ||
    pathname?.startsWith("/dashboard/") ||
    pathname === "/log" ||
    pathname?.startsWith("/log/") ||
    pathname === "/insights" ||
    pathname === "/hawker" ||
    pathname === "/clearcart" ||
    pathname === "/flareprint" ||
    pathname?.startsWith("/flareprint/");

  if (!isAppRoute) return <>{children}</>;

  return (
    <>
      <div className="pb-16">{children}</div>
      <BottomNav streak={streak} highRiskActive={highRiskActive} />
    </>
  );
}
