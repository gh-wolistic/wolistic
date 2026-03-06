"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type AuthState = {
  email: string | null;
  userId: string;
};

export default function AuthorizedPage() {
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseBrowserClient();

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      const session = data.session;
      if (!session) {
        setAuthState(null);
        setLoading(false);
        return;
      }

      setAuthState({
        email: session.user.email ?? null,
        userId: session.user.id,
      });
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) {
        return;
      }

      if (!session) {
        setAuthState(null);
      } else {
        setAuthState({
          email: session.user.email ?? null,
          userId: session.user.id,
        });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-6">
        <p className="text-zinc-600">Checking session...</p>
      </main>
    );
  }

  if (!authState) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-3xl font-semibold text-zinc-900">Not authorized</h1>
        <p className="text-zinc-600">Please login first from the home page.</p>
        <Link href="/" className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white">
          Go to Home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Authorized Area</h1>
      <p className="text-zinc-600">Welcome to Wolistic. You are successfully logged in.</p>

      <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
        <p className="text-sm uppercase tracking-wide text-zinc-500">Session Details</p>
        <p className="mt-2 text-sm text-zinc-700">Email: {authState.email ?? "Not available"}</p>
        <p className="text-sm text-zinc-700">User ID: {authState.userId}</p>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={logout}
          className="rounded-lg bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700"
        >
          Logout
        </button>
        <Link href="/" className="rounded-lg border border-zinc-300 px-4 py-2 font-medium text-zinc-700 hover:bg-zinc-100">
          Home
        </Link>
      </div>
    </main>
  );
}
