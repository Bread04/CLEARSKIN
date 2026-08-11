import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ClearLah — Track Your Triggers",
  description:
    "Track your eczema, IBS, and allergy triggers with AI-powered daily logging. Live with less flare, lah.",
  keywords: ["eczema", "trigger tracking", "IBS", "food allergy", "health log", "Singapore"],
  authors: [{ name: "ClearLah" }],
  openGraph: {
    title: "ClearLah — Track Your Triggers. Live With Less Flare.",
    description: "AI-powered symptom & trigger tracking for Singaporeans with chronic conditions.",
    locale: "en-SG",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#5B7F6E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-SG" className={inter.variable}>
      <body className="min-h-screen bg-neutral-50 text-neutral-800 antialiased">
        {/* Demo Mode Badge — rendered if env var is set */}
        {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
          <div className="demo-badge" aria-label="Demo mode active">
            ✦ Demo Mode
          </div>
        )}
        <ErrorBoundary>{children}</ErrorBoundary>
      </body>
    </html>
  );
}
