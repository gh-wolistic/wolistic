"use client";

import { Check, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { useIsClient } from "@/hooks/use-is-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ThemeOption = "light" | "dark" | "system";

const themeOptions: { value: ThemeOption; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();

  if (!isClient) {
    return (
      <Button type="button" variant="ghost" size="icon" className="rounded-xl" aria-label="Theme switcher">
        <Sun size={18} />
      </Button>
    );
  }

  const activeTheme = (theme ?? "system") as ThemeOption;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="rounded-xl" aria-label="Theme switcher">
          {activeTheme === "light" && <Sun size={18} />}
          {activeTheme === "dark" && <Moon size={18} />}
          {activeTheme === "system" && <Monitor size={18} />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isActive = activeTheme === option.value;

          return (
            <DropdownMenuItem
              key={option.value}
              className="flex cursor-pointer items-center justify-between"
              onClick={() => setTheme(option.value)}
            >
              <span className="flex items-center gap-2">
                <Icon size={16} />
                {option.label}
              </span>
              {isActive ? <Check size={14} /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
