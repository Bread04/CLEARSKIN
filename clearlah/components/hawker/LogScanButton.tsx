"use client";

import { useState } from "react";
import HawkerScan from "@/components/hawker/HawkerScan";

export default function LogScanButton() {
  const [scanning, setScanning] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setScanning(true)}
        className="btn-secondary flex items-center gap-1.5 min-h-[44px]"
        aria-label="Scan dish with camera"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <span className="hidden sm:inline text-body-sm">Scan dish</span>
      </button>

      {scanning && (
        <HawkerScan
          onClose={() => setScanning(false)}
          onLog={(_dish, _photoDataUrl) => {
            setScanning(false);
          }}
        />
      )}
    </>
  );
}
