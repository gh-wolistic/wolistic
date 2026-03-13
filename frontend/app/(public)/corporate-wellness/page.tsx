"use client";

import { useState } from "react";
import {
  Building2,
  Users,
  Heart,
  Brain,
  Activity,
  TrendingUp,
  CheckCircle2,
  Target,
  Sparkles,
  BarChart3,
  Headphones,
  Award,
  ArrowRight,
  Play,
  Shield,
  Zap,
  Send,
  ChevronRight,
  Monitor,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

export default function CorporateWellnessPage() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    company: "",
    employees: "",
    phone: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="w-full">
      {/* ━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        {/* Gradient mesh background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-150 w-150 rounded-full bg-emerald-500/20 blur-[128px]" />
          <div className="absolute -bottom-20 right-0 h-125 w-125 rounded-full bg-teal-500/15 blur-[100px]" />
          <div className="absolute left-1/2 top-1/3 h-100 w-100 -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[120px]" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left copy */}
            <div className="max-w-xl space-y-8">
              <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/15">
                <Sparkles size={14} className="mr-1.5" />
                AI-Powered Wellness Platform
              </Badge>

              <h1 className="text-4xl font-bold leading-[1.1] tracking-tight lg:text-[3.5rem]">
                <span className="bg-linear-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  AI-powered
                </span>{" "}
                wellness, delivered by{" "}
                <span className="bg-linear-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                  certified professionals
                </span>
              </h1>

              <p className="text-lg leading-relaxed text-slate-300">
                The only platform that pairs intelligent AI matching with
                verified, certified wellness experts. Personalized programs
                for fitness, nutrition, and mental health &mdash; designed by
                real professionals, scaled by smart technology.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Button
                  size="lg"
                  onClick={() =>
                    document
                      .getElementById("demo-form")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="bg-linear-to-r from-emerald-500 to-teal-500 px-8 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                >
                  Request a Demo
                  <ArrowRight size={18} className="ml-2" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() =>
                    document
                      .getElementById("pricing")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="text-slate-300 hover:text-white"
                >
                  <Play size={16} className="mr-2" />
                  View Plans
                </Button>
              </div>

              {/* Trust stats */}
              <div className="flex flex-wrap gap-8 border-t border-white/10 pt-8">
                {[
                  { value: "500+", label: "Companies" },
                  { value: "2,000+", label: "Certified professionals" },
                  { value: "50K+", label: "Employees served" },
                  { value: "4.9/5", label: "Client rating" },
                ].map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-sm text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Dashboard preview */}
            <div className="hidden lg:block">
              <div className="relative">
                {/* Glow ring */}
                <div className="absolute -inset-4 rounded-3xl bg-linear-to-br from-emerald-500/20 to-cyan-500/20 blur-2xl" />
                <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-sm">
                  {/* Mock browser chrome */}
                  <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                    <div className="h-3 w-3 rounded-full bg-red-400/60" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400/60" />
                    <div className="h-3 w-3 rounded-full bg-green-400/60" />
                    <div className="ml-4 h-6 flex-1 rounded-md bg-white/5 px-3 text-[10px] leading-6 text-slate-500">
                      app.wolistic.com/corporate/dashboard
                    </div>
                  </div>
                  {/* Dashboard placeholder */}
                  <div className="p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <div className="h-4 w-36 rounded bg-white/10" />
                        <div className="mt-2 h-3 w-24 rounded bg-white/5" />
                      </div>
                      <div className="h-8 w-24 rounded-lg bg-emerald-500/20" />
                    </div>
                    {/* Stat cards row */}
                    <div className="mb-4 grid grid-cols-3 gap-3">
                      {[
                        { label: "Active Users", val: "1,247", color: "from-emerald-500/20 to-emerald-600/10" },
                        { label: "Engagement", val: "78%", color: "from-teal-500/20 to-teal-600/10" },
                        { label: "Wellness Score", val: "8.4", color: "from-cyan-500/20 to-cyan-600/10" },
                      ].map((c) => (
                        <div
                          key={c.label}
                          className={`rounded-xl bg-linear-to-br ${c.color} p-4`}
                        >
                          <p className="text-[10px] text-slate-400">{c.label}</p>
                          <p className="mt-1 text-lg font-bold text-white">{c.val}</p>
                        </div>
                      ))}
                    </div>
                    {/* Chart placeholder */}
                    <div className="h-36 rounded-xl border border-white/5 bg-white/2 p-4">
                      <div className="flex h-full items-end gap-2">
                        {[40, 65, 45, 80, 55, 70, 90, 60, 85, 75, 95, 68].map(
                          (h, i) => (
                            <div
                              key={i}
                              className="flex-1 rounded-t bg-linear-to-t from-emerald-500/60 to-teal-400/40"
                              style={{ height: `${h}%` }}
                            />
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ TRUSTED BY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="border-b border-border bg-background py-8 dark:bg-slate-950/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Trusted by forward-thinking companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 opacity-40">
            {["TechCorp", "HealthFirst", "Orbit Labs", "MindSpace", "NovaCare", "ZenWorks"].map(
              (name) => (
                <span
                  key={name}
                  className="text-lg font-semibold tracking-tight text-foreground"
                >
                  {name}
                </span>
              ),
            )}
          </div>
        </div>
      </section>

      {/* ━━━ USP HIGHLIGHT STRIP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="border-b border-border bg-linear-to-r from-emerald-50 via-teal-50 to-cyan-50 py-10 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-cyan-950/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
            {[
              {
                icon: <Sparkles size={24} />,
                title: "AI-Powered Matching",
                desc: "Our algorithm matches your team with the best-fit certified professionals based on goals, preferences, and health data.",
              },
              {
                icon: <Award size={24} />,
                title: "Certified Professionals Only",
                desc: "Every wellness expert is credential-verified, background-checked, and rated by real clients. No unverified providers.",
              },
              {
                icon: <Brain size={24} />,
                title: "Personalized at Scale",
                desc: "AI adapts programs for every employee individually — no one-size-fits-all. Real professionals, smart technology.",
              },
            ].map((u) => (
              <div key={u.title} className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-sm">
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

      {/* ━━━ PROBLEMS WE SOLVE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 max-w-2xl mx-auto text-center">
            <Badge className="mb-4 dark:bg-emerald-500/15 dark:text-emerald-200">
              Why Corporate Wellness?
            </Badge>
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
              Wellness that drives real business outcomes
            </h2>
            <p className="text-lg text-muted-foreground dark:text-slate-300">
              Healthier employees are more engaged, more productive, and stay longer.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <TrendingUp size={28} />,
                title: "Boost Productivity",
                desc: "Support consistent energy, focus, and sustainable performance across teams.",
                accent: "from-emerald-500 to-teal-500",
              },
              {
                icon: <Heart size={28} />,
                title: "Reduce Burnout",
                desc: "Proactive mental-health support and stress management before it escalates.",
                accent: "from-teal-500 to-cyan-500",
              },
              {
                icon: <Users size={28} />,
                title: "Retain Talent",
                desc: "Companies with wellness programs see 25% lower attrition on average.",
                accent: "from-cyan-500 to-blue-500",
              },
              {
                icon: <Sparkles size={28} />,
                title: "Build Culture",
                desc: "Shared wellness goals create connection, morale, and belonging.",
                accent: "from-blue-500 to-indigo-500",
              },
            ].map((b) => (
              <Card
                key={b.title}
                className="group relative overflow-hidden border-border bg-background p-6 transition-all hover:shadow-lg dark:bg-slate-950/60 dark:border-slate-800"
              >
                <div
                  className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${b.accent} text-white shadow-sm`}
                >
                  {b.icon}
                </div>
                <h3 className="mb-2 font-semibold">{b.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground dark:text-slate-300">
                  {b.desc}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ PLATFORM / DASHBOARD SHOWCASE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-slate-50 py-20 lg:py-28 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left — Text */}
            <div className="max-w-lg">
              <Badge className="mb-4 dark:bg-emerald-500/15 dark:text-emerald-200">
                <Monitor size={14} className="mr-1.5" />
                The Platform
              </Badge>
              <h2 className="mb-6 text-3xl font-bold lg:text-4xl">
                AI-driven dashboard, human-led wellness
              </h2>
              <p className="mb-8 text-lg text-muted-foreground dark:text-slate-300">
                Our AI engine matches employees with certified professionals,
                tracks engagement in real time, and adapts programs
                automatically &mdash; while verified experts deliver the care.
              </p>
              <div className="space-y-4">
                {[
                  "AI matches employees to certified professionals by need",
                  "Real-time participation & engagement metrics",
                  "AI-generated wellness insights & recommendations",
                  "Program ROI tracking and health-cost analytics",
                  "All professionals credential-verified and rated",
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
              <Button
                className="mt-8 bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-sm"
                onClick={() =>
                  document
                    .getElementById("demo-form")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                See It in Action
                <ChevronRight size={16} className="ml-1" />
              </Button>
            </div>

            {/* Right — Dashboard mock */}
            <div className="relative">
              <div className="absolute -inset-6 rounded-3xl bg-linear-to-br from-emerald-500/10 to-cyan-500/10 blur-2xl dark:from-emerald-500/5 dark:to-cyan-500/5" />
              <div className="relative overflow-hidden rounded-2xl border border-border bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                {/* Browser bar */}
                <div className="flex items-center gap-2 border-b border-border bg-slate-50 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-800/50">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                  <div className="ml-3 h-5 flex-1 rounded bg-border/50 dark:bg-slate-700/50" />
                </div>
                {/* Dashboard mock content */}
                <div className="p-5 sm:p-8">
                  {/* Top bar */}
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                      <div className="mt-1.5 h-3 w-28 rounded bg-slate-100 dark:bg-slate-800" />
                    </div>
                    <div className="h-8 w-28 rounded-lg bg-emerald-100 dark:bg-emerald-500/15" />
                  </div>
                  {/* Stat cards */}
                  <div className="mb-6 grid grid-cols-3 gap-4">
                    {[
                      { label: "Active Users", val: "1,247", change: "+12%", color: "text-emerald-600 dark:text-emerald-400" },
                      { label: "Avg. Engagement", val: "78%", change: "+5%", color: "text-teal-600 dark:text-teal-400" },
                      { label: "Wellness Score", val: "8.4/10", change: "+0.6", color: "text-cyan-600 dark:text-cyan-400" },
                    ].map((c) => (
                      <div
                        key={c.label}
                        className="rounded-xl border border-border bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/50"
                      >
                        <p className="text-[11px] text-muted-foreground">{c.label}</p>
                        <p className={`mt-1 text-xl font-bold ${c.color}`}>{c.val}</p>
                        <p className="mt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                          {c.change} this month
                        </p>
                      </div>
                    ))}
                  </div>
                  {/* Chart placeholder */}
                  <div className="h-40 rounded-xl border border-border bg-slate-50/30 p-4 dark:border-slate-700 dark:bg-slate-800/30">
                    <p className="mb-3 text-[11px] font-medium text-muted-foreground">
                      Monthly Participation Trend
                    </p>
                    <div className="flex h-[calc(100%-24px)] items-end gap-1.5">
                      {[35, 50, 42, 68, 55, 72, 60, 80, 65, 88, 75, 92].map(
                        (h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t-sm bg-linear-to-t from-emerald-500 to-teal-400"
                            style={{ height: `${h}%` }}
                          />
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ WHAT WE OFFER ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 mx-auto max-w-2xl text-center">
            <Badge className="mb-4 dark:bg-emerald-500/15 dark:text-emerald-200">
              Comprehensive Solutions
            </Badge>
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
              Everything your team needs
            </h2>
            <p className="text-lg text-muted-foreground dark:text-slate-300">
              Six pillars of wellness, unified in one program
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: <Brain size={24} />,
                title: "Mental Wellness",
                desc: "1-on-1 counseling with certified therapists, AI-matched stress workshops, and burnout prevention.",
                bg: "bg-purple-50 dark:bg-purple-500/10",
                fg: "text-purple-600 dark:text-purple-300",
              },
              {
                icon: <Activity size={24} />,
                title: "Physical Fitness",
                desc: "On-site yoga, group fitness, and dance led by certified trainers. AI-curated to team preferences.",
                bg: "bg-emerald-50 dark:bg-emerald-500/10",
                fg: "text-emerald-600 dark:text-emerald-300",
              },
              {
                icon: <Target size={24} />,
                title: "Nutrition Coaching",
                desc: "Certified nutritionists provide meal plans, dietary consults, and healthy-eating workshops.",
                bg: "bg-amber-50 dark:bg-amber-500/10",
                fg: "text-amber-600 dark:text-amber-300",
              },
              {
                icon: <Heart size={24} />,
                title: "Preventive Health",
                desc: "AI-driven risk assessments, certified health check-ups, vaccination drives, and ergonomic audits.",
                bg: "bg-rose-50 dark:bg-rose-500/10",
                fg: "text-rose-600 dark:text-rose-300",
              },
              {
                icon: <Zap size={24} />,
                title: "Lifestyle Programs",
                desc: "AI-personalized sleep, digital detox, and financial wellness programs for every employee.",
                bg: "bg-cyan-50 dark:bg-cyan-500/10",
                fg: "text-cyan-600 dark:text-cyan-300",
              },
              {
                icon: <Shield size={24} />,
                title: "Leadership Wellness",
                desc: "Certified executive coaches for resilience training and leadership burnout prevention.",
                bg: "bg-indigo-50 dark:bg-indigo-500/10",
                fg: "text-indigo-600 dark:text-indigo-300",
              },
            ].map((f) => (
              <Card
                key={f.title}
                className="group border-border bg-background p-6 transition-all hover:border-emerald-200 hover:shadow-md dark:bg-slate-950/60 dark:border-slate-800 dark:hover:border-emerald-800"
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg ${f.bg} ${f.fg}`}
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
        </div>
      </section>

      {/* ━━━ HOW IT WORKS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-slate-50 py-20 lg:py-28 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <Badge className="mb-4 dark:bg-emerald-500/15 dark:text-emerald-200">
              Simple Process
            </Badge>
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
              Get started in four easy steps
            </h2>
          </div>
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-4">
            {[
              {
                step: "01",
                title: "Discovery Call",
                desc: "We learn about your team size, goals, and current wellness challenges.",
              },
              {
                step: "02",
                title: "AI Matching",
                desc: "Our AI pairs your team with certified professionals best suited to your needs.",
              },
              {
                step: "03",
                title: "Launch",
                desc: "Smooth onboarding with dedicated account manager and support.",
              },
              {
                step: "04",
                title: "Optimize",
                desc: "AI-driven insights help us continuously improve your program.",
              },
            ].map((item, index) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 text-2xl font-bold text-white shadow-lg shadow-emerald-500/20">
                  {item.step}
                </div>
                {index < 3 && (
                  <div className="pointer-events-none absolute left-[calc(50%+40px)] top-8 hidden w-[calc(100%-80px)] md:block">
                    <div className="h-px w-full bg-linear-to-r from-emerald-400/60 to-emerald-400/10" />
                  </div>
                )}
                <h3 className="mb-2 font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground dark:text-slate-300">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ PRICING ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="pricing" className="scroll-mt-20 py-20 lg:py-28 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <Badge className="mb-4 dark:bg-emerald-500/15 dark:text-emerald-200">
              Transparent Pricing
            </Badge>
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
              Plans that scale with your team
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground dark:text-slate-300">
              No hidden fees. No long-term lock-ins. Cancel anytime.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-3">
            {[
              {
                name: "Starter",
                employees: "10 – 50",
                price: "₹20,000",
                period: "/month",
                features: [
                  "Monthly wellness workshops",
                  "Digital wellness resources",
                  "Basic health assessments",
                  "Email support",
                  "Quarterly progress reports",
                ],
                popular: false,
              },
              {
                name: "Growth",
                employees: "51 – 200",
                price: "₹79,900",
                period: "/month",
                features: [
                  "Everything in Starter",
                  "Weekly fitness & yoga classes",
                  "Mental health counseling",
                  "Nutrition consultations",
                  "Dedicated account manager",
                  "Monthly analytics reports",
                ],
                popular: true,
              },
              {
                name: "Enterprise",
                employees: "200+",
                price: "Custom",
                period: "",
                features: [
                  "Everything in Growth",
                  "24/7 telehealth services",
                  "Executive wellness programs",
                  "Fully customizable solutions",
                  "Advanced analytics dashboard",
                  "On-site wellness team",
                ],
                popular: false,
              },
            ].map((tier) => (
              <Card
                key={tier.name}
                className={`relative flex flex-col overflow-hidden p-8 dark:bg-slate-950/60 dark:border-slate-800 ${
                  tier.popular
                    ? "border-2 border-emerald-500 shadow-lg shadow-emerald-500/10"
                    : "border-border"
                }`}
              >
                {tier.popular && (
                  <Badge className="absolute right-4 top-4 bg-emerald-500 text-white">
                    Most Popular
                  </Badge>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">
                    <Users size={14} className="mr-1 inline" />
                    {tier.employees} employees
                  </p>
                </div>
                <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  {tier.period && (
                    <span className="text-muted-foreground dark:text-slate-400">
                      {tier.period}
                    </span>
                  )}
                </div>
                <Separator className="mb-6" />
                <ul className="mb-8 flex-1 space-y-3">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle2
                        size={16}
                        className="mt-0.5 shrink-0 text-emerald-500"
                      />
                      <span className="dark:text-slate-200">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${
                    tier.popular
                      ? "bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-sm"
                      : ""
                  }`}
                  variant={tier.popular ? "default" : "outline"}
                  onClick={() =>
                    document
                      .getElementById("demo-form")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  {tier.price === "Custom" ? "Contact Sales" : "Get Started"}
                </Button>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-muted-foreground dark:text-slate-400">
            All plans include a 30-day money-back guarantee. Prices exclude GST.
          </p>
        </div>
      </section>

      {/* ━━━ SOCIAL PROOF / CASE STUDY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="bg-slate-50 py-20 lg:py-28 dark:bg-slate-900/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <Badge className="mb-4 dark:bg-emerald-500/15 dark:text-emerald-200">
              Results That Speak
            </Badge>
            <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
              Proven impact at scale
            </h2>
          </div>

          <div className="mx-auto max-w-4xl">
            <Card className="overflow-hidden border-border bg-white dark:bg-slate-950/70 dark:border-slate-800">
              <div className="flex flex-col lg:flex-row">
                {/* Left accent */}
                <div className="flex flex-col justify-center bg-linear-to-br from-emerald-500 to-teal-600 p-8 text-white lg:w-1/3">
                  <Badge className="mb-4 w-fit border-white/30 bg-white/15 text-white">
                    Case Study
                  </Badge>
                  <h3 className="text-2xl font-bold">Orbit Labs</h3>
                  <p className="mt-1 text-sm text-white/80">
                    200-person product & engineering team
                  </p>
                </div>
                {/* Right content */}
                <div className="flex-1 p-8">
                  <p className="mb-6 text-lg italic text-muted-foreground leading-relaxed dark:text-slate-300">
                    &ldquo;Within 90 days, participation hit 78%. Burnout markers dropped,
                    and teams reported higher focus and morale. The Wolistic program
                    felt tailored, not templated.&rdquo;
                  </p>
                  <div className="grid gap-4 sm:grid-cols-3">
                    {[
                      { val: "78%", label: "Program participation" },
                      { val: "32%", label: "Stress reduction" },
                      { val: "4.8/5", label: "Employee rating" },
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="rounded-xl bg-slate-50 p-4 text-center dark:bg-slate-800/60"
                      >
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {s.val}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground dark:text-slate-400">
                          {s.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Support badges */}
          <div className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-3">
            {[
              { icon: <Headphones size={28} />, title: "Dedicated Support", desc: "Account managers available every step of the way" },
              { icon: <BarChart3 size={28} />, title: "AI Analytics", desc: "Track engagement and ROI with detailed dashboards" },
              { icon: <Award size={28} />, title: "Certified Experts", desc: "All wellness professionals are verified and certified" },
            ].map((s) => (
              <div
                key={s.title}
                className="flex items-start gap-4 rounded-xl border border-border bg-white p-5 dark:border-slate-800 dark:bg-slate-950/60"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                  {s.icon}
                </div>
                <div>
                  <h4 className="font-semibold">{s.title}</h4>
                  <p className="mt-1 text-sm text-muted-foreground dark:text-slate-400">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ DEMO REQUEST FORM ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section
        id="demo-form"
        className="scroll-mt-20 py-20 lg:py-28 bg-background"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 lg:grid-cols-5">
              {/* Left copy */}
              <div className="lg:col-span-2">
                <Badge className="mb-4 dark:bg-emerald-500/15 dark:text-emerald-200">
                  Get Started
                </Badge>
                <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
                  Request a free demo
                </h2>
                <p className="mb-8 text-muted-foreground dark:text-slate-300">
                  See how Wolistic can transform your workplace wellness.
                  Our team will walk you through the platform and design a
                  custom proposal for your organization.
                </p>
                <div className="space-y-5">
                  {[
                    "Personalized platform walkthrough",
                    "Custom program recommendation",
                    "ROI estimate for your team size",
                    "No commitment required",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3">
                      <CheckCircle2
                        size={18}
                        className="shrink-0 text-emerald-500"
                      />
                      <span className="text-sm dark:text-slate-200">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right form */}
              <div className="lg:col-span-3">
                <Card className="border-border bg-white p-8 shadow-sm dark:bg-slate-950/60 dark:border-slate-800">
                  {submitted ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/15">
                        <CheckCircle2 size={32} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="mb-2 text-xl font-bold">
                        Thank you!
                      </h3>
                      <p className="text-muted-foreground dark:text-slate-300">
                        We&apos;ve received your request. Our team will
                        reach out within 24 hours.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="demo-name">Full name *</Label>
                          <Input
                            id="demo-name"
                            required
                            placeholder="Jane Smith"
                            value={formState.name}
                            onChange={(e) =>
                              setFormState((s) => ({
                                ...s,
                                name: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="demo-email">Work email *</Label>
                          <Input
                            id="demo-email"
                            type="email"
                            required
                            placeholder="jane@company.com"
                            value={formState.email}
                            onChange={(e) =>
                              setFormState((s) => ({
                                ...s,
                                email: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="demo-company">Company name *</Label>
                          <Input
                            id="demo-company"
                            required
                            placeholder="Acme Corp"
                            value={formState.company}
                            onChange={(e) =>
                              setFormState((s) => ({
                                ...s,
                                company: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="demo-employees">
                            Number of employees *
                          </Label>
                          <Input
                            id="demo-employees"
                            required
                            placeholder="e.g. 150"
                            value={formState.employees}
                            onChange={(e) =>
                              setFormState((s) => ({
                                ...s,
                                employees: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="demo-phone">Phone number</Label>
                        <Input
                          id="demo-phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={formState.phone}
                          onChange={(e) =>
                            setFormState((s) => ({
                              ...s,
                              phone: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="demo-message">
                          Tell us about your wellness goals
                        </Label>
                        <Textarea
                          id="demo-message"
                          rows={4}
                          placeholder="What are you hoping to achieve with a corporate wellness program?"
                          value={formState.message}
                          onChange={(e) =>
                            setFormState((s) => ({
                              ...s,
                              message: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-sm"
                      >
                        <Send size={16} className="mr-2" />
                        Request Demo
                      </Button>
                      <p className="text-center text-xs text-muted-foreground dark:text-slate-400">
                        We respect your privacy. No spam, ever.
                      </p>
                    </form>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ FINAL CTA ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative overflow-hidden bg-slate-950 py-20 lg:py-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 bottom-0 h-100 w-100 rounded-full bg-emerald-500/15 blur-[100px]" />
          <div className="absolute -right-32 top-0 h-100 w-100 rounded-full bg-teal-500/10 blur-[100px]" />
        </div>
        <div className="container relative z-10 mx-auto px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
            Ready to transform your workplace?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-300">
            Join hundreds of companies using AI-powered matching with certified
            wellness professionals to build healthier, more productive teams.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              onClick={() =>
                document
                  .getElementById("demo-form")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="bg-linear-to-r from-emerald-500 to-teal-500 px-8 text-white shadow-lg shadow-emerald-500/25"
            >
              Request a Demo
              <ArrowRight size={18} className="ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() =>
                document
                  .getElementById("pricing")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="border-white/20 text-white hover:bg-white/10"
            >
              View Pricing
            </Button>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            No credit card required &bull; Free demo &bull; Cancel anytime
          </p>
        </div>
      </section>
    </div>
  );
}