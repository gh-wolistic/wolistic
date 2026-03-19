import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { ProfessionalEditorPayload, ProfessionalServiceInput } from "@/types/professional-editor";

type ProfileServicesSectionProps = {
  value: ProfessionalEditorPayload;
  onServicesChange: (services: ProfessionalServiceInput[]) => void;
};

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

export function ProfileServicesSection({ value, onServicesChange }: ProfileServicesSectionProps) {
  const updateService = (index: number, nextService: ProfessionalServiceInput) => {
    const next = [...value.services];
    next[index] = nextService;
    onServicesChange(next);
  };

  const removeService = (index: number) => {
    const next = value.services.filter((_, itemIndex) => itemIndex !== index);
    onServicesChange(next);
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Services & Pricing</h2>
          <p className="mt-1 text-sm text-zinc-600">Manage all offerings that feed your booking and payment flows.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => onServicesChange([...value.services, createEmptyService()])}>
          <Plus className="h-4 w-4" /> Add Service
        </Button>
      </div>

      <div className="mt-4 space-y-4">
        {value.services.map((service, index) => (
          <div key={index} className="rounded-lg border border-zinc-200 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="text-sm font-medium text-zinc-900">Service {index + 1}</p>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeService(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  value={service.name}
                  onChange={(event) => updateService(index, { ...service, name: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Mode</Label>
                <Input
                  value={service.mode}
                  onChange={(event) => updateService(index, { ...service, mode: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Price</Label>
                <Input
                  type="number"
                  min={0}
                  value={service.price}
                  onChange={(event) => updateService(index, { ...service, price: Number(event.target.value || 0) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Offer Type</Label>
                <Input
                  value={service.offer_type}
                  onChange={(event) => updateService(index, { ...service, offer_type: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duration Value</Label>
                <Input
                  type="number"
                  min={1}
                  value={service.duration_value}
                  onChange={(event) =>
                    updateService(index, { ...service, duration_value: Number(event.target.value || 1) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duration Unit</Label>
                <Input
                  value={service.duration_unit}
                  onChange={(event) => updateService(index, { ...service, duration_unit: event.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Short Brief</Label>
                <Input
                  value={service.short_brief}
                  onChange={(event) => updateService(index, { ...service, short_brief: event.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Offers</Label>
                <Input
                  value={service.offers}
                  onChange={(event) => updateService(index, { ...service, offers: event.target.value })}
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2">
              <div className="text-sm text-zinc-700">Service active</div>
              <Switch
                checked={service.is_active}
                onCheckedChange={(checked) => updateService(index, { ...service, is_active: checked })}
              />
            </div>
          </div>
        ))}

        {value.services.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
            No services yet. Add your first service to enable streamlined booking and payments.
          </p>
        ) : null}
      </div>
    </section>
  );
}
