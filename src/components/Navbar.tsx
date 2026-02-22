"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  if (!session) return null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/dashboard"
            className="text-xl font-bold text-indigo-600 hover:text-indigo-700"
          >
            ActivityTracker
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-6">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Dashboard
            </Link>
            <Link
              href="/summary"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Weekly Summary
            </Link>
            <Link
              href="/settings"
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              Settings
            </Link>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <span className="text-sm text-gray-500">
                {session.user?.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            className="sm:hidden p-2 text-gray-600"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="sm:hidden pb-4 space-y-2">
            <Link
              href="/dashboard"
              className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded"
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/summary"
              className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded"
              onClick={() => setMenuOpen(false)}
            >
              Weekly Summary
            </Link>
            <Link
              href="/settings"
              className="block px-3 py-2 text-gray-600 hover:bg-gray-50 rounded"
              onClick={() => setMenuOpen(false)}
            >
              Settings
            </Link>
            <div className="px-3 py-2 border-t border-gray-100 mt-2 pt-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {session.user?.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-sm text-red-600 font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
