"use client";

import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function LoginPage() {
  const [status, setStatus] = useState<"idle" | "redirecting" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  const isTestMode = process.env.NEXT_PUBLIC_ALLOW_TEST_ACCOUNTS === "true";

  const handleGoogleSignIn = async () => {
    setErrorMsg("");
    setStatus("redirecting");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // Hint Google to scope the account chooser to ASU. Not a
        // hard gate — the server-side callback also rejects non-ASU
        // emails — but it keeps personal Google accounts out of the
        // chooser for users signed into both.
        queryParams: isTestMode ? {} : { hd: "asu.edu" },
      },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
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
          <h2 className="text-lg font-semibold text-gray-700 mb-5 text-center">
            Sign in to continue
          </h2>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={status === "redirecting"}
            className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:border-asu-maroon hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 18 18"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              />
              <path
                fill="#34A853"
                d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
              />
              <path
                fill="#FBBC05"
                d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
              />
              <path
                fill="#EA4335"
                d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"
              />
            </svg>
            <span>
              {status === "redirecting"
                ? "Redirecting to Google…"
                : "Continue with Google"}
            </span>
          </button>

          {errorMsg && (
            <p className="text-sm text-red-600 mt-3" role="alert">
              {errorMsg}
            </p>
          )}

          <div className="mt-5 text-center space-y-1">
            <p className="text-xs text-gray-400">
              Use your @asu.edu Google account.
            </p>
            {isTestMode && (
              <p className="text-xs text-asu-orange font-medium">
                Test mode: non-ASU accounts accepted
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          Based on Andrew Maynard&apos;s 14 AI Skill Statements
        </p>
      </div>
    </div>
  );
}
