"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { OpenAuthButton } from "@/components/auth/OpenAuthButton";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function Home() {
  const [health, setHealth] = useState("checking");
  const { isAuthenticated } = useAuthSession();

  const healthUrl = useMemo(() => `${apiBaseUrl}/api/v1/healthz`, []);

  useEffect(() => {
    let mounted = true;

    const loadHealth = async () => {
      try {
        const response = await fetch(healthUrl, { cache: "no-store" });
        if (!mounted) {
          return;
        }

        if (!response.ok) {
          setHealth("unhealthy");
          return;
        }

        const data = (await response.json()) as { status?: string };
        setHealth(data.status ?? "unknown");
      } catch {
        if (mounted) {
          setHealth("unreachable");
        }
      }
    };

    loadHealth();

    return () => {
      mounted = false;
    };
  }, [healthUrl]);

  return (
    <>
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center gap-8 px-6 py-16 sm:px-12">
        <div>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900">Wolistic Wellness Platform</h1>
          <p className="mt-3 max-w-2xl text-zinc-600">
            Discover certified wellness experts and receive AI-guided recommendations tailored to user goals and
            preferences.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          <p className="text-sm uppercase tracking-wide text-zinc-500">Backend Health</p>
          <p className="mt-2 text-2xl font-medium text-zinc-900">{health}</p>
          <p className="mt-2 text-sm text-zinc-600">{healthUrl}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <OpenAuthButton className="rounded-lg bg-zinc-900 px-5 py-2.5 font-medium text-white hover:bg-zinc-700">
            Login / Sign Up
          </OpenAuthButton>

          <Link
            href="/authorized"
            className="rounded-lg border border-zinc-300 px-5 py-2.5 font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Go to Authorized Page
          </Link>

          {isAuthenticated ? <p className="self-center text-sm text-emerald-700">Logged in</p> : null}
        </div>
      </main>
    </>
  );
}
