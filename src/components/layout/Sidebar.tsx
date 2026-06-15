"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { navigation, isNavItemActive } from "./nav-items";
import { useAdminEdit } from "@/components/admin/AdminEditProvider";

const STORAGE_KEY = "sidebar:collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const { effectiveIsAdmin: isAdmin } = useAdminEdit();
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === "1") setCollapsed(true);
    } catch {
      // ignore
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed, hydrated]);

  const widthClass = collapsed ? "md:w-16" : "md:w-64";

  return (
    <aside
      className={`hidden md:flex md:flex-col bg-sidebar-bg transition-[width] duration-200 ${widthClass}`}
    >
      {/* Logo + collapse toggle */}
      <div
        className={`flex items-center gap-3 border-b border-white/10 ${
          collapsed ? "justify-center px-2 py-3" : "px-6 py-5"
        }`}
      >
        <div className="w-8 h-8 bg-asu-gold rounded flex items-center justify-center flex-shrink-0">
          <span className="text-asu-maroon font-extrabold text-xs tracking-tight">
            AI
          </span>
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white leading-tight">
              AI Activate
            </p>
            <p className="text-xs text-white/60">AI Skills Training</p>
          </div>
        )}
        {!collapsed && (
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse sidebar"
            className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
              />
            </svg>
          </button>
        )}
      </div>

      {collapsed && (
        <div className="px-2 py-2 flex justify-center">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            aria-label="Expand sidebar"
            className="p-1.5 rounded text-white/60 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav
        className={`py-4 ${collapsed ? "px-2 space-y-1" : "px-3 space-y-1"}`}
        aria-label="Main navigation"
      >
        {navigation.map((item) => {
          const isActive = isNavItemActive(item, pathname);
          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              aria-label={collapsed ? item.name : undefined}
              className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
              } ${
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
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
        {/* Admin-only: editor notes review. Shown only to admins via
            the AdminEdit context. */}
        {isAdmin && (
          <Link
            href="/admin/comments"
            title={collapsed ? "Reviewer notes" : undefined}
            aria-label={collapsed ? "Reviewer notes" : undefined}
            className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
              collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
            } ${
              pathname.startsWith("/admin/comments")
                ? "bg-white/15 text-white"
                : "text-asu-gold/90 hover:bg-sidebar-hover hover:text-white"
            }`}
            aria-current={
              pathname.startsWith("/admin/comments") ? "page" : undefined
            }
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
            {!collapsed && <span>Reviewer notes</span>}
          </Link>
        )}
      </nav>

      {/* Mascot — only when expanded */}
      {!collapsed && (
        <div className="flex-1 flex items-end justify-center px-4 pb-2 min-h-0">
          <img
            src="/mascot.png"
            alt=""
            aria-hidden="true"
            className="max-h-72 w-auto object-contain select-none pointer-events-none drop-shadow-lg"
          />
        </div>
      )}

      {/* Footer */}
      {!collapsed && (
        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-xs text-white/40">
            Based on Maynard&apos;s 14 AI Skills
          </p>
        </div>
      )}
      {collapsed && <div className="flex-1" />}
    </aside>
  );
}
