"use client";

import { ArrowRight, CheckCircle2, Shield } from "lucide-react";

import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { Button } from "@/components/ui/button";

type LandingDestination = "professionals" | "partners" | "products";

type BenefitsProps = {
  onNavigate?: (destination: LandingDestination) => void;
};

export function Benefits({ onNavigate }: BenefitsProps) {
  const { openAuthModal } = useAuthModal();

  return (
    <div>
     {/*  <section className="py-10 lg:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-lg dark:hover:shadow-black/30">
            <div className="grid lg:grid-cols-2 gap-16">
              <div>
                <h2 className="mb-8 text-3xl lg:text-4xl">For Wellness Seekers</h2>
                <div className="space-y-4">
                  {[
                    "All aspects of wellness in one trusted platform",
                    "Certified professionals verified for quality",
                    "Authentic recommendations without the hype",
                    "Curated products and services you can trust",
                    "Holistic progress tracking across body, mind, and diet",
                  ].map((benefit, index) => (
                    <div key={index} className="flex gap-3">
                      <CheckCircle2 size={24} className="text-emerald-600 shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">{benefit}</p>
                    </div>
                  ))}
                </div>
                <Button
                  className="mt-8 bg-linear-to-r from-emerald-500 to-teal-600 text-white"
                  onClick={openAuthModal}
                >
                  Start Your Journey
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>

              <div>
                <h2 className="mb-8 text-3xl lg:text-4xl">For Partners</h2>
                <div className="space-y-4">
                  {[
                    "Professional dashboard with AI-assisted workflows",
                    "Client management and scheduling tools",
                    "Analytics and growth insights",
                    "Ethical monetization without compromising values",
                    "Zero commission on selected services for experts",
                  ].map((benefit, index) => (
                    <div key={index} className="flex gap-3">
                      <CheckCircle2 size={24} className="text-teal-600 shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">{benefit}</p>
                    </div>
                  ))}
                </div>
                <Button
                  className="mt-8 bg-linear-to-r from-emerald-500 to-teal-600 text-white"
                  onClick={() => onNavigate?.("partners")}
                >
                  Become a Partner
                  <ArrowRight size={16} className="ml-2" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section> */}
      <section className="py-10 lg:py-16 bg-accent/30 dark:bg-accent/20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <Shield size={48} className="text-emerald-600 mx-auto mb-6" />
            <h2 className="mb-4 text-3xl lg:text-4xl">Built on Trust and Quality</h2>
            <p className="text-lg text-muted-foreground mb-12">
              Every professional is verified. We believe in transparency, not hype.
            </p>
            <div className="grid sm:grid-cols-3 gap-8">

              <div>
                <div className="text-3xl mb-2">100%</div>
                <p className="text-muted-foreground">
                  Verified Professionals
                </p>
              </div>

              <div>
                <div className="text-3xl mb-2">0%</div>
                <p className="text-muted-foreground">
                  Commission on 1-on-1 sessions & classes
                </p>
              </div>

              <div>
                <div className="text-3xl mb-2">Complete</div>
                <p className="text-muted-foreground">
                  Transparency
                </p>
              </div>

            </div>

            <p className="text-sm text-muted-foreground text-center mt-4">
              Commission applies only to corporate wellness programs.
            </p>

          </div>
        </div>
      </section>
    </div>
  );
}
