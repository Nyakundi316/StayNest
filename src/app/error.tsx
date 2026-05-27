"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";

// Catches runtime errors inside any route segment. Wraps every page below
// the root layout. Global crashes are caught by global-error.tsx instead.
export default function RouteError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route error]", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] grid place-items-center px-4">
      <div className="max-w-md text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-red-50 text-red-600 grid place-items-center mb-4">
          <AlertOctagon size={22} />
        </div>
        <h1 className="h-display text-2xl mb-2">Something went wrong</h1>
        <p className="text-sm text-ink-500">
          We hit an unexpected error rendering this page. The team has been notified.
        </p>
        {error.digest && (
          <p className="text-xs text-ink-400 mt-2 font-mono">Ref: {error.digest}</p>
        )}

        <div className="mt-6 flex items-center justify-center gap-2">
          <button onClick={reset} className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-1.5">
            <RotateCcw size={14} /> Try again
          </button>
          <Link href="/" className="btn-secondary px-5 py-2.5 text-sm inline-flex items-center gap-1.5">
            <Home size={14} /> Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
