"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { adminAuth } from "@/lib/firebase";
const API_URL = "http://10.134.158.132:3000";

type AdminUser = {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  name: string | null;
  picture: string | null;
};

type AdminMeResponse = {
  success: boolean;
  admin?: boolean;
  user?: AdminUser;
  error?: string;
};

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  /*
   * Check whether Firebase already has a signed-in admin.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(adminAuth, async (user) => {
      if (!user) {
        setAdminUser(null);
        setCheckingSession(false);
        return;
      }

      try {
        /*
         * Force refresh so the newly-created admin=true claim
         * is included in the ID token.
         */
        const token = await user.getIdToken(true);

        const response = await fetch(`${API_URL}/api/admin/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data: AdminMeResponse = await response.json();

        if (!response.ok || data.admin !== true || !data.user) {
          await signOut(adminAuth);

          setAdminUser(null);
          setError(data.error ?? "Admin access denied.");
          return;
        }

        setAdminUser(data.user);
        setError("");
      } catch (err) {
        console.error("Admin session check failed:", err);

        await signOut(adminAuth);

        setAdminUser(null);
        setError("Unable to connect to RIDEX backend.");
      } finally {
        setCheckingSession(false);
      }
    });

    return unsubscribe;
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      /*
       * Firebase authentication.
       */
      const credential = await signInWithEmailAndPassword(
        adminAuth,
        email.trim(),
        password
      );

      /*
       * Force-refresh the token because the admin custom claim
       * may have been added recently.
       */
      const token = await credential.user.getIdToken(true);

      /*
       * Backend is the real authorization authority.
       */
      const response = await fetch(`${API_URL}/api/admin/me`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data: AdminMeResponse = await response.json();

      if (!response.ok || data.admin !== true || !data.user) {
        await signOut(adminAuth);

        setError(data.error ?? "This account is not authorized as an admin.");
        return;
      }

      setAdminUser(data.user);
    } catch (err: unknown) {
      console.error("Admin login failed:", err);

      const firebaseError = err as {
        code?: string;
      };

      switch (firebaseError.code) {
        case "auth/invalid-credential":
          setError("Incorrect email or password.");
          break;

        case "auth/user-not-found":
          setError("No admin account exists with this email.");
          break;

        case "auth/wrong-password":
          setError("Incorrect password.");
          break;

        case "auth/too-many-requests":
          setError("Too many attempts. Please try again later.");
          break;

        default:
          setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await signOut(adminAuth);
      setAdminUser(null);
      setEmail("");
      setPassword("");
      setError("");
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Unable to sign out.");
    }
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-[#0b0b0d] flex items-center justify-center text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <p className="text-sm text-white/50">
            Checking secure admin session...
          </p>
        </div>
      </main>
    );
  }

  if (adminUser) {
    return (
      <main className="min-h-screen bg-[#0b0b0d] text-white">
        <header className="border-b border-white/10">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <div>
              <div className="text-xl font-bold tracking-[0.25em]">
                RIDEX
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.2em] text-white/40">
                Admin Operations
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/5 hover:text-white"
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="mx-auto max-w-7xl px-6 py-10">
          <div className="mb-10">
            <p className="text-sm text-white/40">Welcome back</p>

            <h1 className="mt-2 text-4xl font-semibold tracking-tight">
              RIDEX Operations
            </h1>

            <p className="mt-3 text-white/50">
              Manage riders, applications, rides and platform operations.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              ["Pending Riders", "—"],
              ["Approved Riders", "—"],
              ["Active Rides", "—"],
              ["Total Users", "—"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <p className="text-sm text-white/40">{label}</p>
                <p className="mt-3 text-3xl font-semibold">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <p className="text-sm uppercase tracking-[0.18em] text-white/40">
              Signed in as
            </p>

            <p className="mt-3 text-lg">{adminUser.email}</p>

            <p className="mt-1 text-sm text-white/40">
              Firebase UID: {adminUser.uid}
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b0b0d] text-white">
      <div className="flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="text-3xl font-bold tracking-[0.3em]">
              RIDEX
            </div>

            <p className="mt-3 text-sm uppercase tracking-[0.22em] text-white/40">
              Admin Operations
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-8 shadow-2xl">
            <div className="mb-8">
              <h1 className="text-2xl font-semibold">
                Sign in
              </h1>

              <p className="mt-2 text-sm text-white/45">
                Secure access for RIDEX administrators.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm text-white/60"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@ridex.in"
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm outline-none transition placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm text-white/60"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  disabled={loading}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3.5 text-sm outline-none transition placeholder:text-white/20 focus:border-white/30"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-white px-4 py-3.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-white/25">
            RIDEX Operations Portal
          </p>
        </div>
      </div>
    </main>
  );
}