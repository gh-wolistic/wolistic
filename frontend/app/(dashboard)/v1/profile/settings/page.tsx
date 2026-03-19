import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function ExpertProfileSettingsPage() {
  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-500">Profile Controls</p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Profile Settings</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600">
          Use Profile Studio for content and booking setup updates. This settings space is reserved for visibility, moderation,
          and account-level profile controls.
        </p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
        Strategic UX note: keep high-frequency editing in Profile Studio, and keep low-frequency account controls in Settings.
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" asChild>
          <Link href="/v1/profile/edit">Open Profile Studio</Link>
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/v1/profile/view-as-public">View as Public</Link>
        </Button>
      </div>
    </section>
  );
}
