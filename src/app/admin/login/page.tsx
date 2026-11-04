
"use client";

import { useState, type FormEvent } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

const ADMIN_UID = "28jNe77DmcY7fgGrKhKNgwubDCa2";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      if (credential.user.uid !== ADMIN_UID) {
        await signOut(auth);
        setError(
          "This account is not authorized to access the admin panel."
        );
        return;
      }

      router.replace("/admin/");
    } catch {
      setError(
        "Login failed. Check your email and password, then try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950 px-5 py-5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <a href="/" className="block">
            <p className="text-sm font-black tracking-[0.2em] text-orange-400">
              CHITRANYA
            </p>
            <p className="text-xs text-slate-400">
              Admin Control Panel
            </p>
          </a>

          <a
            href="/"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-orange-500 hover:text-orange-400"
          >
            Visit Store ↗
          </a>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="border-b border-slate-800 bg-slate-900 px-5">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-2 py-3">
          <a
            href="/admin/"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-orange-400"
          >
            📊 Dashboard
          </a>

          <a
            href="/admin/products/"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-orange-400"
          >
            📦 Manage Products
          </a>

          <a
            href="/admin/login/"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white"
          >
            🔐 Admin Login
          </a>
        </div>
      </nav>

      {/* Login Form */}
      <section className="flex min-h-[75vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-3xl font-black text-white shadow-lg shadow-orange-500/20">
              C
            </div>

            <p className="text-sm font-bold uppercase tracking-[0.25em] text-orange-400">
              CHITRANYA
            </p>

            <h1 className="mt-3 text-3xl font-black">
              Admin Sign In
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              Sign in with your authorized administrator account.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8"
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-300"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm text-red-300"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-orange-500 px-4 py-3 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In to Admin"}
            </button>

            <p className="text-center text-xs text-slate-500">
              Authorized administrators only
            </p>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            <a
              href="/"
              className="font-semibold transition hover:text-orange-400"
            >
              ← Back to CHITRANYA Store
            </a>
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-800 px-5 py-6 text-center text-xs text-slate-500">
        © 2026 CHITRANYA. Admin Control Panel.
      </footer>

    </main>
  );
}
