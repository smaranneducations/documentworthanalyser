"use client";

import { useAuth } from "@/lib/auth";
import { LogIn, LogOut } from "lucide-react";
import Link from "next/link";

/**
 * UserMenu — shows login button or user email + logout.
 * Drop into any header.
 */
export default function UserMenu() {
  const { user, email, loading, signOut } = useAuth();

  if (loading) {
    return <div className="w-24 h-7 rounded-lg bg-zinc-800/60 animate-pulse" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
      >
        <LogIn className="h-3.5 w-3.5 text-blue-400" />
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-zinc-400 max-w-[160px] truncate" title={email || ""}>
        {email}
      </span>
      <button
        onClick={signOut}
        className="inline-flex items-center gap-1 rounded-lg border border-zinc-700 bg-zinc-800/60 px-2.5 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100 transition-colors"
        title="Sign out"
      >
        <LogOut className="h-3 w-3" />
      </button>
    </div>
  );
}
