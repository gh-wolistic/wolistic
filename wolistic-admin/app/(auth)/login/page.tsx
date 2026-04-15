"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { adminApi } from "@/lib/admin-api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already authenticated
  useEffect(() => {
    async function checkExistingAuth() {
      try {
        const session = await adminApi.session.check();
        if (session.authenticated) {
          // User is already logged in, redirect to dashboard
          router.push("/dashboard");
        }
      } catch {
        // Not authenticated, show login form
      } finally {
        setIsCheckingAuth(false);
      }
    }

    void checkExistingAuth();
  }, [router]);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await adminApi.session.login(email, password);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent mx-auto"></div>
          <p className="text-sm text-slate-400">Checking authentication...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
      {/* Background gradients */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-cyan-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 -bottom-44 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl" />

      {/* Login Card */}
      <section className="relative w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl backdrop-blur-xl">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-cyan-300">Wolistic</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Admin</h1>
          </div>
        </div>

        <p className="mt-6 text-sm text-slate-400">
          Sign in to manage professionals, subscriptions, and platform configuration.
        </p>

        {/* Login Form */}
        <form className="mt-8 space-y-5" onSubmit={handleLogin}>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-slate-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-white/10 bg-slate-950/60 text-slate-100 focus:border-cyan-400"
              placeholder="admin@wolistic.com"
              autoComplete="email"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-slate-300">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-white/10 bg-slate-950/60 text-slate-100 focus:border-cyan-400"
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive" className="mt-4">
            {error}
          </Alert>
        )}
      </section>
    </main>
  );
}
