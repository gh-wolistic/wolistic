import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { PublicHeader } from "@/components/public/PublicHeader";

vi.mock("next/image", () => ({
  default: ({ priority: _priority, ...props }: Record<string, unknown>) => <img alt="mock-image" {...props} />,
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...rest }: { children: ReactNode; href: string }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "light" }),
}));

vi.mock("@/hooks/use-is-client", () => ({
  useIsClient: () => true,
}));

vi.mock("@/components/theme/theme-switcher", () => ({
  ThemeSwitcher: () => <div data-testid="theme-switcher">Theme</div>,
}));

describe("PublicHeader", () => {
  it("shows auth CTAs for logged out users", () => {
    render(<PublicHeader onOpenAuth={vi.fn()} onDashboard={vi.fn()} onLogout={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));

    expect(screen.getAllByRole("button", { name: /sign in/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /get started/i }).length).toBeGreaterThan(0);
  });

  it("shows dashboard and sign out for logged in users", () => {
    render(
      <PublicHeader
        user={{
          name: "Jane Doe",
          email: "jane@example.com",
          type: "user",
        }}
        onOpenAuth={vi.fn()}
        onDashboard={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /open menu/i }));

    expect(screen.getByRole("button", { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });
});
