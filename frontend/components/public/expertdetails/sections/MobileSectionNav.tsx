"use client";

import { sectionLinks } from "./DesktopSectionNav";

export function MobileSectionNav() {
  return (
    <div className="lg:hidden">
      <div className="sticky top-16 z-20 -mx-4 overflow-x-auto border-y border-border/60 bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <nav aria-label="Mobile section navigation">
          <div className="flex min-w-max gap-2">
            {sectionLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full border border-border bg-card px-3 py-2 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:border-emerald-300 hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}