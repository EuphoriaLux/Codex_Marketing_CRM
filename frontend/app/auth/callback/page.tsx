"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { exchangeCode } from "@/lib/api/client";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = params.get("code");
    if (!code) {
      setError("Missing authorization code.");
      return;
    }
    exchangeCode(code)
      .then(() => {
        // Scrub the code from URL history before any further navigation
        // happens — the code is single-use and already redeemed, but it's
        // good hygiene to not leave it sitting in the browser address bar
        // or session history.
        if (typeof window !== "undefined") {
          window.history.replaceState({}, "", "/auth/callback");
        }
        router.replace("/");
      })
      .catch(() => setError("Sign-in failed. The code may have expired."));
  }, [params, router]);

  return (
    <main className="page">
      <div
        style={{
          maxWidth: 420,
          margin: "4rem auto",
          padding: "2rem",
          textAlign: "center",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
        }}
      >
        {error ? (
          <>
            <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Sign-in failed</h1>
            <p style={{ marginTop: "0.5rem", opacity: 0.7 }}>{error}</p>
            <p style={{ marginTop: "1.5rem" }}>
              <a href="/login">Back to sign in</a>
            </p>
          </>
        ) : (
          <>
            <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Signing you in…</h1>
            <p style={{ marginTop: "0.5rem", opacity: 0.7 }}>
              Exchanging your authorization code.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

// useSearchParams() must be wrapped in Suspense for static export builds.
export default function AuthCallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}
