import Image from "next/image";
import { Heart, Shield, Target, Users } from "lucide-react";
import logoImage from "@/assets/logo_ver.png";

export default function AboutPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/40" />
        <div className="pointer-events-none absolute top-6 -right-16 z-0 w-72 opacity-50 sm:top-8 sm:-right-20 sm:w-96 sm:opacity-50 lg:top-10 lg:-right-28 lg:w-152">
          <Image
            src={logoImage}
            alt=""
            className="h-auto w-full scale-85 origin-top-right"
          />
        </div>
        <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-500/20" />
        <div className="absolute -bottom-12 left-10 h-80 w-80 rounded-full bg-teal-200/40 blur-3xl dark:bg-teal-500/20" />
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-sm text-emerald-700 shadow-sm dark:bg-emerald-500/15 dark:text-emerald-200">
              Our Story
            </p>
            <h1 className="mt-6 text-4xl lg:text-5xl font-medium tracking-tight">
              Building a trusted ecosystem for holistic wellness
            </h1>
            <p className="mt-5 text-lg text-muted-foreground dark:text-slate-200/75">
              Wolistic connects certified professionals, curated products, and authentic educators so
              your wellness journey feels guided, clear, and empowering.
            </p>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-12 lg:py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <h2 className="text-3xl lg:text-4xl">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed dark:text-slate-200/70">
                The wellness industry is crowded with noise. We built Wolistic to elevate
                credibility, reduce friction, and make expert guidance accessible without hype.
              </p>
              <p className="text-muted-foreground leading-relaxed dark:text-slate-200/70">
                Our platform blends human expertise with AI tools that streamline work—so
                professionals can focus on impact, and seekers can trust the path forward.
              </p>
              <h2 className="text-3xl lg:text-4xl">Why We Built Wolistic</h2>
              <p className="text-muted-foreground leading-relaxed dark:text-slate-200/70">
                The wellness industry has a trust problem. Influencers promote products they do not use,
                professionals struggle to reach the right clients, and seekers do not know who to trust.
              </p>
              <p className="text-muted-foreground leading-relaxed dark:text-slate-200/70">
                Wolistic changes that with an ecosystem where credentials matter more than followers,
                and quality beats quantity. Professionals can focus on care, not marketing tactics.
              </p>
              <p className="text-muted-foreground leading-relaxed dark:text-slate-200/70">
                We unite certified experts, vetted products, and authentic educators in one place,
                while using AI to reduce admin burden—never to replace human expertise.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:bg-slate-950/60 dark:border-slate-800">
                <p className="text-sm text-muted-foreground">Founded on clarity</p>
                <p className="text-xl font-medium mt-2">Credentials over influence</p>
              </div>
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:bg-slate-950/60 dark:border-slate-800">
                <p className="text-sm text-muted-foreground">Powered by ethics</p>
                <p className="text-xl font-medium mt-2">Transparent partnerships</p>
              </div>
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm dark:bg-slate-950/60 dark:border-slate-800">
                <p className="text-sm text-muted-foreground">Designed for growth</p>
                <p className="text-xl font-medium mt-2">Tools that respect your time</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-12 lg:py-20 bg-accent/30 dark:bg-slate-900/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl lg:text-4xl mb-4">Our Values</h2>
            <p className="text-lg text-muted-foreground dark:text-slate-200/70">
              Everything we build is guided by these core principles.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl p-8 border border-border text-center dark:bg-slate-950/60 dark:border-slate-800">
              <div className="w-14 h-14 rounded-full bg-linear-to-br from-emerald-100 to-teal-100 flex items-center justify-center mx-auto mb-6 dark:from-emerald-500/20 dark:to-teal-500/20">
                <Shield size={28} className="text-emerald-600" />
              </div>
              <h3 className="mb-3 text-lg font-medium">Trust</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-200/70">
                Verified professionals, curated products, and transparent guidance.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-border text-center dark:bg-slate-950/60 dark:border-slate-800">
              <div className="w-14 h-14 rounded-full bg-linear-to-br from-teal-100 to-cyan-100 flex items-center justify-center mx-auto mb-6 dark:from-teal-500/20 dark:to-cyan-500/20">
                <Heart size={28} className="text-teal-600" />
              </div>
              <h3 className="mb-3 text-lg font-medium">Holistic</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-200/70">
                We honor the connection between body, mind, and diet.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-border text-center dark:bg-slate-950/60 dark:border-slate-800">
              <div className="w-14 h-14 rounded-full bg-linear-to-br from-cyan-100 to-blue-100 flex items-center justify-center mx-auto mb-6 dark:from-cyan-500/20 dark:to-blue-500/20">
                <Users size={28} className="text-cyan-600" />
              </div>
              <h3 className="mb-3 text-lg font-medium">Community</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-200/70">
                We build meaningful connections between experts and seekers.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 border border-border text-center dark:bg-slate-950/60 dark:border-slate-800">
              <div className="w-14 h-14 rounded-full bg-linear-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-6 dark:from-blue-500/20 dark:to-indigo-500/20">
                <Target size={28} className="text-blue-600" />
              </div>
              <h3 className="mb-3 text-lg font-medium">Clarity</h3>
              <p className="text-sm text-muted-foreground dark:text-slate-200/70">
                No hype—just honest guidance and real results.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Commitment */}
      <section className="py-12 lg:py-20 bg-linear-to-br from-slate-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-white text-3xl lg:text-4xl mb-6">Our Commitment to You</h2>
            <p className="text-lg text-slate-300 mb-10">
              Whether you&apos;re seeking wellness or providing it, we promise transparency,
              quality, and ethical practices in everything we do.
            </p>
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl mb-2 text-emerald-400">100%</div>
                <p className="text-sm text-slate-400">Verified Professionals</p>
              </div>
              <div>
                <div className="text-2xl mb-2 text-teal-400">Zero commission</div>
                <p className="text-sm text-slate-400">For certified experts</p>
              </div>
              <div>
                <div className="text-2xl mb-2 text-cyan-400">Always</div>
                <p className="text-sm text-slate-400">Transparent</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
