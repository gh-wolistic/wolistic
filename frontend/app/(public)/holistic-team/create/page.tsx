"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createHolisticTeam } from "@/components/public/data/holisticTeamsApi";
import { useSessionStore } from "@/store/session";
import { Button } from "@/components/ui/button";

export default function CreateHolisticTeamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authToken = useSessionStore((state) => state.token);

  const query = searchParams.get("q") ?? "";
  const scope = searchParams.get("scope") ?? "professionals";

  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState(query.trim());
  const [mode, setMode] = useState("online");
  const [packageType, setPackageType] = useState("consultation_only");
  const [pricingAmount, setPricingAmount] = useState("0");
  const [memberRows, setMemberRows] = useState([
    { professionalId: "", role: "body", sessionsIncluded: "1" },
    { professionalId: "", role: "mind", sessionsIncluded: "1" },
    { professionalId: "", role: "diet", sessionsIncluded: "1" },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isLoggedIn = !!authToken;

  const parsedKeywords = useMemo(
    () => keywords.split(",").map((item) => item.trim()).filter(Boolean),
    [keywords],
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isLoggedIn || !authToken) {
      const nextPath = `/holistic-team/create?q=${encodeURIComponent(query)}&scope=${encodeURIComponent(scope)}`;
      router.push(`/authorized?next=${encodeURIComponent(nextPath)}`);
      return;
    }

    const members = memberRows
      .map((row) => ({
        professionalId: row.professionalId.trim(),
        role: row.role.trim().toLowerCase(),
        sessionsIncluded: Number.parseInt(row.sessionsIncluded, 10) || 1,
      }))
      .filter((row) => row.professionalId);

    if (members.length !== 3) {
      setError("Add exactly 3 members: body, mind, and diet.");
      return;
    }

    if (parsedKeywords.length === 0) {
      setError("Add at least one keyword.");
      return;
    }

    setSubmitting(true);
    try {
      const team = await createHolisticTeam(
        {
          name: name.trim() || undefined,
          scope,
          keywords: parsedKeywords,
          mode,
          packageType,
          pricingAmount: Number.parseFloat(pricingAmount) || 0,
          pricingCurrency: "INR",
          members,
        },
        authToken,
      );
      router.replace(`/holistic-team/${team.id}?q=${encodeURIComponent(query)}&scope=${encodeURIComponent(scope)}`);
    } catch (err) {
      console.error(err);
      setError("Unable to create team. Check professional IDs and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
        <div className="space-y-2 mb-6">
          <h1 className="text-2xl font-semibold">Create your own team collaboration</h1>
          <p className="text-sm text-muted-foreground">Add keywords so your team is discoverable in search. A team needs at least 2 members.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-white dark:bg-slate-950/60 p-6 space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Team name (optional)</label>
            <input className="w-full h-10 rounded-md border px-3 bg-background" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Keywords (comma separated)</label>
            <input className="w-full h-10 rounded-md border px-3 bg-background" value={keywords} onChange={(e) => setKeywords(e.target.value)} placeholder="diet, adhd, stress" />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Mode</label>
              <select className="w-full h-10 rounded-md border px-3 bg-background" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Package type</label>
              <select className="w-full h-10 rounded-md border px-3 bg-background" value={packageType} onChange={(e) => setPackageType(e.target.value)}>
                <option value="consultation_only">Consultation only</option>
                <option value="multi_session">Multiple sessions</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Price</label>
              <input className="w-full h-10 rounded-md border px-3 bg-background" value={pricingAmount} onChange={(e) => setPricingAmount(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium">Members</p>
            {memberRows.map((row, index) => (
              <div key={`member-${index}`} className="grid sm:grid-cols-[1.8fr_1fr_1fr] gap-2">
                <input
                  className="h-10 rounded-md border px-3 bg-background"
                  value={row.professionalId}
                  onChange={(e) => {
                    const next = [...memberRows];
                    next[index] = { ...next[index], professionalId: e.target.value };
                    setMemberRows(next);
                  }}
                  placeholder="Professional UUID"
                />
                <input
                  className="h-10 rounded-md border px-3 bg-muted text-foreground capitalize"
                  value={row.role}
                  readOnly
                />
                <input
                  className="h-10 rounded-md border px-3 bg-background"
                  value={row.sessionsIncluded}
                  onChange={(e) => {
                    const next = [...memberRows];
                    next[index] = { ...next[index], sessionsIncluded: e.target.value };
                    setMemberRows(next);
                  }}
                  placeholder="Sessions"
                />
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" disabled={submitting} className="bg-linear-to-r from-emerald-500 to-teal-600 text-white">
            {submitting ? "Creating..." : "Create team"}
          </Button>
        </form>
      </div>
    </div>
  );
}
