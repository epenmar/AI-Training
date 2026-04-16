"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const isTestMode = process.env.NEXT_PUBLIC_ALLOW_TEST_ACCOUNTS === "true";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Domain check
    if (!isTestMode && !email.endsWith("@asu.edu")) {
      setErrorMsg("Please use your @asu.edu email address.");
      return;
    }

    setStatus("sending");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
    } else {
      setStatus("sent");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full">
        {/* ASU Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-asu-maroon rounded-lg flex items-center justify-center">
              <span className="text-asu-gold font-bold text-xl">A</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-asu-maroon tracking-wide uppercase">
                Arizona State University
              </p>
              <p className="text-xs text-gray-500">
                Instructional Design Team
              </p>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-700 mb-2">
            AI Skills Training Dashboard
          </h1>
          <p className="text-gray-500 text-sm">
            Assess your AI skills, track your progress, and level up with
            personalized learning paths.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          {status === "sent" ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-asu-green"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                Check your email
              </h2>
              <p className="text-gray-500 text-sm mb-4">
                We sent a sign-in link to <strong>{email}</strong>.
                Click the link in the email to access the dashboard.
              </p>
              <button
                onClick={() => { setStatus("idle"); setEmail(""); }}
                className="text-sm text-asu-blue hover:underline cursor-pointer"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-gray-700 mb-4 text-center">
                Sign in to continue
              </h2>
              <form onSubmit={handleSubmit}>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isTestMode ? "you@example.com" : "you@asu.edu"}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-gray-700 placeholder-gray-400 focus:outline-none focus:border-asu-maroon transition-colors"
                  disabled={status === "sending"}
                  autoComplete="email"
                />
                {errorMsg && (
                  <p className="text-sm text-red-600 mt-2" role="alert">{errorMsg}</p>
                )}
                <button
                  type="submit"
                  disabled={status === "sending"}
                  className="w-full mt-4 bg-asu-maroon text-white rounded-lg px-6 py-3 font-medium hover:bg-sidebar-hover transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {status === "sending" ? "Sending link..." : "Send sign-in link"}
                </button>
              </form>
              <div className="mt-4 text-center">
                <p className="text-xs text-gray-400">
                  No password needed — we&apos;ll email you a sign-in link
                </p>
                {isTestMode && (
                  <p className="text-xs text-asu-orange mt-1 font-medium">
                    Test mode: any email accepted
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Based on Andrew Maynard&apos;s 14 AI Skill Statements
        </p>
      </div>
    </div>
  );
}
