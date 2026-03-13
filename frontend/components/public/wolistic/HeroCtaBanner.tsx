"use client";

import React from "react";
import { ArrowRight, Sparkles, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeroCtaBannerProps = {
  query: string;
  onYes: () => void;
  onNo: () => void;
};

export function HeroCtaBanner({ query, onYes, onNo }: HeroCtaBannerProps) {
  const trimmedQuery = query.trim();

  return (
    <section className="relative overflow-hidden border-b border-border bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/40">
      <div className="absolute top-12 right-16 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:bg-emerald-900 dark:opacity-25" />
      <div
        className="absolute bottom-10 left-12 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:bg-teal-900 dark:opacity-25"
        style={{ animationDelay: "1.5s" }}
      />

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 shadow-sm border border-border text-sm text-emerald-700 dark:bg-slate-900/70 dark:text-emerald-300">
              <Sparkles size={16} />
              Your Wolistic journey starts here
            </div>
            <div className="space-y-3">
              <h1 className="text-4xl lg:text-5xl font-semibold leading-tight tracking-tight">
                Need an expert to help you with your journey?
              </h1>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={onYes}
                className="bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 h-12 px-7 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                Yes, get an expert review
                <ArrowRight size={18} className="ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onNo}
                className="h-12 px-7 rounded-xl border-2 border-border hover:bg-background/70"
              >
                No, I&apos;ll browse myself
              </Button>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="relative rounded-3xl border border-border bg-white/70 shadow-xl backdrop-blur-sm dark:bg-slate-900/80">
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="font-semibold">
                      Focus on your goals while our certified experts design a personalized plan just for you.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="relative rounded-2xl border border-emerald-300 dark:border-emerald-500/60 p-3 bg-linear-to-br from-emerald-50/90 to-teal-50/80 dark:from-emerald-950/40 dark:to-teal-950/30 shadow-lg shadow-emerald-200/40 dark:shadow-emerald-900/30 ring-1 ring-emerald-200/50 dark:ring-emerald-400/20">
                    <p className="font-medium text-emerald-900 dark:text-emerald-200">Expert Review</p>
                    <p className="text-emerald-700/90 dark:text-emerald-300/80">
                      Share your query — experts validate, suggest, guide, and support you throughout your journey.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/40 p-3 bg-white/50 dark:bg-slate-950/30 opacity-60 dark:opacity-70">
                    <p className="font-medium text-muted-foreground">Self-Browse</p>
                    <p className="text-muted-foreground/70">Time-consuming with too many options to sort through.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
