"use client";

import { useEffect, useMemo, useState } from "react";

export const sectionLinks = [
  { href: "#short-bio", label: "Short Bio" },
  { href: "#about", label: "About" },
  { href: "#approach", label: "Approach" },
  { href: "#expertise", label: "Areas of Expertise" },
  { href: "#education", label: "Education & Certifications" },
  { href: "#services", label: "Services & Pricing" },
  { href: "#gallery", label: "Gallery & Feed" },
  { href: "#reviews", label: "Client Reviews" },
];

export function DesktopSectionNav() {
  const sectionIds = useMemo(
    () => sectionLinks.map((link) => link.href.replace("#", "")),
    [],
  );
  const [activeSectionId, setActiveSectionId] = useState(sectionIds[0] ?? "");

  useEffect(() => {
    const findActiveSection = () => {
      const marker = window.scrollY + 180;

      const visibleSections = sectionIds
        .map((id) => {
          const element = document.getElementById(id);
          if (!element) {
            return null;
          }
          return { id, top: element.offsetTop };
        })
        .filter((entry): entry is { id: string; top: number } => entry !== null)
        .sort((left, right) => left.top - right.top);

      if (visibleSections.length === 0) {
        return;
      }

      let nextActiveId = visibleSections[0].id;
      for (const section of visibleSections) {
        if (section.top <= marker) {
          nextActiveId = section.id;
        } else {
          break;
        }
      }

      setActiveSectionId(nextActiveId);
    };

    const onScroll = () => {
      window.requestAnimationFrame(findActiveSection);
    };

    findActiveSection();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", findActiveSection);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", findActiveSection);
    };
  }, [sectionIds]);

  return (
    <aside className="hidden lg:block">
      <div className="sticky top-32 rounded-xl border border-border bg-background p-4">
        <p className="mb-3 text-sm font-medium text-muted-foreground">On this page</p>
        <nav aria-label="Section navigation">
          <ul className="space-y-1">
            {sectionLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  aria-current={activeSectionId === link.href.replace("#", "") ? "location" : undefined}
                  className={`block rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
                    activeSectionId === link.href.replace("#", "")
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
