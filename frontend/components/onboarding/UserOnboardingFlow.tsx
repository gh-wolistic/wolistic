"use client";

import { useState } from "react";
import { Building2, CheckCircle2, Sparkles, Stethoscope, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { partnerSubtypeOptions, type OnboardingSelection, type UserSubtype, type UserType } from "./types";

type UserOnboardingFlowProps = {
  userName?: string;
  initialUserType?: UserType | null;
  initialUserSubtype?: UserSubtype | null;
  compact?: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  submitLabel?: string;
  onSubmit: (selection: OnboardingSelection) => void | Promise<void>;
};

export function UserOnboardingFlow({
  userName,
  initialUserType,
  initialUserSubtype,
  compact = false,
  isSubmitting = false,
  error,
  submitLabel = "Continue",
  onSubmit,
}: UserOnboardingFlowProps) {
  const [selectedUserType, setSelectedUserType] = useState<UserType | null>(initialUserType ?? null);
  const [selectedUserSubtype, setSelectedUserSubtype] = useState<UserSubtype | null>(
    initialUserSubtype ?? null,
  );

  const handleSelectUserType = (nextUserType: UserType) => {
    setSelectedUserType(nextUserType);
    setSelectedUserSubtype(nextUserType === "client" ? "client" : null);
  };

  const handleSubmit = async () => {
    if (!selectedUserType) {
      return;
    }

    if (selectedUserType === "client") {
      await onSubmit({ userType: "client", userSubtype: "client" });
      return;
    }

    if (!selectedUserSubtype || selectedUserSubtype === "client") {
      return;
    }

    await onSubmit({ userType: "partner", userSubtype: selectedUserSubtype });
  };

  const isPartnerSelectionMissing = selectedUserType === "partner" && !selectedUserSubtype;
  const isDisabled = !selectedUserType || isPartnerSelectionMissing || isSubmitting;

  return (
    <div
      className={`relative w-full overflow-hidden border border-emerald-200/80 bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50 ${
        compact
          ? "rounded-2xl p-4 md:p-5"
          : "min-h-[calc(100dvh-1.5rem)] rounded-[2rem] p-4 md:min-h-0 md:p-8"
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-emerald-200/45 blur-3xl md:h-52 md:w-52" />
        <div className="absolute -bottom-16 -right-8 h-44 w-44 rounded-full bg-cyan-200/40 blur-3xl md:h-56 md:w-56" />
      </div>

      <div className={`relative mx-auto flex w-full flex-col ${compact ? "max-w-4xl" : "max-w-6xl"}`}>
        <div className={`text-center ${compact ? "mb-4" : "mb-6 md:mb-8"}`}>
          <div className="mb-3 inline-flex items-center gap-2 text-emerald-700">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-[0.24em]">Wolistic Onboarding</span>
            <Sparkles className="h-5 w-5" />
          </div>
          <h2
            className={`font-light tracking-tight text-slate-900 ${
              compact ? "text-xl sm:text-2xl" : "text-2xl sm:text-3xl md:text-5xl"
            }`}
          >
            Welcome{userName ? `, ${userName}` : ""}
          </h2>
          <p className={`mt-3 text-sm text-slate-600 ${compact ? "px-0" : "px-2 md:px-0 md:text-base"}`}>
            Choose how you want to experience Wolistic so we can personalize the next steps.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          <Card
            className={`relative cursor-pointer rounded-[1.75rem] border-2 p-6 transition-all duration-300 md:rounded-[2rem] md:p-10 ${
              selectedUserType === "client"
                ? "scale-[1.01] border-emerald-500 bg-white shadow-2xl shadow-emerald-100"
                : "border-transparent bg-white/95 shadow-lg hover:border-emerald-200 hover:shadow-xl"
            }`}
            onClick={() => handleSelectUserType("client")}
          >
            {selectedUserType === "client" ? (
              <div className="absolute right-5 top-5 rounded-full bg-emerald-500 p-2 text-white shadow-lg">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            ) : null}

            <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 p-4 text-white md:mb-6 md:h-18 md:w-18 md:p-5">
              <User className="h-9 w-9" />
            </div>
            <h3 className="mb-3 text-2xl font-light text-slate-900 md:text-4xl">I&apos;m a Client</h3>
            <p className="mb-5 text-slate-600">
              I&apos;m here to discover wellness experts, book services, and build my personal wellbeing journey.
            </p>
            <ul className="space-y-2.5 text-sm text-slate-700">
              <li>Connect with trusted wellness professionals</li>
              <li>Book consultations and personalized services</li>
              <li>Explore a guided wellness experience built around your goals</li>
            </ul>
          </Card>

          <Card
            className={`relative cursor-pointer rounded-[1.75rem] border-2 p-6 transition-all duration-300 md:rounded-[2rem] md:p-10 ${
              selectedUserType === "partner"
                ? "scale-[1.01] border-teal-500 bg-white shadow-2xl shadow-teal-100"
                : "border-transparent bg-white/95 shadow-lg hover:border-teal-200 hover:shadow-xl"
            }`}
            onClick={() => handleSelectUserType("partner")}
          >
            {selectedUserType === "partner" ? (
              <div className="absolute right-5 top-5 rounded-full bg-teal-500 p-2 text-white shadow-lg">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            ) : null}

            <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-teal-500 to-cyan-600 p-4 text-white md:mb-6 md:h-18 md:w-18 md:p-5">
              <Stethoscope className="h-9 w-9" />
            </div>
            <h3 className="mb-3 text-2xl font-light text-slate-900 md:text-4xl">I&apos;m a Partner</h3>
            <p className="mb-5 text-slate-600">
              I&apos;m joining as an expert, brand, or influencer to contribute to the Wolistic ecosystem.
            </p>
            <ul className="space-y-2.5 text-sm text-slate-700">
              <li>Offer services, expertise, products, or wellness content</li>
              <li>Reach clients and communities aligned with your work</li>
              <li>Build a professional or commercial presence on the platform</li>
            </ul>
          </Card>
        </div>

        {selectedUserType === "partner" ? (
          <div className="mt-5 rounded-[1.75rem] border border-teal-200 bg-white/90 p-4 shadow-xl shadow-teal-100/50 md:mt-6 md:rounded-[2rem] md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-teal-700">Partner Profile</p>
                <h3 className="mt-1 text-xl font-light text-slate-900 md:text-2xl">Choose your partner category</h3>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-sm text-teal-700">
                <Building2 className="h-4 w-4" />
                <span>Required for partner onboarding</span>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {partnerSubtypeOptions.map((option) => {
                const isSelected = selectedUserSubtype === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedUserSubtype(option.value)}
                    className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                      isSelected
                        ? "border-teal-500 bg-teal-50 shadow-md shadow-teal-100"
                        : "border-slate-200 bg-white hover:border-teal-200 hover:bg-teal-50/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-medium text-slate-900">{option.label}</p>
                        <p className="mt-2 text-sm text-slate-600">{option.description}</p>
                      </div>
                      {isSelected ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-teal-600" /> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        {error ? <p className="mt-5 text-center text-sm text-red-600">{error}</p> : null}

        <div
          className={`mt-6 text-center ${
            compact
              ? "border-t border-emerald-200/70 pt-4"
              : "sticky bottom-0 border-t border-emerald-200/70 bg-white/80 px-1 pb-1 pt-4 backdrop-blur-sm md:static md:mt-8 md:border-0 md:bg-transparent md:px-0 md:pb-0 md:pt-0"
          }`}
        >
          <Button onClick={() => void handleSubmit()} disabled={isDisabled} size="lg" className="w-full rounded-full px-8 py-6 text-base md:w-auto md:px-12">
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
          {!selectedUserType ? (
            <p className="mt-3 text-sm text-slate-500">Please select a profile type to continue.</p>
          ) : null}
          {selectedUserType === "partner" && !selectedUserSubtype ? (
            <p className="mt-3 text-sm text-slate-500">Select a partner category before continuing.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}