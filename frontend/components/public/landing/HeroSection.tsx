"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, Users, Heart, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import heroMain from "@/assets/hero_main.png";

type PublicDestination = "professionals" | "partners";

type LandingHeroSectionProps = {
  onNavigate?: (destination: PublicDestination) => void;
  onSearch?: (query: string) => Promise<void> | void;
  isSearching?: boolean;
};

const floatingStats = [
  {
    id: "professionals",
    value: "100%",
    label: "Verified Professionals",
    icon: Heart,
    valueClassName: "text-emerald-600",
    iconBgClassName: "bg-emerald-100",
    iconClassName: "text-emerald-600",
    cardClassName: "absolute -left-6 bottom-1/4",
    animationDelay: "0s",
  },
];

const exampleQueries = [
  "Quick weight loss for wedding in 3 months",
  "Post-breakup wellness & fitness journey",
  "Busy parent looking for 15-min daily routines",
  "Depressed due to weight gain",
];

export function LandingHeroSection({ onNavigate, onSearch, isSearching = false }: LandingHeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentExample, setCurrentExample] = useState(0);
  const trimmedSearchQuery = searchQuery.trim();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentExample((prev) => (prev + 1) % exampleQueries.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedSearchQuery || isSearching) {
      return;
    }
    await onSearch?.(trimmedSearchQuery);
  };

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/40"></div>

      <div className="absolute top-20 right-10 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse dark:bg-emerald-900 dark:opacity-25"></div>
      <div
        className="absolute bottom-20 left-10 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse dark:bg-teal-900 dark:opacity-25"
        style={{ animationDelay: "2s" }}
      ></div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8 lg:space-y-10">
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl xl:text-7xl tracking-tight leading-tight">
                <span className="block bg-linear-to-r from-emerald-700 via-teal-600 to-cyan-600 bg-clip-text text-transparent dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-300">
                  Discover <span className="text-emerald-600 dark:text-emerald-300 font-medium">Mind, </span> Body, <span className="text-emerald-600 dark:text-emerald-300 font-medium"> & Diet -</span>
                </span>
                <span className="block mt-2">All in one place.</span>
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
                <span className="text-emerald-600 dark:text-emerald-300 font-medium">AI-powered wellness guidance from verified professionals</span> — <span className="text-emerald-600 dark:text-emerald-300 font-medium">plus discover wellness services, products, and programs</span>.
              </p>
            </div>

            <form onSubmit={handleSearch} className="w-full">
              <div className="relative group">
                <div className="absolute -inset-1 bg-linear-to-r from-emerald-400 to-teal-400 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-300 dark:from-emerald-700 dark:to-teal-700"></div>
                <div className="relative flex gap-2 rounded-2xl border border-border bg-background/90 p-2 shadow-lg backdrop-blur-sm dark:bg-card/90">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                    <Input
                      type="text"
                      placeholder={exampleQueries[currentExample]}
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="pl-12 h-14 text-base border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={!trimmedSearchQuery || isSearching}
                    className="bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 h-14 px-8 rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    {isSearching ? "Searching..." : "Start here"}
                    <ArrowRight size={20} className="ml-2" />
                  </Button>
                </div>
              </div>
            </form>

            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <Button
                size="lg"
                onClick={() => {
                  onNavigate?.("professionals");
                }}
                className="bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700 h-14 px-8 text-base rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <Users size={20} className="mr-2" />
                Find Your Expert
                <ArrowRight size={20} className="ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  onNavigate?.("partners");
                }}
                className="h-14 px-8 text-base rounded-xl border-2 border-border hover:bg-background/70 backdrop-blur-sm"
              >
                Join Wolistic as a Partner
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </div>
          </div>

          <div className="relative lg:block hidden">
            <div className="relative">
              <div className="aspect-5/5 rounded-3xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src={heroMain.src}
                  alt="Wolistic Wellness"
                  className="w-full h-full object-cover"
                />
              </div>

              {floatingStats.map((stat) => (
                <div
                  key={stat.id}
                  className={`${stat.cardClassName} rounded-2xl p-4 shadow-xl border border-border backdrop-blur-sm bg-background/90 dark:bg-card/85 animate-float`}
                  style={{ animationDelay: stat.animationDelay }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${stat.iconBgClassName} flex items-center justify-center`}>
                      <stat.icon className={stat.iconClassName} size={24} />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${stat.valueClassName}`}>{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
