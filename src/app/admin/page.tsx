"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type LoginResponse = { success: true; token: string } | { success: false; message?: string };

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => email.trim().length > 3 && password.length > 0 && !loading, [email, password, loading]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin-auth?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as LoginResponse;
      if (!data.success) {
        setError(data.message || "Invalid credentials. Please try again.");
        return;
      }
      localStorage.setItem("uptura_admin_token", data.token);
      localStorage.setItem("uptura_admin_auth", "true");
      router.push("/admin/dashboard");
    } catch {
      setError("An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-bg" aria-hidden="true">
        <div className="admin-blob admin-blob-1" />
        <div className="admin-blob admin-blob-2" />
      </div>

      <section className="admin-login-card">
        <div className="admin-login-logo">
          <img
            src="https://cdn.prod.website-files.com/6956bd5acabb30f84175fa1b/695861fb4062b42c0bd5c2cd_Logo%20Main.png"
            alt="Uptura"
          />
        </div>

        <h1 className="admin-login-title">Admin Dashboard</h1>

        <form onSubmit={onSubmit} className="admin-login-form">
          <label className="admin-field">
            <span className="admin-label">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="admin-input"
              placeholder="Enter your email"
              autoComplete="username"
              required
            />
          </label>

          <label className="admin-field">
            <span className="admin-label">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="admin-input"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="admin-login-btn" disabled={!canSubmit}>
            <span>{loading ? "Logging in..." : "Login"}</span>
            <i className={`fa-solid ${loading ? "fa-spinner fa-spin" : "fa-arrow-right"}`} />
          </button>

          {error && <div className="admin-error">{error}</div>}
        </form>
      </section>
    </main>
  );
}

