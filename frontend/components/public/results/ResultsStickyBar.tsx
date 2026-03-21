"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";

type ResultsStickyBarProps = {
  scopeTabs: ReactNode;
  toolbar: ReactNode;
};

const COLLAPSE_SCROLL_Y = 140;
const EXPAND_SCROLL_Y = 16;
const MANUAL_CLOSE_DELTA = 12;

export function ResultsStickyBar({ scopeTabs, toolbar }: ResultsStickyBarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const lastScrollY = useRef(0);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const handleScroll = useCallback(() => {
    const y = window.scrollY;

    setCollapsed((previous) => {
      if (!previous && y >= COLLAPSE_SCROLL_Y) {
        return true;
      }
      // Only auto-expand very close to top to avoid oscillation when sticky height changes.
      if (previous && y <= EXPAND_SCROLL_Y) {
        return false;
      }
      return previous;
    });

    setManualOpen((previous) => {
      if (!previous) {
        return previous;
      }
      if (y <= EXPAND_SCROLL_Y) {
        return false;
      }
      if (y > lastScrollY.current + MANUAL_CLOSE_DELTA) {
        return false;
      }
      return previous;
    });

    lastScrollY.current = y;
  }, []);

  useEffect(() => {
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const openToolbar = () => {
    setManualOpen(true);
    if (toolbarRef.current) {
      toolbarRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      const input = toolbarRef.current.querySelector<HTMLInputElement>(
        'input[aria-label="Search results"]'
      );
      input?.focus();
    }
  };

  const showToolbar = !collapsed || manualOpen;

  return (
    <section className="sticky top-20 z-40 border-b border-border bg-background/95">
      <div className="container mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="space-y-2.5">
          {/* Row: scope tabs + (when collapsed) search toggle */}
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">{scopeTabs}</div>

            {collapsed && !manualOpen && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full"
                onClick={openToolbar}
                aria-label="Show search bar"
              >
                <Search size={16} />
              </Button>
            )}
          </div>

          {/* Toolbar: animated collapse */}
          <div
            className={`grid transition-all duration-200 ease-in-out ${
              showToolbar
                ? "grid-rows-[1fr] opacity-100"
                : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div ref={toolbarRef} className="overflow-hidden">
              {toolbar}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
