"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigation, isNavItemActive } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col bg-sidebar-bg">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
        <div className="w-8 h-8 bg-asu-gold rounded flex items-center justify-center flex-shrink-0">
          <span className="text-asu-maroon font-extrabold text-xs tracking-tight">
            AI
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-tight">
            AI Skills
          </p>
          <p className="text-xs text-white/60">Training Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 py-4 space-y-1" aria-label="Main navigation">
        {navigation.map((item) => {
          const isActive = isNavItemActive(item, pathname);

          return (
            <Link
              key={item.name}
              href={item.href}
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

      {/* Mascot — fills remaining vertical space, anchored above the footer */}
      <div className="flex-1 flex items-end justify-center px-4 pb-2 min-h-0">
        <img
          src="/mascot.png"
          alt=""
          aria-hidden="true"
          className="max-h-72 w-auto object-contain select-none pointer-events-none drop-shadow-lg"
        />
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-white/10">
        <p className="text-xs text-white/40">
          Based on Maynard&apos;s 14 AI Skills
        </p>
      </div>
    </aside>
  );
}
