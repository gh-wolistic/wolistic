"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarClock, Package } from "lucide-react";

import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fallbackHolisticPlans, type HolisticPlanSuggestion } from "@/lib/holisticPlans";

type HolisticPlansSectionProps = {
    heading: string;
    plans: HolisticPlanSuggestion[];
    isLoading: boolean;
    isLoggedIn: boolean;
    buildPlanHref: (planId: string) => string;
    onProceed: (planId: string) => void;
    onRequestChanges: (planId: string) => void;
};

export default function HolisticPlanPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoadingPlans] = useState(false);
    const { isAuthenticated } = useAuthSession();

    const query = searchParams.get("q") ?? "";
    const scope = searchParams.get("scope") ?? "wolistic";
    const isLoggedIn = isAuthenticated;

    const heading = "Expert-backed holistic plans for you";
    const recommendedPlans = fallbackHolisticPlans;

    const contextSearch = useMemo(() => {
        const params = new URLSearchParams();
        if (query.trim()) {
            params.set("q", query.trim());
        }
        if (scope) {
            params.set("scope", scope);
        }
        return params.toString();
    }, [query, scope]);

    const buildExpertReviewHref = () => {
        const params = new URLSearchParams();
        if (query.trim()) {
            params.set("q", query.trim());
        }
        if (scope) {
            params.set("scope", scope);
        }
        const str = params.toString();
        return str ? `/expert-review?${str}` : "/expert-review";
    };

    const buildPlanDetailHref = (planId: string) => {
        const params = new URLSearchParams();
        if (query.trim()) {
            params.set("q", query.trim());
        }
        if (scope) {
            params.set("scope", scope);
        }
        const str = params.toString();
        return str ? `/holistic-plan/${planId}?${str}` : `/holistic-plan/${planId}`;
    };

    const requireLogin = (nextHref: string) => {
        if (isLoggedIn) {
            router.push(nextHref);
            return;
        }
        router.push(`/authorized?next=${encodeURIComponent(nextHref)}`);
    };

    const handlePlanProceed = (planId: string) => {
        requireLogin(buildPlanDetailHref(planId));
    };

    const handlePlanRequestChanges = (planId: string) => {
        const params = new URLSearchParams();
        if (query.trim()) {
            params.set("q", query.trim());
        }
        if (scope) {
            params.set("scope", scope);
        }
        params.set("planId", planId);
        params.set("mode", "request_changes");
        requireLogin(`/expert-review?${params.toString()}`);
    };

    return (
        <div className="w-full py-10 lg:py-12 bg-background min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="space-y-2">
                        <p className="text-2xl font-semibold">{heading}</p>
                        <p className="text-sm text-muted-foreground">Your answers have been captured. Review and choose a plan below.</p>
                        {query.trim() && (
                            <Badge variant="secondary" className="mt-2">
                                Query: {query.trim()}
                            </Badge>
                        )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link href={buildExpertReviewHref()}>
                            <Button variant="outline">Edit my answers</Button>
                        </Link>
                    </div>
                </div>

                <HolisticPlansSection
                    heading={heading}
                    plans={recommendedPlans}
                    isLoading={isLoadingPlans}
                    isLoggedIn={isLoggedIn}
                    buildPlanHref={buildPlanDetailHref}
                    onProceed={handlePlanProceed}
                    onRequestChanges={handlePlanRequestChanges}
                />
            </div>
        </div>
    );
}

export function HolisticPlansSection({
    heading,
    plans,
    isLoading,
    isLoggedIn,
    buildPlanHref,
    onProceed,
    onRequestChanges,
}: HolisticPlansSectionProps) {
    const plansToRender = plans && plans.length > 0 ? plans : fallbackHolisticPlans;

    return (
        <div className="rounded-2xl border border-border bg-white p-6 lg:p-8 dark:bg-slate-950/60 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-4 text-emerald-700 dark:text-emerald-300">
                <p className="text-xl lg:text-2xl">{heading}</p>
            </div>

            <p className="text-muted-foreground mb-5">Each package is co-designed by a body expert, diet expert, and mind expert.</p>

            {isLoading && isLoggedIn && <p className="text-sm text-muted-foreground mb-4">Loading AI suggested plans...</p>}

            <div className="space-y-5">
                {plansToRender.map((plan) => (
                    <Link
                        key={plan.id}
                        href={buildPlanHref(plan.id)}
                        className="block rounded-xl border border-border p-5 lg:p-6 bg-background hover:border-emerald-200 transition-colors cursor-pointer"
                    >
                        <div className="mb-4">
                            <h3 className="font-semibold text-lg lg:text-xl text-foreground mb-1">{plan.title}</h3>
                            <p className="text-xs text-muted-foreground">Co-designed by 3 experts</p>
                        </div>

                        <div className="lg:grid lg:grid-cols-[1.5fr,1fr] lg:gap-6 space-y-5 lg:space-y-0">
                            <div className="space-y-3">
                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Team</p>

                                <div className="flex gap-3 flex-wrap">
                                    {plan.experts.map((expert) => (
                                        <div key={expert.id} className="w-40 sm:w-44 rounded-lg border border-border overflow-hidden bg-white dark:bg-slate-950/50 dark:border-slate-800 hover:shadow-sm transition-shadow">
                                            <div className="aspect-square">
                                                <ImageWithFallback
                                                    src={expert.image}
                                                    alt={expert.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="p-2">
                                                <p className="text-[11px] font-medium leading-tight truncate text-foreground">{expert.name}</p>
                                                <p className="text-[10px] text-muted-foreground">{expert.role}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-lg border border-border bg-slate-50/50 dark:bg-slate-950/30 p-4 space-y-3">
                                <div className="space-y-2.5">
                                    <div className="flex items-start gap-2">
                                        <Package size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5">Package Price</p>
                                            <p className="text-sm font-semibold text-foreground">{plan.packagePrice}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-2">
                                        <CalendarClock size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-0.5">Schedule</p>
                                            <p className="text-xs text-foreground leading-relaxed">{plan.schedule}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-border">
                                    <p className="text-xs font-medium text-foreground mb-2">What&apos;s included</p>
                                    <ul className="space-y-1.5 text-xs text-muted-foreground">
                                        {plan.includes.map((item) => (
                                            <li key={item} className="flex items-start gap-1.5">
                                                <span className="text-emerald-600 mt-0.5">•</span>
                                                <span className="flex-1">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-border flex flex-col sm:flex-row gap-2.5">
                            <Button
                                size="default"
                                className="bg-linear-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onProceed(plan.id);
                                }}
                            >
                                {isLoggedIn ? "Proceed with plan" : "Login to proceed"}
                            </Button>
                            <Button
                                size="default"
                                variant="outline"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onRequestChanges(plan.id);
                                }}
                            >
                                {isLoggedIn ? "Request changes" : "Login to request changes"}
                            </Button>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}