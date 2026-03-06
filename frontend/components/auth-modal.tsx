"use client";

import { useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type AuthMode = "login" | "signup";
type AuthMethod = "email" | "social";

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [method, setMethod] = useState<AuthMethod>("social");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email/password form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  if (!isOpen) {
    return null;
  }

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = getSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/authorized`;
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });

      if (signInError) {
        setError(signInError.message);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to continue with Google");
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabaseBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          emailRedirectTo: `${window.location.origin}/authorized`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setError(null);
        setEmail("");
        setPassword("");
        setPasswordConfirm("");
        setName("");
        alert(
          "Account created successfully! Please check your email to confirm your account, then you can log in."
        );
        setMethod("social");
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }

    try {
      setLoading(true);
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        // Close the modal on successful login
        onClose();
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-900">
            {mode === "login" ? "Login" : "Sign Up"} to Wolistic
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-zinc-500 hover:bg-zinc-100"
            aria-label="Close auth dialog"
          >
            x
          </button>
        </div>

        {/* Mode toggle: Login / Sign Up */}
        <div className="mb-6 grid grid-cols-2 rounded-lg bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError(null);
              setEmail("");
              setPassword("");
            }}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              mode === "login" ? "bg-white text-zinc-900 shadow" : "text-zinc-600"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError(null);
              setName("");
              setEmail("");
              setPassword("");
              setPasswordConfirm("");
            }}
            className={`rounded-md px-3 py-2 text-sm font-medium ${
              mode === "signup" ? "bg-white text-zinc-900 shadow" : "text-zinc-600"
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Method toggle: Email / Social */}
        <div className="mb-6 grid grid-cols-2 gap-2 rounded-lg bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => {
              setMethod("email");
              setError(null);
            }}
            className={`rounded-md px-3 py-2 text-xs font-medium ${
              method === "email" ? "bg-white text-zinc-900 shadow" : "text-zinc-600"
            }`}
          >
            Email/Password
          </button>
          <button
            type="button"
            onClick={() => {
              setMethod("social");
              setError(null);
            }}
            className={`rounded-md px-3 py-2 text-xs font-medium ${
              method === "social" ? "bg-white text-zinc-900 shadow" : "text-zinc-600"
            }`}
          >
            Social Login
          </button>
        </div>

        {/* Social Login */}
        {method === "social" && (
          <>
            <button
              type="button"
              onClick={signInWithGoogle}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-3 font-medium text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Redirecting..." : `${mode === "login" ? "Continue" : "Create account"} with Google`}
            </button>

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
          </>
        )}

        {/* Email/Password Login */}
        {method === "email" && mode === "login" && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        )}

        {/* Email/Password Signup */}
        {method === "email" && mode === "signup" && (
          <form onSubmit={handleEmailSignUp} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-zinc-700">
                Email
              </label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-zinc-700">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-zinc-500">At least 6 characters</p>
            </div>

            <div>
              <label htmlFor="password-confirm" className="block text-sm font-medium text-zinc-700">
                Confirm Password
              </label>
              <input
                id="password-confirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                disabled={loading}
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

        <p className="mt-4 text-xs text-zinc-500">
          By continuing, you agree to Wolistic terms and consent to wellness personalization.
        </p>
      </div>
    </div>
  );
}
