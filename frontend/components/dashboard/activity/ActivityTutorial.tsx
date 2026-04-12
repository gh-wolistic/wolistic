"use client";

import { useState } from "react";
import { X, GripVertical, ArrowRight, CheckCircle2, Mouse, MoveRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const tutorialSteps: TutorialStep[] = [
  {
    title: "Drag & Drop Cards",
    description:
      "Click and hold the grip icon (⋮⋮) on any card, then drag it to move between columns.",
    icon: GripVertical,
    color: "emerald",
  },
  {
    title: "Track Progress",
    description:
      "Move cards across columns to update their status: Yet to Start → In Progress → Accepted → Completed.",
    icon: MoveRight,
    color: "sky",
  },
  {
    title: "Organize Your Work",
    description:
      "Color-coded cards: Blue for Bookings, Green for Todos, Purple for Wolistic goals.",
    icon: CheckCircle2,
    color: "violet",
  },
];

interface ActivityTutorialProps {
  onClose: () => void;
  onSkip: () => void;
}

export function ActivityTutorial({ onClose, onSkip }: ActivityTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const current = tutorialSteps[currentStep];
  const Icon = current.icon;

  const colorClasses: Record<string, string> = {
    emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-400/30",
    sky: "bg-sky-500/20 text-sky-400 border-sky-400/30",
    violet: "bg-violet-500/20 text-violet-400 border-violet-400/30",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className="relative w-full max-w-2xl border-white/20 bg-[#0d1526]/95 shadow-2xl backdrop-blur-xl">
        {/* Close */}
        <button
          onClick={onSkip}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Close tutorial"
        >
          <X className="size-5" />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 p-4 ring-2 ring-emerald-400/30">
                <Mouse className="size-10 text-emerald-400" />
              </div>
            </div>
            <h2 className="mb-2 text-2xl font-bold text-white">Welcome to Activity Manager!</h2>
            <p className="text-zinc-400">
              Learn how to organize your bookings, todos, and goals
            </p>
          </div>

          {/* Step dots */}
          <div className="mb-8 flex items-center justify-center gap-2">
            {tutorialSteps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === currentStep
                    ? "w-8 bg-emerald-400"
                    : i < currentStep
                    ? "w-6 bg-emerald-400/40"
                    : "w-6 bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* Step content */}
          <div className="mb-8 min-h-[200px] space-y-6">
            <div className="flex justify-center">
              <div className={`rounded-2xl border p-6 ${colorClasses[current.color]}`}>
                <Icon className="size-16" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="mb-3 text-xl font-semibold text-white">{current.title}</h3>
              <p className="text-zinc-300">{current.description}</p>
            </div>

            {/* Visual examples */}
            {currentStep === 0 && (
              <div className="mt-6 flex items-center justify-center gap-4">
                <div className="rounded-xl border border-white/10 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Badge className="border border-emerald-400/40 bg-emerald-500/30 text-xs text-emerald-300">
                      Todo
                    </Badge>
                    <GripVertical className="size-4 animate-pulse text-emerald-400" />
                  </div>
                  <p className="text-sm font-medium text-white">Example Task</p>
                </div>
                <ArrowRight className="size-6 animate-pulse text-zinc-500" />
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 opacity-50">
                  <p className="text-sm text-zinc-500">Drop here</p>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
                <Badge className="border border-zinc-500/30 bg-zinc-500/20 text-zinc-400">
                  Yet to Start
                </Badge>
                <ArrowRight className="size-4 text-zinc-500" />
                <Badge className="border border-sky-500/30 bg-sky-500/20 text-sky-400">
                  In Progress
                </Badge>
                <ArrowRight className="size-4 text-zinc-500" />
                <Badge className="border border-emerald-500/30 bg-emerald-500/20 text-emerald-400">
                  Accepted
                </Badge>
                <ArrowRight className="size-4 text-zinc-500" />
                <Badge className="border border-zinc-500/30 bg-zinc-500/20 text-zinc-500">
                  Completed
                </Badge>
              </div>
            )}

            {currentStep === 2 && (
              <div className="mt-6 flex justify-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="size-12 rounded-lg border border-sky-400/30 bg-gradient-to-br from-sky-500/20 to-sky-600/10" />
                  <span className="text-xs text-sky-400">Bookings</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="size-12 rounded-lg border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10" />
                  <span className="text-xs text-emerald-400">Todos</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="size-12 rounded-lg border border-violet-400/30 bg-gradient-to-br from-violet-500/20 to-violet-600/10" />
                  <span className="text-xs text-violet-400">Wolistic</span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={onSkip}
              className="border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              Skip Tutorial
            </Button>
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button
                  variant="ghost"
                  onClick={handlePrevious}
                  className="border-white/10 hover:bg-white/5"
                >
                  Previous
                </Button>
              )}
              <Button
                onClick={handleNext}
                className="gap-2 bg-emerald-500 text-white hover:bg-emerald-600"
              >
                {currentStep === tutorialSteps.length - 1 ? (
                  <>
                    <CheckCircle2 className="size-4" />
                    Got it!
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
