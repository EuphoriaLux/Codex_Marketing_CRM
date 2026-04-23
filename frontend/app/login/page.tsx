"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/client";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
      router.replace("/");
    } catch {
      setError("Invalid credentials.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <div
        style={{
          maxWidth: 420,
          margin: "4rem auto",
          padding: "2rem",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 12,
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.5rem" }}>Sign in to the hub</h1>
        <p style={{ marginTop: "0.5rem", opacity: 0.7 }}>
          Authenticate against the Django API to load live data.
        </p>

        <form
          onSubmit={handleSubmit}
          className="app-form"
          style={{ marginTop: "1.5rem" }}
        >
          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          <button type="submit" className="button" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
          {error ? <p className="form-note">{error}</p> : null}
        </form>
      </div>
    </main>
  );
}
