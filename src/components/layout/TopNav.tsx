"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

export function TopNav({ email, displayName, avatarUrl }: Props) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center gap-4">
        {/* Mobile menu button - placeholder for future mobile nav */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          aria-label="Open menu"
        >
          <svg
            className="w-5 h-5 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <h1 className="text-lg font-semibold text-gray-700 hidden sm:block">
          AI Skills Training
        </h1>
      </div>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          aria-expanded={menuOpen}
          aria-haspopup="true"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 bg-asu-maroon text-white rounded-full flex items-center justify-center text-xs font-medium">
              {initials}
            </div>
          )}
          <span className="text-sm text-gray-600 hidden sm:block">
            {displayName}
          </span>
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div
              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1"
              role="menu"
            >
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-400 truncate">{email}</p>
              </div>
              <Link
                href="/account"
                onClick={() => setMenuOpen(false)}
                className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
                role="menuitem"
              >
                Account settings
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 cursor-pointer"
                role="menuitem"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
