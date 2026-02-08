"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Shield } from "lucide-react";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  // If already logged in, redirect to home
  useEffect(() => {
    if (!loading && user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="DocDetector" className="mx-auto h-20 w-20 rounded-2xl mb-4" />
          <h1 className="text-2xl font-bold tracking-tight">DocDetector</h1>
          <p className="text-sm text-zinc-500 mt-1">AI Forensic Analyst for Business Documents</p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="rounded-full bg-blue-500/15 p-2">
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Sign in</h2>
              <p className="text-xs text-zinc-500">to access private file assessments</p>
            </div>
          </div>

          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            Sign in with your Google account to upload <strong className="text-zinc-200">private documents</strong> that
            only you can see, and post <strong className="text-zinc-200">starred comments</strong> that
            guarantee an admin response within 7 working days.
          </p>

          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-white text-zinc-900 px-4 py-3 text-sm font-semibold hover:bg-zinc-100 transition-colors cursor-pointer"
          >
            {/* Google "G" logo */}
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <p className="text-xs text-zinc-600 text-center mt-4">
            We only use your email address. No other data is stored.
          </p>
        </div>

        {/* Skip link */}
        <p className="text-center mt-8">
          <a href="/" className="text-base font-bold text-zinc-400 hover:text-zinc-200 transition-colors underline underline-offset-4 cursor-pointer">
            Continue without signing in
          </a>
          <span className="block text-sm mt-2 text-zinc-600">Public uploads &amp; anonymous comments only</span>
        </p>
      </div>
    </div>
  );
}
