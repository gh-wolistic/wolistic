"use client";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

type LandingDestination = "professionals" | "partners" | "products";

type FinalCTAProps = {
  onNavigate?: (destination: LandingDestination) => void;
};

export function FinalCTA({ onNavigate }: FinalCTAProps) {
  return (
    <section className="relative overflow-hidden py-16 lg:py-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-50 via-slate-50 to-teal-100 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/40" />
        <div className="absolute inset-0 opacity-60 [background:radial-gradient(50%_50%_at_50%_0%,rgba(16,185,129,0.25),transparent_70%)]" />
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-emerald-200/50 blur-3xl dark:bg-emerald-900/40" />
        <div className="absolute -bottom-20 right-10 h-64 w-64 rounded-full bg-teal-200/50 blur-3xl dark:bg-teal-900/40" />
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="mb-6 text-3xl lg:text-4xl">Build a Healthier Life with Wolistic</h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands who are transforming their wellness journey through
            trusted guidance and authentic support.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => onNavigate?.("products")}
              className="bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20"
            >
              Explore Wellness
              <ArrowRight size={20} className="ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => onNavigate?.("partners")}
              className="border-emerald-200/70 bg-background/70 backdrop-blur dark:border-emerald-500/40 dark:bg-card/70"
            >
              Join as a Partner
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
