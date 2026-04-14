"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/components/ui/utils";
import { LANGUAGES } from "@/lib/languages";

type LanguageMultiSelectProps = {
  value: string[];
  onChange: (languages: string[]) => void;
  placeholder?: string;
  maxItems?: number;
};

export function LanguageMultiSelect({
  value,
  onChange,
  placeholder = "Select languages...",
  maxItems = 5,
}: LanguageMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const isAtMax = value.length >= maxItems;

  const toggleLanguage = (language: string) => {
    if (value.includes(language)) {
      onChange(value.filter((l) => l !== language));
    } else if (value.length < maxItems) {
      onChange([...value, language]);
    }
  };

  const removeLanguage = (language: string) => {
    onChange(value.filter((l) => l !== language));
  };

  return (
    <div className="space-y-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="h-12 w-full justify-between rounded-xl border-white/10 bg-white/5 text-white hover:bg-white/10 hover:text-white"
          >
            <span className="truncate text-zinc-400">
              {value.length > 0
                ? `${value.length}/${maxItems} language${value.length === 1 ? "" : "s"} selected${isAtMax ? " (Max reached)" : ""}`
                : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[--radix-popover-trigger-width] p-0 border-white/10 bg-zinc-900"
          align="start"
        >
          <Command className="bg-transparent">
            <CommandInput 
              placeholder="Search languages..." 
              className="text-white placeholder:text-zinc-500"
            />
            <CommandList className="max-h-[300px]">
              <CommandEmpty className="text-zinc-400">No language found.</CommandEmpty>
              <CommandGroup>
                {LANGUAGES.map((language) => {
                  const isSelected = value.includes(language);
                  return (
                    <CommandItem
                      key={language}
                      value={language}
                      onSelect={() => toggleLanguage(language)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-white",
                        "hover:bg-white/10 aria-selected:bg-white/10",
                        isSelected && "bg-emerald-500/10",
                        !isSelected && isAtMax && "opacity-50 cursor-not-allowed",
                        (!isSelected && !isAtMax) && "cursor-pointer"
                      )}
                      disabled={!isSelected && isAtMax}
                    >
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border",
                          isSelected
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-white/30"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>
                      <span className={cn(isSelected && "font-medium")}>{language}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Languages as Removable Chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((language) => (
            <Badge
              key={language}
              variant="outline"
              className="gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-300 pl-3 pr-2 py-1"
            >
              {language}
              <button
                type="button"
                onClick={() => removeLanguage(language)}
                className="ml-1 rounded-sm hover:bg-emerald-500/20 focus:outline-hidden"
                aria-label={`Remove ${language}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
