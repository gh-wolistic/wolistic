"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  ShoppingBag,
  Heart,
  BarChart3,
  Clock,
  Shield,
  ArrowRight,
  Sparkles,
  Brain,
  Smartphone,
  Monitor,
  CheckCircle2,
  Zap,
  MessageSquare,
  Calendar,
  TrendingUp,
  Award,
  Globe,
  Megaphone,
  HandCoins,
  Building2,
  GraduationCap,
  ChevronDown,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OpenAuthButton } from "@/components/auth/OpenAuthButton";

export default function PartnersPage() {
  const [showProfessionalPricing, setShowProfessionalPricing] = useState(false);
  const [showBrandPricing, setShowBrandPricing] = useState(false);
  const [activeSection, setActiveSection] = useState("professionals");

  const sectionLinks = [
    { label: "Professionals", target: "professionals" },
    { label: "Brands", target: "brands" },
    { label: "Wellness Centers", target: "wellness-centers" },
    { label: "Influencers", target: "influencers" },
    { label: "Certificate Providers", target: "certificate-providers" },
  ];

  useEffect(() => {
    const sectionIds = sectionLinks.map((link) => link.target);

    const updateActiveSection = () => {
      const offset = 180;

      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) {
          continue;
        }

        const rect = el.getBoundingClientRect();
        if (rect.top <= offset && rect.bottom >= offset) {
          setActiveSection(id);
          return;
        }
      }

      // Fallback so the last section gets highlighted near the bottom.
      const lastId = sectionIds[sectionIds.length - 1];
      const pageBottom = window.innerHeight + window.scrollY;
      if (pageBottom >= document.body.offsetHeight - 80) {
        setActiveSection(lastId);
      }
    };

    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
    };
  }, []);

  return (
    <div className="w-full">
      {/* ━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden bg-linear-to-br from-indigo-50 via-purple-50 to-pink-50 py-16 lg:py-28 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-100 w-100 rounded-full bg-indigo-400/10 blur-[100px]" />
          <div className="absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-purple-400/10 blur-[80px]" />
        </div>

        <div className="container relative z-10 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-5 border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-200">
              <Sparkles size={14} className="mr-1.5" />
              Wolistic Partner Ecosystem
            </Badge>

            <h1 className="mb-6 text-4xl font-bold tracking-tight lg:text-[3.25rem] lg:leading-[1.1]">
              Grow with{" "}
              <span className="bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-300 dark:to-purple-300">
                partner tools
              </span>{" "}
              &amp; a thriving wellness network
            </h1>

            <p className="mb-10 text-lg leading-relaxed text-muted-foreground dark:text-slate-200/80 lg:text-xl">
              Whether you&apos;re a wellness professional, brand, wellness
              center, influencer, or certificate provider — Wolistic gives
              you a verified marketplace, operational tools, and a growing
              community to{" "}
              <span className="font-medium text-foreground dark:text-white">
                scale your impact and revenue.
              </span>
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <OpenAuthButton
                size="lg"
                className="bg-linear-to-r from-indigo-500 to-purple-600 px-8 text-white shadow-lg shadow-indigo-500/25"
              >
                Join as a Partner
                <ArrowRight size={18} className="ml-2" />
              </OpenAuthButton>
            </div>

            {/* Trust stats */}
            <div className="mx-auto mt-12 flex flex-wrap items-center justify-center gap-8 border-t border-indigo-200/50 pt-8 dark:border-white/10">
              {[
                { value: "2,000+", label: "Partners onboarded" },
                { value: "6 types", label: "Of partner categories" },
                { value: "50K+", label: "End users reached" },
                { value: "4.9/5", label: "Partner satisfaction" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ USP STRIP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="border-b border-border bg-background py-10 dark:bg-slate-950/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
            {[
              {
                icon: <Sparkles size={24} />,
                title: "Built for Growth",
                desc: "Structured tools for visibility, bookings, analytics, and day-to-day partner operations that help you scale with clarity.",
              },
              {
                icon: <Shield size={24} />,
                title: "Verified & Trusted",
                desc: "Every partner is vetted and verified. Credentials, quality badges, and transparent reviews build instant trust.",
              },
              {
                icon: <Smartphone size={24} />,
                title: "Desktop, Mobile & App-Ready",
                desc: "Your dashboard works seamlessly on desktop and mobile — with a native app coming soon for all partner types.",
              },
            ].map((u) => (
              <div key={u.title} className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 text-white shadow-sm">
                  {u.icon}
                </div>
                <div>
                  <h3 className="font-semibold">{u.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground dark:text-slate-300">
                    {u.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ SECTION NAV ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <nav className="sticky top-20 z-40 border-b border-indigo-200/60 bg-indigo-50/90 shadow-sm backdrop-blur-md dark:border-indigo-500/20 dark:bg-indigo-950/70">
        <div className="container mx-auto flex items-center justify-center gap-2 overflow-x-auto px-4 py-3 sm:gap-4 sm:px-6 lg:px-8">
          {sectionLinks.map((link) => (
            <button
              key={link.target}
              onClick={() => {
                setActiveSection(link.target);
                document
                  .getElementById(link.target)
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                activeSection === link.target
                  ? "border-indigo-500 bg-indigo-600 text-white shadow-sm dark:border-indigo-300 dark:bg-indigo-400 dark:text-slate-950"
                  : "border-indigo-200/80 bg-white/70 hover:border-indigo-400 hover:bg-indigo-100 hover:text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-900/40 dark:hover:border-indigo-400 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-200"
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ━━━ WELLNESS PROFESSIONALS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="professionals" className="scroll-mt-32 py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <Badge className="mb-4 dark:bg-indigo-500/15 dark:text-indigo-200">
              <Users size={14} className="mr-1.5" />
              For Wellness Professionals
            </Badge>
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
              Manage more clients, spend less time on admin
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground dark:text-slate-300">
              Certified trainers, nutritionists, therapists, life coaches,
              group fitness trainers, and ZUMBA instructors — our platform
              tools let you serve more clients without burning out.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Sparkles size={24} />,
                title: "Structured Client Plans",
                desc: "Create routines, workout plans, and nutrition guidance around client goals with review-friendly workflows and clear delivery steps.",
                accent: "from-indigo-500 to-purple-500",
              },
              {
                icon: <MessageSquare size={24} />,
                title: "Smart Follow-Ups",
                desc: "Manage timely check-ins, progress prompts, and client communication from one place so every follow-up stays intentional.",
                accent: "from-purple-500 to-pink-500",
              },
              {
                icon: <Calendar size={24} />,
                title: "Scheduling & Calendar",
                desc: "Automated booking, rescheduling, and reminders. Syncs with your calendar so there are zero double-bookings.",
                accent: "from-pink-500 to-rose-500",
              },
              {
                icon: <BarChart3 size={24} />,
                title: "Client Progress Tracking",
                desc: "Visual dashboards that show each client's journey — measurements, goals, milestones — all in one place.",
                accent: "from-rose-500 to-orange-500",
              },
              {
                icon: <Clock size={24} />,
                title: "Time Saved Per Client",
                desc: "Templates, reminders, and centralized workflows reduce repetitive admin so you can spend more time on care.",
                accent: "from-orange-500 to-amber-500",
              },
              {
                icon: <TrendingUp size={24} />,
                title: "Grow Your Practice",
                desc: "Get discovered by new clients through verified discovery, strong profiles, and platform trust signals that build credibility.",
                accent: "from-amber-500 to-yellow-500",
              },
            ].map((f) => (
              <Card
                key={f.title}
                className="group border-border bg-background p-6 transition-all hover:border-indigo-200 hover:shadow-md dark:bg-slate-950/60 dark:border-slate-800 dark:hover:border-indigo-800"
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-linear-to-br ${f.accent} text-white shadow-sm`}
                >
                  {f.icon}
                </div>
                <h3 className="mb-2 font-semibold">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground dark:text-slate-300">
                  {f.desc}
                </p>
              </Card>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <OpenAuthButton
              size="lg"
              className="bg-linear-to-r from-indigo-500 to-purple-600 px-8 text-white shadow-sm"
            >
              Join as a Professional
              <ArrowRight size={18} className="ml-2" />
            </OpenAuthButton>
            <p className="mt-3 text-sm text-muted-foreground dark:text-slate-400">
              Zero commission on 1-on-1 sessions &bull; Partner tools included
            </p>
          </div>
        </div>
      </section>

      {/* ━━━ COMMISSION TRANSPARENCY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <Badge className="mb-4 dark:bg-indigo-500/15 dark:text-indigo-200">
              <HandCoins size={14} className="mr-1.5" />
              Transparent Pricing
            </Badge>
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
              Your earnings, your rules
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground dark:text-slate-300">
              We believe professionals should keep what they earn. Our model
              is simple and transparent — no surprises.
            </p>
            <button
              onClick={() => setShowProfessionalPricing(!showProfessionalPricing)}
              className="mx-auto mt-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-5 py-2.5 text-sm font-medium text-indigo-700 transition-colors hover:bg-indigo-100 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
            >
              {showProfessionalPricing ? "Hide" : "View"} Pricing Details
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${showProfessionalPricing ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {showProfessionalPricing && (
            <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-3">
              {[
                {
                title: "1-on-1 Sessions",
                commission: "0%",
                highlight: true,
                desc: "Personal training, therapy, nutrition consults, coaching — keep every rupee. No platform fee, ever.",
                tag: "Zero Commission",
              },
              {
                title: "Holistic Programs",
                commission: "Small fee",
                highlight: false,
                desc: "Group workshops, multi-week wellness programs, and retreats. A small platform fee helps us market and facilitate.",
                tag: "Shared Growth",
              },
              {
                title: "Corporate Programs",
                commission: "Revenue share",
                highlight: false,
                desc: "Enterprise wellness contracts sourced and managed by Wolistic. We bring the clients, you deliver the expertise.",
                tag: "We Bring Clients",
              },
              ].map((tier) => (
              <Card
                key={tier.title}
                className={`relative flex flex-col p-8 dark:bg-slate-950/60 dark:border-slate-800 ${
                  tier.highlight
                    ? "border-2 border-indigo-500 shadow-lg shadow-indigo-500/10"
                    : "border-border"
                }`}
              >
                {tier.highlight && (
                  <Badge className="absolute right-4 top-4 bg-indigo-500 text-white">
                    Best Value
                  </Badge>
                )}
                <Badge
                  variant="outline"
                  className="mb-4 w-fit text-xs dark:border-slate-700"
                >
                  {tier.tag}
                </Badge>
                <h3 className="mb-1 text-lg font-bold">{tier.title}</h3>
                <p className="mb-4 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {tier.commission}
                </p>
                <Separator className="mb-4" />
                <p className="flex-1 text-sm leading-relaxed text-muted-foreground dark:text-slate-300">
                  {tier.desc}
                </p>
              </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ━━━ BRANDS & SERVICE PROVIDERS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="brands" className="scroll-mt-32 bg-slate-50 py-20 lg:py-28 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="max-w-lg">
              <Badge className="mb-4 dark:bg-teal-500/15 dark:text-teal-200">
                <ShoppingBag size={14} className="mr-1.5" />
                For Brands &amp; Service Providers
              </Badge>
              <h2 className="mb-6 text-3xl font-bold lg:text-4xl">
                Reach a wellness-focused audience that converts
              </h2>
              <p className="mb-8 text-lg text-muted-foreground dark:text-slate-300">
                List your products and services on a platform built for
                wellness-conscious consumers. Our curated marketplace
                connects quality brands with verified buyers who
                care about authenticity.
              </p>
              <div className="space-y-4">
                {[
                  "Curated product & service listings with quality verification",
                  "Direct connection to health-conscious consumers",
                  "Analytics & engagement insights for every listing",
                  "Collaboration opportunities with wellness influencers",
                  "Quality verification badge for trusted brands",
                  "Featured placement and promotional campaigns",
                ].map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 shrink-0 text-teal-500"
                    />
                    <span className="text-sm dark:text-slate-200">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Brand benefits cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: <Globe size={24} />,
                  title: "Marketplace Visibility",
                  desc: "Get discovered by thousands of wellness-focused users actively looking for quality products.",
                  bg: "bg-teal-50 dark:bg-teal-500/10",
                  fg: "text-teal-600 dark:text-teal-300",
                },
                {
                  icon: <BarChart3 size={24} />,
                  title: "Performance Analytics",
                  desc: "Track views, clicks, and conversions in real time. Understand what resonates with your audience.",
                  bg: "bg-emerald-50 dark:bg-emerald-500/10",
                  fg: "text-emerald-600 dark:text-emerald-300",
                },
                {
                  icon: <Award size={24} />,
                  title: "Quality Badge",
                  desc: "Our verification seal signals trust and quality to every potential customer who sees your listing.",
                  bg: "bg-cyan-50 dark:bg-cyan-500/10",
                  fg: "text-cyan-600 dark:text-cyan-300",
                },
                {
                  icon: <Megaphone size={24} />,
                  title: "Influencer Collabs",
                  desc: "Connect with wellness influencers on our platform for authentic, values-aligned promotions.",
                  bg: "bg-blue-50 dark:bg-blue-500/10",
                  fg: "text-blue-600 dark:text-blue-300",
                },
              ].map((c) => (
                <Card
                  key={c.title}
                  className="border-border bg-white p-5 dark:bg-slate-950/60 dark:border-slate-800"
                >
                  <div
                    className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${c.bg} ${c.fg}`}
                  >
                    {c.icon}
                  </div>
                  <h4 className="mb-1 text-sm font-semibold">{c.title}</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground dark:text-slate-400">
                    {c.desc}
                  </p>
                </Card>
              ))}
            </div>
          </div>

          {/* Brand Pricing */}
          <div className="mt-16 text-center">
            <h3 className="mb-3 text-2xl font-bold">Brand Partnership Plans</h3>
            <p className="mx-auto mb-6 max-w-lg text-muted-foreground dark:text-slate-400">
              Flexible plans that grow with your brand. Start free, scale when you&rsquo;re ready.
            </p>
            <button
              onClick={() => setShowBrandPricing(!showBrandPricing)}
              className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-5 py-2.5 text-sm font-medium text-teal-700 transition-colors hover:bg-teal-100 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300 dark:hover:bg-teal-500/20"
            >
              {showBrandPricing ? "Hide" : "View"} Pricing Details
              <ChevronDown
                size={16}
                className={`transition-transform duration-200 ${showBrandPricing ? "rotate-180" : ""}`}
              />
            </button>
          </div>

          {showBrandPricing && (
          <div className="mx-auto mt-10 grid max-w-5xl items-start gap-6 lg:grid-cols-3">
            {[
              {
                name: "Starter",
                price: "Free",
                period: "",
                desc: "Perfect for brands testing the waters",
                features: [
                  "Basic product listing",
                  "Standard visibility",
                  "Monthly performance report",
                  "Community support",
                ],
                popular: false,
                gradient: "",
              },
              {
                name: "Growth",
                price: "₹9,999",
                period: "/month",
                desc: "For brands ready to scale",
                features: [
                  "Everything in Starter",
                  "Featured listing placement",
                  "Advanced analytics dashboard",
                  "Influencer collaboration access",
                  "Priority support",
                ],
                popular: true,
                gradient: "bg-linear-to-br from-teal-500 to-emerald-500",
              },
              {
                name: "Enterprise",
                price: "Custom",
                period: "",
                desc: "Tailored for large brands",
                features: [
                  "Everything in Growth",
                  "Dedicated account manager",
                  "Custom promotional campaigns",
                  "API integration access",
                  "Quarterly strategy reviews",
                ],
                popular: false,
                gradient: "",
              },
            ].map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col overflow-hidden rounded-2xl border bg-white dark:bg-slate-950/60 ${
                  tier.popular
                    ? "border-teal-500 shadow-xl shadow-teal-500/15 ring-1 ring-teal-500/20 lg:scale-105 lg:z-10"
                    : "border-border dark:border-slate-800"
                }`}
              >
                {/* Gradient header for popular tier */}
                {tier.popular ? (
                  <div className={`${tier.gradient} px-8 py-5 text-white`}>
                    <Badge className="mb-2 bg-white/20 text-white backdrop-blur-sm">
                      Most Popular
                    </Badge>
                    <h4 className="text-xl font-bold">{tier.name}</h4>
                    <p className="mt-1 text-sm text-white/80">{tier.desc}</p>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold">{tier.price}</span>
                      <span className="text-white/70">{tier.period}</span>
                    </div>
                  </div>
                ) : (
                  <div className="px-8 pt-8 pb-0">
                    <h4 className="text-xl font-bold">{tier.name}</h4>
                    <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">{tier.desc}</p>
                    <div className="mt-3 flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold">{tier.price}</span>
                      {tier.period && (
                        <span className="text-muted-foreground dark:text-slate-400">{tier.period}</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-1 flex-col px-8 py-6">
                  <Separator className="mb-6" />
                  <ul className="mb-8 flex-1 space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <CheckCircle2
                          size={16}
                          className="mt-0.5 shrink-0 text-teal-500"
                        />
                        <span className="dark:text-slate-200">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <OpenAuthButton
                    className={`w-full ${
                      tier.popular
                        ? "bg-linear-to-r from-teal-500 to-emerald-500 text-white shadow-sm"
                        : ""
                    }`}
                    variant={tier.popular ? "default" : "outline"}
                  >
                    {tier.price === "Custom" ? "Contact Sales" : "Get Started"}
                  </OpenAuthButton>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* ━━━ WELLNESS CENTERS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="wellness-centers" className="scroll-mt-32 py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="max-w-lg">
              <Badge className="mb-4 dark:bg-emerald-500/15 dark:text-emerald-200">
                <Building2 size={14} className="mr-1.5" />
                For Wellness Centers
              </Badge>
              <h2 className="mb-6 text-3xl font-bold lg:text-4xl">
                Fill your schedule with quality bookings
              </h2>
              <p className="mb-8 text-lg text-muted-foreground dark:text-slate-300">
                Yoga studios, gyms, spas, retreat centers, and holistic
                clinics &mdash; list your center on Wolistic and let clients
                discover, book, and review your services. Online bookings
                are coming soon to make it even easier.
              </p>
              <div className="space-y-4">
                {[
                  "Get discovered by wellness-conscious clients nearby",
                  "Showcase your services, team, and facilities",
                  "Client reviews and verified quality badge",
                  "Online booking system coming soon",
                  "Analytics on profile views, inquiries, and engagement",
                  "AI-powered recommendations surface your center to the right audience",
                ].map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 shrink-0 text-emerald-500"
                    />
                    <span className="text-sm dark:text-slate-200">{f}</span>
                  </div>
                ))}
              </div>

              <OpenAuthButton
                className="mt-8 bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-sm"
              >
                List Your Center
                <ArrowRight size={18} className="ml-2" />
              </OpenAuthButton>
              <p className="mt-3 text-sm text-muted-foreground dark:text-slate-400">
                Free listing &bull; Online bookings coming soon
              </p>
            </div>

            {/* Benefit cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: <Globe size={24} />,
                  title: "Local Discovery",
                  desc: "Appear in location-based search results and discovery surfaces for nearby wellness seekers.",
                  bg: "bg-emerald-50 dark:bg-emerald-500/10",
                  fg: "text-emerald-600 dark:text-emerald-300",
                },
                {
                  icon: <Calendar size={24} />,
                  title: "Booking System",
                  desc: "Online appointment booking is on the roadmap — when it launches, your center will be ready from day one.",
                  bg: "bg-teal-50 dark:bg-teal-500/10",
                  fg: "text-teal-600 dark:text-teal-300",
                },
                {
                  icon: <Award size={24} />,
                  title: "Verified Badge",
                  desc: "Stand out with a quality-verified badge that tells clients your center meets Wolistic standards.",
                  bg: "bg-cyan-50 dark:bg-cyan-500/10",
                  fg: "text-cyan-600 dark:text-cyan-300",
                },
                {
                  icon: <BarChart3 size={24} />,
                  title: "Engagement Analytics",
                  desc: "Track profile views, inquiry trends, and client engagement to optimize your listing.",
                  bg: "bg-sky-50 dark:bg-sky-500/10",
                  fg: "text-sky-600 dark:text-sky-300",
                },
              ].map((c) => (
                <Card
                  key={c.title}
                  className="border-border bg-background p-5 dark:bg-slate-950/60 dark:border-slate-800"
                >
                  <div
                    className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${c.bg} ${c.fg}`}
                  >
                    {c.icon}
                  </div>
                  <h4 className="mb-1 text-sm font-semibold">{c.title}</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground dark:text-slate-400">
                    {c.desc}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ WELLNESS INFLUENCERS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="influencers" className="scroll-mt-32 bg-slate-50 py-20 lg:py-28 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Cards first on desktop (right visual) — reorder with order */}
            <div className="grid gap-4 sm:grid-cols-2 lg:order-2">
              {[
                {
                  icon: <Shield size={24} />,
                  title: "Ethical Platform",
                  desc: "No dark patterns or hidden fees. Honest monetization that respects your audience's trust.",
                  bg: "bg-purple-50 dark:bg-purple-500/10",
                  fg: "text-purple-600 dark:text-purple-300",
                },
                {
                  icon: <HandCoins size={24} />,
                  title: "Transparent Earnings",
                  desc: "Clear revenue models — affiliate commissions, sponsored content, and brand partnerships with full transparency.",
                  bg: "bg-pink-50 dark:bg-pink-500/10",
                  fg: "text-pink-600 dark:text-pink-300",
                },
                {
                  icon: <Users size={24} />,
                  title: "Community Access",
                  desc: "Connect with certified professionals and like-minded creators for collaborations and knowledge sharing.",
                  bg: "bg-indigo-50 dark:bg-indigo-500/10",
                  fg: "text-indigo-600 dark:text-indigo-300",
                },
                {
                  icon: <TrendingUp size={24} />,
                  title: "Audience Insights",
                  desc: "Understand who engages with your content with detailed analytics. Grow authentically with data.",
                  bg: "bg-rose-50 dark:bg-rose-500/10",
                  fg: "text-rose-600 dark:text-rose-300",
                },
              ].map((c) => (
                <Card
                  key={c.title}
                  className="border-border bg-background p-5 dark:bg-slate-950/60 dark:border-slate-800"
                >
                  <div
                    className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${c.bg} ${c.fg}`}
                  >
                    {c.icon}
                  </div>
                  <h4 className="mb-1 text-sm font-semibold">{c.title}</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground dark:text-slate-400">
                    {c.desc}
                  </p>
                </Card>
              ))}
            </div>

            {/* Text */}
            <div className="max-w-lg lg:order-1">
              <Badge className="mb-4 dark:bg-purple-500/15 dark:text-purple-200">
                <Heart size={14} className="mr-1.5" />
                For Wellness Influencers
              </Badge>
              <h2 className="mb-6 text-3xl font-bold lg:text-4xl">
                Share authentic wellness, earn transparently
              </h2>
              <p className="mb-8 text-lg text-muted-foreground dark:text-slate-300">
                If you&apos;re an educator, creator, or advocate passionate about
                genuine wellness — Wolistic gives you the tools to monetize your
                expertise without compromising your values. No hidden agendas,
                no pushy promotions — just authentic collaboration.
              </p>
              <div className="space-y-4">
                {[
                  "Collaborate with verified brands and professionals",
                  "Transparent monetization — see exactly what you earn",
                  "Values-first: we reject products that don't meet quality standards",
                  "Content tools and audience analytics to grow sustainably",
                ].map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 shrink-0 text-purple-500"
                    />
                    <span className="text-sm dark:text-slate-200">{f}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <OpenAuthButton
                className="mt-8 bg-linear-to-r from-purple-500 to-pink-600 text-white shadow-sm"
              >
                Join as an Influencer
                <ArrowRight size={18} className="ml-2" />
              </OpenAuthButton>
              <p className="mt-3 text-sm text-muted-foreground dark:text-slate-400">
                Ethical collabs &bull; Transparent earnings &bull; Values-first
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ CERTIFICATE PROVIDERS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="certificate-providers" className="scroll-mt-32 py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="max-w-lg">
              <Badge className="mb-4 dark:bg-amber-500/15 dark:text-amber-200">
                <GraduationCap size={14} className="mr-1.5" />
                For Certificate Providers
              </Badge>
              <h2 className="mb-6 text-3xl font-bold lg:text-4xl">
                Certify the next generation of wellness professionals
              </h2>
              <p className="mb-8 text-lg text-muted-foreground dark:text-slate-300">
                If you offer accredited wellness certifications &mdash;
                fitness training, yoga teacher training, nutrition
                diplomas, life coaching credentials &mdash; partner with
                Wolistic to reach thousands of aspiring professionals
                who need your programs.
              </p>
              <div className="space-y-4">
                {[
                  "List your certification programs to a targeted audience",
                  "Reach aspiring wellness professionals ready to upskill",
                  "Verified accreditation badge for credibility",
                  "Lead generation and enrollment analytics",
                  "Co-marketing opportunities with Wolistic",
                ].map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 shrink-0 text-amber-500"
                    />
                    <span className="text-sm dark:text-slate-200">{f}</span>
                  </div>
                ))}
              </div>

              <OpenAuthButton
                className="mt-8 bg-linear-to-r from-amber-500 to-orange-500 text-white shadow-sm"
              >
                Partner as Certifier
                <ArrowRight size={18} className="ml-2" />
              </OpenAuthButton>
              <p className="mt-3 text-sm text-muted-foreground dark:text-slate-400">
                Reach verified audiences &bull; Co-marketing included
              </p>
            </div>

            {/* Benefit cards */}
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  icon: <Users size={24} />,
                  title: "Targeted Audience",
                  desc: "Reach thousands of wellness enthusiasts and professionals looking to earn or upgrade certifications.",
                  bg: "bg-amber-50 dark:bg-amber-500/10",
                  fg: "text-amber-600 dark:text-amber-300",
                },
                {
                  icon: <Award size={24} />,
                  title: "Accreditation Badge",
                  desc: "Display your verified accreditation status so learners know they’re choosing a trusted provider.",
                  bg: "bg-orange-50 dark:bg-orange-500/10",
                  fg: "text-orange-600 dark:text-orange-300",
                },
                {
                  icon: <BarChart3 size={24} />,
                  title: "Enrollment Analytics",
                  desc: "Track interest, inquiries, and enrollments. Understand what programs resonate most.",
                  bg: "bg-yellow-50 dark:bg-yellow-500/10",
                  fg: "text-yellow-600 dark:text-yellow-300",
                },
                {
                  icon: <Megaphone size={24} />,
                  title: "Co-Marketing",
                  desc: "Joint campaigns, featured placement, and cross-promotion to Wolistic’s growing user base.",
                  bg: "bg-red-50 dark:bg-red-500/10",
                  fg: "text-red-600 dark:text-red-300",
                },
              ].map((c) => (
                <Card
                  key={c.title}
                  className="border-border bg-background p-5 dark:bg-slate-950/60 dark:border-slate-800"
                >
                  <div
                    className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${c.bg} ${c.fg}`}
                  >
                    {c.icon}
                  </div>
                  <h4 className="mb-1 text-sm font-semibold">{c.title}</h4>
                  <p className="text-xs leading-relaxed text-muted-foreground dark:text-slate-400">
                    {c.desc}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ DASHBOARD PREVIEW (CROSS-DEVICE) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left — text */}
            <div className="max-w-lg">
              <Badge className="mb-4 dark:bg-indigo-500/15 dark:text-indigo-200">
                <Monitor size={14} className="mr-1.5" />
                Your Dashboard
              </Badge>
              <h2 className="mb-6 text-3xl font-bold lg:text-4xl">
                One dashboard, every device
              </h2>
              <p className="mb-8 text-lg text-muted-foreground dark:text-slate-300">
                Manage your entire practice from anywhere. Fully responsive
                on desktop and mobile, with a native app on the way. Clients,
                schedules, plans, and insights — always at your fingertips.
              </p>
              <div className="space-y-4">
                {[
                  "Desktop-optimized with full analytics",
                  "Mobile-ready for on-the-go management",
                  "Native app coming soon (iOS & Android)",
                  "Insights and recommendations built in",
                  "Real-time client notifications and updates",
                ].map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <CheckCircle2
                      size={18}
                      className="mt-0.5 shrink-0 text-indigo-500"
                    />
                    <span className="text-sm dark:text-slate-200">{f}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — device mockup */}
            <div className="relative">
              <div className="absolute -inset-6 rounded-3xl bg-linear-to-br from-indigo-500/10 to-purple-500/10 blur-2xl dark:from-indigo-500/5 dark:to-purple-500/5" />
              <div className="relative flex items-end gap-6 justify-center">
                {/* Desktop mock */}
                <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex items-center gap-2 border-b border-border bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                    <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                    <div className="ml-3 h-5 flex-1 rounded bg-border/50 dark:bg-slate-700/50" />
                  </div>
                  <div className="p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
                        <div className="mt-1.5 h-3 w-20 rounded bg-slate-100 dark:bg-slate-800" />
                      </div>
                      <div className="h-7 w-20 rounded-lg bg-indigo-100 dark:bg-indigo-500/15" />
                    </div>
                    <div className="mb-4 grid grid-cols-2 gap-3">
                      {[
                        { label: "Active Clients", val: "48" },
                        { label: "This Week", val: "12 sessions" },
                      ].map((c) => (
                        <div
                          key={c.label}
                          className="rounded-xl border border-border bg-slate-50/50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
                        >
                          <p className="text-[10px] text-muted-foreground">{c.label}</p>
                          <p className="mt-1 text-base font-bold text-indigo-600 dark:text-indigo-400">
                            {c.val}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      {["Client check-in sent", "New booking: 2:00 PM", "Plan ready to review"].map(
                        (item) => (
                          <div
                            key={item}
                            className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] dark:bg-slate-800/50"
                          >
                            <div className="h-2 w-2 rounded-full bg-indigo-400" />
                            <span className="text-muted-foreground">{item}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                {/* Mobile mock */}
                <div className="hidden w-36 overflow-hidden rounded-2xl border-2 border-slate-300 bg-white shadow-lg sm:block dark:border-slate-600 dark:bg-slate-900">
                  <div className="flex items-center justify-center border-b border-border bg-slate-50 py-1.5 dark:border-slate-700 dark:bg-slate-800/50">
                    <div className="h-1.5 w-10 rounded-full bg-slate-300 dark:bg-slate-600" />
                  </div>
                  <div className="p-3">
                    <div className="mb-3 h-3 w-16 rounded bg-slate-200 dark:bg-slate-700" />
                    <div className="mb-2 rounded-lg bg-indigo-50 p-2 dark:bg-indigo-500/10">
                      <p className="text-[8px] text-muted-foreground">Active</p>
                      <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">48</p>
                    </div>
                    <div className="space-y-1.5">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="h-5 rounded bg-slate-100 dark:bg-slate-800"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ WHY PARTNER WITH WOLISTIC ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-slate-50 py-20 lg:py-28 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <Badge className="mb-4 dark:bg-indigo-500/15 dark:text-indigo-200">
              The Wolistic Difference
            </Badge>
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
              Why 2,000+ professionals chose us
            </h2>
          </div>

          <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Sparkles size={24} />,
                title: "Tools That Support Care",
                desc: "Plan management, scheduling, and follow-up workflows help you run a stronger practice without extra operational drag.",
                gradient: "from-indigo-500 to-purple-600",
              },
              {
                icon: <Clock size={24} />,
                title: "Reclaim Your Time",
                desc: "Automated scheduling, reminders, and client comms free you up to do what you do best.",
                gradient: "from-purple-500 to-pink-600",
              },
              {
                icon: <Shield size={24} />,
                title: "Ethical First",
                desc: "No dark patterns, no pressure tactics. Honest monetization with a values-first approach.",
                gradient: "from-pink-500 to-rose-600",
              },
              {
                icon: <Users size={24} />,
                title: "Verified Community",
                desc: "Every professional is credential-checked. Connect with a network you can trust.",
                gradient: "from-rose-500 to-orange-600",
              },
              {
                icon: <BarChart3 size={24} />,
                title: "Growth Insights",
                desc: "Understand your audience and practice with clear, actionable analytics and dashboards.",
                gradient: "from-orange-500 to-amber-600",
              },
              {
                icon: <Heart size={24} />,
                title: "Client Trust",
                desc: "Verified badge and platform reputation attract quality clients who value real expertise.",
                gradient: "from-amber-500 to-yellow-600",
              },
            ].map((b) => (
              <div key={b.title} className="flex gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-linear-to-br ${b.gradient} text-white`}
                >
                  {b.icon}
                </div>
                <div>
                  <h4 className="mb-1 font-semibold">{b.title}</h4>
                  <p className="text-sm text-muted-foreground dark:text-slate-400">
                    {b.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ FINAL CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden bg-slate-950 py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 bottom-0 h-100 w-100 rounded-full bg-indigo-500/15 blur-[100px]" />
          <div className="absolute -right-32 top-0 h-100 w-100 rounded-full bg-purple-500/10 blur-[100px]" />
        </div>
        <div className="container relative z-10 mx-auto px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
            Ready to grow with the right platform on your side?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-300">
            Join thousands of wellness professionals, brands, and influencers
            using Wolistic to build stronger visibility, operations, and trust — with zero
            commission on 1-on-1 sessions.
          </p>

          <OpenAuthButton
            size="lg"
            className="bg-linear-to-r from-indigo-500 to-purple-600 px-8 text-white shadow-lg shadow-indigo-500/25"
          >
            Join as a Partner
            <ArrowRight size={18} className="ml-2" />
          </OpenAuthButton>

          <p className="mt-6 text-sm text-slate-500">
            Get started in minutes &bull; Zero commission on 1-on-1 &bull; Partner
            tools included
          </p>
        </div>
      </section>
    </div>
  );
}