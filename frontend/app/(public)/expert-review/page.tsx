"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSessionStore } from "@/store/session";
import { Sparkles, Send, Loader2, ShieldCheck, Clock } from "lucide-react";
import {
  buildHolisticTeamListCacheKey,
  listHolisticTeams,
  writeHolisticTeamListCache,
} from "@/components/public/data/holisticTeamsApi";

const QUESTIONS = [
  {
    id: "goal",
    title: "Question 1 of 4",
    prompt: "What’s your main goal right now?",
    type: "text",
    placeholder: "e.g., Lose 5kg in 8 weeks, manage stress, sleep better",
  },
  {
    id: "challenge",
    title: "Question 2 of 4",
    prompt: "What’s been stopping you?",
    type: "text",
    placeholder: "e.g., lack of routine, not sure where to start",
  },
  {
    id: "budget_range",
    title: "Question 3 of 4",
    prompt: "What’s your comfortable budget range per week?",
    type: "options",
    options: ["₹2,000–₹5,000", "₹5,000–₹10,000", "₹10,000+", "Flexible"],
  },
  {
    id: "preferred_mode",
    title: "Question 4 of 4",
    prompt: "Do you prefer online, offline, or hybrid support?",
    type: "options",
    options: ["Online", "Offline", "Hybrid"],
  },
] as const;

type Question = (typeof QUESTIONS)[number];

type AnswerMap = {
  goal: string;
  challenge: string;
  time_commitment: string;
  budget_range: string;
  preferred_mode: string;
};

type Message = {
  id: string;
  from: "bot" | "user";
  text: string;
};

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

function mapBudgetRangeToPrices(budgetRange: string): { minPrice?: number; maxPrice?: number } {
  const value = (budgetRange || "").trim();
  if (value === "₹2,000–₹5,000") {
    return { minPrice: 2000, maxPrice: 5000 };
  }
  if (value === "₹5,000–₹10,000") {
    return { minPrice: 5000, maxPrice: 10000 };
  }
  if (value === "₹10,000+") {
    return { minPrice: 10000 };
  }
  return {};
}

function normalizeMode(value: string): string | undefined {
  const mode = (value || "").trim().toLowerCase();
  if (["online", "offline", "hybrid"].includes(mode)) {
    return mode;
  }
  return undefined;
}

export default function ExpertReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authToken = useSessionStore((state) => state.token);
  const query = searchParams.get("q") ?? "";
  const scope = searchParams.get("scope") ?? "wolistic";

  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [answers, setAnswers] = useState<AnswerMap>({
    goal: "",
    challenge: "",
    time_commitment: "",
    budget_range: "",
    preferred_mode: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const chatRef = useRef<HTMLDivElement | null>(null);

  const progress = useMemo(() => {
    const total = QUESTIONS.length;
    const completed = Math.min(currentIndex, total);
    return Math.round((completed / total) * 100);
  }, [currentIndex]);

  const currentQuestion: Question | undefined = QUESTIONS[currentIndex];

  const addBotMessage = (text: string) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), from: "bot", text }]);
  };

  const addUserMessage = (text: string) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), from: "user", text }]);
  };

  const startFlow = () => {
    setStarted(true);
    addBotMessage("Great! I’ll guide you through 4 quick questions.");
    if (QUESTIONS[0]) {
      addBotMessage(QUESTIONS[0].prompt);
    }
  };

  const handleAdvance = (question: Question, value: string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    addUserMessage(value);
    const nextIndex = currentIndex + 1;
    if (nextIndex < QUESTIONS.length) {
      setCurrentIndex(nextIndex);
      setTimeout(() => addBotMessage(QUESTIONS[nextIndex].prompt), 280);
    } else {
      setCurrentIndex(nextIndex);
      void submitAnswers({ ...answers, [question.id]: value });
    }
    setInputValue("");
  };

  const submitAnswers = async (finalAnswers: AnswerMap) => {
    setSubmitting(true);
    setGenerating(true);
    setProcessingMessage("Saving your responses...");
    setError(null);
    try {
      const response = await fetch(`${apiBase}/api/v1/intake/expert-review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          query: query || undefined,
          scope,
          answers: finalAnswers,
          source: "expert_review_chat",
          metadata: { source_page: "expert-review" },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to submit expert review (${response.status})`);
      }

      setProcessingMessage("Preparing your team...");
      const normalizedMode = normalizeMode(finalAnswers.preferred_mode);
      const budget = mapBudgetRangeToPrices(finalAnswers.budget_range);
      const normalizedQuery = query.trim() || finalAnswers.goal || "general wellness";

      await fetch(`${apiBase}/api/v1/holistic-teams/prepare`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: normalizedQuery,
          scope,
          preferred_mode: normalizedMode,
          min_price: budget.minPrice,
          max_price: budget.maxPrice,
        }),
      });

      setProcessingMessage("Preparing your team...");
      const cacheInput = {
        q: normalizedQuery,
        scope,
        sort: "recommended",
        mode: normalizedMode,
        minPrice: budget.minPrice,
        maxPrice: budget.maxPrice,
      };
      const prefetched = await listHolisticTeams(cacheInput);
      writeHolisticTeamListCache(buildHolisticTeamListCacheKey(cacheInput), prefetched.items);

      addBotMessage("Your team is being prepared using your preferences.");
      const next = new URLSearchParams();
      if (normalizedQuery) next.set("q", normalizedQuery);
      if (scope) next.set("scope", scope);
      if (normalizedMode) next.set("mode", normalizedMode);
      if (typeof budget.minPrice === "number") next.set("minPrice", String(budget.minPrice));
      if (typeof budget.maxPrice === "number") next.set("maxPrice", String(budget.maxPrice));
      router.replace(`/holistic-team?${next.toString()}`);
    } catch (err) {
      console.error(err);
      setError("Could not save your responses. Please try again.");
      setSubmitting(false);
      setGenerating(false);
      setProcessingMessage(null);
    }
  };

  const handleSend = () => {
    if (!currentQuestion || !inputValue.trim()) return;
    handleAdvance(currentQuestion, inputValue.trim());
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, generating]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-emerald-950 text-white relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-10 top-10 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 border border-white/10 text-sm text-emerald-100">
              <Sparkles size={16} />
              We&apos;ll ask you 4 quick questions (takes about 60 seconds).
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold">Let&apos;s us help you with your journey.</h1>
            <p className="text-slate-300 max-w-2xl">
              We&apos;ll keep it light and focused. Preview the questions below.
            </p>
          </div>
          <div className="hidden md:flex flex-col items-end text-sm text-emerald-100/80">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} /> Secure &amp; private
            </div>
            <div className="flex items-center gap-2 text-emerald-100/70">
              <Clock size={16} /> ~60 seconds
            </div>
          </div>
        </div>

        {!started && (
          <div className="grid md:grid-cols-[1.4fr_1fr] gap-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-4">
              <p className="text-sm text-emerald-100/80">You&apos;ll be asked:</p>
              <ol className="space-y-3 text-slate-100 text-sm">
                <li className="flex gap-3"><span className="text-emerald-300">1.</span> Your main goal</li>
                <li className="flex gap-3"><span className="text-emerald-300">2.</span> Your biggest challenge</li>
                <li className="flex gap-3"><span className="text-emerald-300">3.</span> Budget range</li>
                <li className="flex gap-3"><span className="text-emerald-300">4.</span> Preferred mode</li>
              </ol>
              <div className="text-xs text-slate-400">Knowing this upfront lowers anxiety — nothing surprising.</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-emerald-900/30 backdrop-blur-sm p-6 flex flex-col justify-between shadow-lg shadow-emerald-900/30">
              <div className="space-y-2">
                <p className="text-sm text-emerald-100/80">How this fast-tracks your journey</p>
                <ul className="text-slate-100 text-sm space-y-2">
                  <li className="flex gap-2">• We can find the right expert for you</li>
                  <li className="flex gap-2">• Experts can start planning your personalized plan immediately</li>
                  <li className="flex gap-2">• It&apos;s faster than back-and-forth messaging</li>
                </ul>
              </div>
              <Button
                onClick={startFlow}
                className="mt-4 bg-emerald-500 hover:bg-emerald-600 text-white w-full h-12 rounded-xl"
              >
                Start the quick chat
              </Button>
            </div>
          </div>
        )}

        {started && (
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 mt-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-4 shadow-xl shadow-emerald-900/30 min-h-130">
              <div className="flex items-center justify-between text-sm text-emerald-100/80">
                <span>{currentQuestion ? currentQuestion.title : "All done"}</span>
                <div className="flex-1 mx-4 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-emerald-400" style={{ width: `${progress}%` }} />
                </div>
                <span>{progress}%</span>
              </div>

              <div ref={chatRef} className="space-y-3 max-h-105 overflow-y-auto pr-2">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg ${
                        msg.from === "user"
                          ? "bg-emerald-500 text-white"
                          : "bg-white/8 text-slate-50 border border-white/10"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {generating && processingMessage && (
                  <div className="flex gap-3 items-center text-sm text-emerald-100/80">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {processingMessage}
                  </div>
                )}
              </div>

              {!generating && currentQuestion && (
                <div className="space-y-3 pt-2">
                  {currentQuestion.type === "options" ? (
                    <div className="flex flex-wrap gap-2">
                      {currentQuestion.options?.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleAdvance(currentQuestion, opt)}
                          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 hover:border-emerald-400 hover:text-white hover:bg-emerald-500/20 transition"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <input
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder={currentQuestion.placeholder}
                        className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/70"
                      />
                      <Button
                        onClick={handleSend}
                        disabled={submitting}
                        className="h-11 w-11 rounded-xl bg-emerald-500 hover:bg-emerald-600"
                      >
                        <Send size={16} />
                      </Button>
                    </div>
                  )}
                  {error && <p className="text-sm text-red-300">{error}</p>}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 space-y-3">
                <p className="text-sm text-emerald-100/80">What happens next?</p>
                <ul className="text-sm text-slate-100 space-y-2">
                  <li className="flex gap-2">• Experts review your answers</li>
                  <li className="flex gap-2">• Initial consultation</li>
                  <li className="flex gap-2">• You get a clear, actionable plan to follow</li>
                  <li className="flex gap-2">• You won&apos;t have to do this alone.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}