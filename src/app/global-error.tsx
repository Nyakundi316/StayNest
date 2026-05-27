"use client";

import { useEffect } from "react";

// Last-resort error boundary. Fires only when the root layout itself
// crashes, so we re-render <html>/<body> from scratch and use inline
// styles — globals.css may not have loaded.
export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{
        margin: 0,
        background: "#fbf7f2",
        color: "#11151c",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px"
      }}>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, margin: "0 auto 16px",
            borderRadius: "999px",
            background: "#fee2e2", color: "#dc2626",
            display: "grid", placeItems: "center",
            fontSize: 22, fontWeight: 700
          }}>!</div>
          <h1 style={{
            fontFamily: "Georgia, Cambria, serif",
            fontSize: 26, fontWeight: 600, letterSpacing: "-0.5px",
            margin: "0 0 8px"
          }}>
            StayNest is briefly unavailable
          </h1>
          <p style={{ fontSize: 14, color: "#566073", margin: "0 0 4px" }}>
            We&rsquo;ve been notified and are looking into it.
          </p>
          <p style={{ fontSize: 14, color: "#566073", margin: 0 }}>
            For anything urgent, reach us at +254 708 781 407.
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, color: "#7a8497", marginTop: 12, fontFamily: "monospace" }}>
              Ref: {error.digest}
            </p>
          )}

          <button
            onClick={reset}
            style={{
              marginTop: 24,
              background: "#ef6a2b",
              color: "white",
              border: "none",
              padding: "10px 22px",
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
