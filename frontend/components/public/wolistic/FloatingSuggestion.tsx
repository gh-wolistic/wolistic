"use client";

import React, { useEffect, useState } from "react";
import { MessageCircleQuestion, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEFAULT_IDLE_MS = 4000;

type FloatingSuggestionProps = {
  onAccept: () => void;
  idleMs?: number;
};

export function FloatingSuggestion({ onAccept, idleMs = DEFAULT_IDLE_MS }: FloatingSuggestionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const resetTimer = () => {
      setVisible(false);
      if (timer) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => setVisible(true), idleMs);
    };

    resetTimer();
    window.addEventListener("scroll", resetTimer);

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      window.removeEventListener("scroll", resetTimer);
    };
  }, [idleMs]);

  if (!visible) {
    return null;
  }

  return (
    <div className="fixed right-4 bottom-4 z-40 max-w-sm rounded-2xl border border-border bg-background shadow-xl p-4 backdrop-blur-sm">
      <div className="flex items-start gap-3">
        <div className="mt-1 rounded-xl bg-emerald-100 p-2 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-200">
          <MessageCircleQuestion size={18} />
        </div>
        <div className="space-y-2 flex-1">
          <p className="text-sm font-medium">Want an expert help?</p>
          <p className="text-xs text-muted-foreground">We are here to make your journey easier.</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={onAccept} className="bg-linear-to-r from-emerald-500 to-teal-600 text-white">
              Yes
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setVisible(false)}>
              <X size={14} className="mr-1" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
