import type React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthMode = "signup" | "login";

type AuthForm = {
  name: string;
  email: string;
  password: string;
};

type AuthStepProps = {
  authMode: AuthMode;
  authForm: AuthForm;
  authError: string | null;
  authSubmitting: boolean;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onGoogleAuth: () => void;
  onModeToggle: () => void;
  onChange: (field: keyof AuthForm, value: string) => void;
};

export function AuthStep({
  authMode,
  authForm,
  authError,
  authSubmitting,
  onSubmit,
  onGoogleAuth,
  onModeToggle,
  onChange,
}: AuthStepProps) {
  return (
    <form className="mt-5 space-y-4" onSubmit={onSubmit}>
      <h4>{authMode === "signup" ? "Create Account to Continue" : "Login to Continue"}</h4>

      {authMode === "signup" && (
        <div className="space-y-1.5">
          <Label htmlFor="auth-name">Full Name</Label>
          <Input
            id="auth-name"
            value={authForm.name}
            onChange={(event) => onChange("name", event.target.value)}
            required
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="auth-email">Email</Label>
        <Input
          id="auth-email"
          type="email"
          value={authForm.email}
          onChange={(event) => onChange("email", event.target.value)}
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="auth-password">Password</Label>
        <Input
          id="auth-password"
          type="password"
          value={authForm.password}
          onChange={(event) => onChange("password", event.target.value)}
          required
        />
      </div>

      {authError && <p className="text-sm text-destructive">{authError}</p>}

      <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={authSubmitting}>
        {authSubmitting
          ? authMode === "signup"
            ? "Creating account..."
            : "Logging in..."
          : authMode === "signup"
            ? "Sign up & Continue"
            : "Login & Continue"}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <Button type="button" variant="outline" onClick={onGoogleAuth} disabled={authSubmitting} className="w-full">
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
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
        {authSubmitting ? "Redirecting..." : "Google"}
      </Button>

      <button type="button" className="w-full text-sm text-emerald-700 hover:underline dark:text-emerald-300" onClick={onModeToggle}>
        {authMode === "signup" ? "Already have an account? Login" : "New user? Sign up"}
      </button>
    </form>
  );
}
