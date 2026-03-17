"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarClock, Package, ShieldCheck, Sparkles, Users } from "lucide-react";

import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { ImageWithFallback } from "@/components/public/ImageWithFallback";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fallbackHolisticPlans } from "@/lib/holisticPlans";

export default function HolisticPlanDetailPage() {
    const params = useParams<{ planId: string }>();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading] = useState(false);
    const { isAuthenticated } = useAuthSession();

    const isLoggedIn = isAuthenticated;

    const planId = params?.planId;
    const query = searchParams.get("q") ?? "";
    const scope = searchParams.get("scope") ?? "wolistic";

    const plan = useMemo(
        () => fallbackHolisticPlans.find((item) => item.id === planId),
        [planId],
    );

    const summaryHref = useMemo(() => {
        const context = new URLSearchParams();
        if (query.trim()) {
            context.set("q", query.trim());
        }
        if (scope) {
            context.set("scope", scope);
        }
        const str = context.toString();
        return str ? `/holistic-plan?${str}` : "/holistic-plan";
    }, [query, scope]);

    const requireLogin = (nextHref: string) => {
        if (isLoggedIn) {
            router.push(nextHref);
            return;
        }
        router.push(`/authorized?next=${encodeURIComponent(nextHref)}`);
    };

    const handleProceed = () => {
        if (!plan) {
            return;
        }
        const next = query.trim() ? `/payment?planId=${plan.id}&q=${encodeURIComponent(query.trim())}` : `/payment?planId=${plan.id}`;
        requireLogin(next);
    };

    const handleRequestChanges = () => {
        if (!plan) {
            return;
        }
        const context = new URLSearchParams();
        if (query.trim()) {
            context.set("q", query.trim());
        }
        if (scope) {
            context.set("scope", scope);
        }
        context.set("planId", plan.id);
        context.set("mode", "request_changes");
        requireLogin(`/expert-review?${context.toString()}`);
    };

    return (
        <div className="w-full bg-background min-h-screen py-10 lg:py-12">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <ArrowLeft size={16} />
                    <Link href={summaryHref} className="hover:text-foreground font-medium">
                        Back to plan suggestions
                    </Link>
                </div>

                <div className="rounded-2xl border border-border bg-white dark:bg-slate-950/70 dark:border-slate-800 p-6 lg:p-8 shadow-sm space-y-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4 justify-between">
                        <div className="space-y-3">
                            <p className="text-xs uppercase tracking-wide text-emerald-700 font-semibold">Holistic Plan</p>
                            <h1 className="text-2xl lg:text-3xl font-semibold leading-tight text-foreground">{plan?.title ?? "Holistic plan"}</h1>
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="secondary">Curated by body + diet + mind experts</Badge>
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200" variant="outline">
                                    Recommended fit
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-3 w-full lg:w-auto">
                            <div className="rounded-xl border border-border bg-slate-50 dark:bg-slate-900/60 px-4 py-3 space-y-1">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Package size={16} className="text-emerald-600" />
                                    Package price
                                </div>
                                <p className="text-xl font-semibold text-foreground">{plan?.packagePrice ?? "-"}</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button className="bg-linear-to-r from-emerald-500 to-teal-600 text-white" onClick={handleProceed} disabled={!plan || isLoading}>
                                    {isLoggedIn ? "Proceed with plan" : "Login to proceed"}
                                </Button>
                                <Button variant="outline" onClick={handleRequestChanges} disabled={!plan || isLoading}>
                                    {isLoggedIn ? "Request changes" : "Login to request changes"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-3">
                        <div className="rounded-xl border border-border bg-slate-50/60 dark:bg-slate-900/70 p-4 space-y-2">
                            <div className="flex items-center gap-3 text-sm font-medium text-foreground">
                                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40">
                                    <CalendarClock size={16} />
                                </span>
                                <div className="leading-tight">
                                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Schedule</p>
                                    <p className="text-sm text-foreground">
                                        {plan?.sessionBreakdown?.totalSessions ? `${plan.sessionBreakdown.totalSessions} sessions` : "Session mix"}
                                        {plan?.sessionBreakdown?.body?.format ? " · mixed format" : ""}
                                    </p>
                                </div>
                            </div>

                            {plan?.sessionBreakdown ? (
                                <div className="rounded-lg border border-dashed border-emerald-200/80 bg-white/60 dark:bg-slate-950/40 p-3 space-y-2">
                                    <div className="flex items-center justify-between text-sm text-foreground">
                                        <span className="font-semibold">Total</span>
                                        <span>{plan.sessionBreakdown.totalSessions} sessions</span>
                                    </div>
                                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-600 mt-0.5">•</span>
                                            <span className="flex-1">
                                                {plan.sessionBreakdown.body.count} body sessions
                                                {plan.sessionBreakdown.body.format ? ` (${plan.sessionBreakdown.body.format})` : ""}
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-600 mt-0.5">•</span>
                                            <span className="flex-1">
                                                {plan.sessionBreakdown.diet.count} diet sessions
                                                {plan.sessionBreakdown.diet.followups ? ` + ${plan.sessionBreakdown.diet.followups}` : ""}
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-emerald-600 mt-0.5">•</span>
                                            <span className="flex-1">
                                                {plan.sessionBreakdown.mind.count} {plan.sessionBreakdown.mind.label ?? "mental wellness"} session
                                            </span>
                                        </li>
                                    </ul>
                                </div>
                            ) : (
                                <div className="rounded-lg border border-dashed border-emerald-200/80 bg-white/60 dark:bg-slate-950/40 p-3 text-sm text-muted-foreground">
                                    {plan?.schedule ?? "Schedule will be shared by your coach."}
                                </div>
                            )}

                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Cadence: {plan?.schedule ?? "Will be shared by your coach."}
                            </p>
                        </div>

                        <div className="rounded-xl border border-border bg-slate-50/60 dark:bg-slate-900/70 p-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <ShieldCheck size={16} className="text-emerald-600" />
                                Quality guardrails
                            </div>
                            <p className="text-sm text-foreground">Weekly reviews, adherence nudges, and smart check-ins.</p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border bg-slate-50/40 dark:bg-slate-900/60 p-5 space-y-4">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <Users size={16} className="text-emerald-600" />
                            Your expert team
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {(plan?.experts ?? []).map((expert) => (
                                <div key={expert.id} className="rounded-lg border border-border overflow-hidden bg-white dark:bg-slate-950/70 dark:border-slate-800">
                                    <div className="aspect-square">
                                        <ImageWithFallback src={expert.image} alt={expert.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-2 text-center space-y-0.5">
                                        <p className="text-xs font-semibold text-foreground truncate">{expert.name}</p>
                                        <p className="text-[11px] text-muted-foreground">{expert.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="text-xs text-muted-foreground leading-relaxed">
                            Each expert collaborates weekly to adjust your body, diet, and mind protocols so you stay on track.
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-[1.8fr,1.2fr] gap-6">
                        <div className="rounded-xl border border-border bg-slate-50/40 dark:bg-slate-900/60 p-5 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                <Sparkles size={16} className="text-emerald-600" />
                                What&apos;s included in your plan
                            </div>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                {(plan?.includes ?? []).map((item) => (
                                    <li key={item} className="flex items-start gap-2">
                                        <span className="text-emerald-600 mt-1">•</span>
                                        <span className="leading-relaxed text-foreground">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between rounded-xl border border-dashed border-emerald-200 bg-emerald-50/80 dark:bg-emerald-950/30 p-4">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-emerald-800">Want a different mix?</p>
                            <p className="text-sm text-emerald-900/80 dark:text-emerald-100/80">Ask us to rebalance the body/diet/mind focus or swap experts.</p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <Button variant="outline" onClick={handleRequestChanges} className="border-emerald-300 text-emerald-800">
                                Request changes
                            </Button>
                            <Button className="bg-linear-to-r from-emerald-500 to-teal-600 text-white" onClick={handleProceed}>
                                {isLoggedIn ? "Proceed" : "Login to proceed"}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}