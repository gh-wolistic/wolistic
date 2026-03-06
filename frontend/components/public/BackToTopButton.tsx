"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

import { Button } from "@/components/ui/button";

type BackToTopButtonProps = {
  threshold?: number;
};

export function BackToTopButton({ threshold = 320 }: BackToTopButtonProps) {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setShowBackToTop(window.scrollY > threshold);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [threshold]);

  if (!showBackToTop) {
    return null;
  }

  return (
    <Button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 h-10 w-10 rounded-full p-0 bg-linear-to-r from-emerald-500 to-teal-600 text-white shadow-lg hover:from-emerald-600 hover:to-teal-700"
      aria-label="Back to top"
      title="Back to top"
    >
      <ArrowUp size={18} />
    </Button>
  );
}