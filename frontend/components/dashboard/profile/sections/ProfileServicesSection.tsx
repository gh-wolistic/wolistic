import { Check, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ProfessionalEditorPayload, ProfessionalServiceInput } from "@/types/professional-editor";

type ProfileServicesSectionProps = {
  value: ProfessionalEditorPayload;
  onServicesChange: (services: ProfessionalServiceInput[]) => void;
};

const SERVICE_MODES = ["online", "offline", "hybrid"] as const;

function createEmptyService(): ProfessionalServiceInput {
  return {
    name: "",
    short_brief: "",
    price: 0,
    offers: "",
    negotiable: false,
    offer_type: "none",
    offer_label: "",
    mode: "online",
    duration_value: 30,
    duration_unit: "mins",
    is_active: true,
  };
}

function parseModes(mode: string): string[] {
  return mode
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function ProfileServicesSection({ value, onServicesChange }: ProfileServicesSectionProps) {
  const updateService = (index: number, nextService: ProfessionalServiceInput) => {
    const next = [...value.services];
    next[index] = nextService;
    onServicesChange(next);
  };

  const removeService = (index: number) => {
    onServicesChange(value.services.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-semibold text-white">
            <span className="text-emerald-400">$</span> Services & Pricing
          </h3>
          <p className="mt-1 text-sm text-zinc-400">Define your service offerings and pricing structure</p>
        </div>
        <Button
          type="button"
          className="h-11 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 px-5 text-white"
          onClick={() => onServicesChange([...value.services, createEmptyService()])}
        >
          <Plus className="h-4 w-4" /> Add Service
        </Button>
      </div>

      <div className="space-y-6">
        {value.services.map((service, index) => {
          const selectedModes = parseModes(service.mode);

          return (
            <div key={index} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6">
              <div className="mb-4 flex items-start justify-between">
                <h4 className="text-base font-semibold text-white">Service #{index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  onClick={() => removeService(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block text-sm text-zinc-300">Service Name *</Label>
                  <Input
                    className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                    value={service.name}
                    onChange={(event) => updateService(index, { ...service, name: event.target.value })}
                    placeholder="Individual Coaching Session"
                  />
                </div>

                <div>
                  <Label className="mb-2 block text-sm text-zinc-300">Mode *</Label>
                  <div className="flex flex-wrap gap-4">
                    {SERVICE_MODES.map((mode) => {
                      const checked = selectedModes.includes(mode);
                      return (
                        <label key={mode} className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-300">
                          <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all ${
                              checked ? "border-emerald-500 bg-emerald-500" : "border-white/30 bg-white/5"
                            }`}
                          >
                            {checked ? <Check className="h-3.5 w-3.5 text-white" /> : null}
                          </span>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={checked}
                            onChange={(event) => {
                              const current = parseModes(service.mode);
                              const next = event.target.checked
                                ? [...new Set([...current, mode])]
                                : current.filter((item) => item !== mode);
                              updateService(index, { ...service, mode: next.join(",") || "online" });
                            }}
                          />
                          <span className="capitalize">{mode}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <Label className="mb-2 block text-sm text-zinc-300">Price/Session *</Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                      <Input
                        type="number"
                        min={0}
                        className="h-12 rounded-xl border-white/10 bg-white/5 pl-8 text-white"
                        value={service.price}
                        onChange={(event) =>
                          updateService(index, { ...service, price: Number(event.target.value || 0) })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm text-zinc-300">Session Duration *</Label>
                    <Input
                      type="number"
                      min={1}
                      className="h-12 rounded-xl border-white/10 bg-white/5 text-white"
                      value={service.duration_value}
                      onChange={(event) =>
                        updateService(index, { ...service, duration_value: Number(event.target.value || 1) })
                      }
                    />
                  </div>

                  <div>
                    <Label className="mb-2 block text-sm text-zinc-300">Duration Unit *</Label>
                    <Select
                      value={service.duration_unit}
                      onValueChange={(duration_unit) => updateService(index, { ...service, duration_unit })}
                    >
                      <SelectTrigger className="h-12 rounded-xl border-white/10 bg-white/5 text-white">
                        <SelectValue placeholder="Minutes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mins">Minutes</SelectItem>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="days">Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block text-sm text-zinc-300">Short Brief</Label>
                  <Input
                    className="h-14 rounded-xl border-white/10 bg-white/5 text-white"
                    value={service.short_brief}
                    onChange={(event) => updateService(index, { ...service, short_brief: event.target.value })}
                    placeholder="One-on-one personalized wellness coaching"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {value.services.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-white/20 bg-white/5 p-5 text-sm text-zinc-400">
          No services yet. Add your first service.
        </p>
      ) : null}
    </section>
  );
}
