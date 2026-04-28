"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { navigation, isNavItemActive } from "./nav-items";

interface Props {
  email: string;
  displayName: string;
  avatarUrl: string | null;
}

export function TopNav({ email, displayName, avatarUrl }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileNavOpen]);

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
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 cursor-pointer"
            aria-label="Open navigation menu"
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-navigation"
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
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
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

      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close navigation menu"
          />
          <aside
            id="mobile-navigation"
            className="relative flex w-72 max-w-[85%] flex-col bg-sidebar-bg shadow-xl"
          >
            <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-asu-gold rounded flex items-center justify-center flex-shrink-0">
                  <span className="text-asu-maroon font-extrabold text-xs tracking-tight">
                    AI
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">
                    AI Activate
                  </p>
                  <p className="text-xs text-white/60">AI Skills Training</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-2 rounded-lg text-white/70 hover:bg-white/10 hover:text-white cursor-pointer"
                aria-label="Close navigation menu"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <nav
              className="flex-1 overflow-y-auto px-3 py-4 space-y-1"
              aria-label="Main navigation"
            >
              {navigation.map((item) => {
                const isActive = isNavItemActive(item, pathname);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white/15 text-white"
                        : "text-white/70 hover:bg-sidebar-hover hover:text-white"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <svg
                      className="w-5 h-5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </svg>
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="px-6 py-4 border-t border-white/10">
              <p className="text-xs text-white/40">
                Based on Maynard&apos;s 14 AI Skills
              </p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
