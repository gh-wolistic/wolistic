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
  onModeToggle: () => void;
  onChange: (field: keyof AuthForm, value: string) => void;
};

export function AuthStep({
  authMode,
  authForm,
  authError,
  authSubmitting,
  onSubmit,
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

      <button type="button" className="w-full text-sm text-emerald-700 hover:underline dark:text-emerald-300" onClick={onModeToggle}>
        {authMode === "signup" ? "Already have an account? Login" : "New user? Sign up"}
      </button>
    </form>
  );
}
