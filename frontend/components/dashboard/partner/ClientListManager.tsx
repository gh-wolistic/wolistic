"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, UserCheck, Clock, Mail, StickyNote, Users } from "lucide-react";

import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type { ExpertClient } from "@/types/professional";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function fetchClients(token: string): Promise<ExpertClient[]> {
  const res = await fetch(`${API_BASE}/api/v1/professionals/me/clients?limit=100`, {
    mode: "cors",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load client list");
  const data: Array<{
    id: number;
    professional_id: string;
    client_user_id: string | null;
    client_name: string;
    client_email: string;
    service_notes: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  }> = await res.json();
  return data.map((c) => ({
    id: c.id,
    professionalId: c.professional_id,
    clientUserId: c.client_user_id,
    clientName: c.client_name,
    clientEmail: c.client_email,
    serviceNotes: c.service_notes,
    status: c.status,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));
}

async function addClient(
  token: string,
  payload: { client_name: string; client_email: string; service_notes: string | null },
): Promise<ExpertClient> {
  const res = await fetch(`${API_BASE}/api/v1/professionals/me/clients`, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Failed to add client");
  }
  const c = await res.json() as {
    id: number;
    professional_id: string;
    client_user_id: string | null;
    client_name: string;
    client_email: string;
    service_notes: string | null;
    status: string;
    created_at: string;
    updated_at: string;
  };
  return {
    id: c.id,
    professionalId: c.professional_id,
    clientUserId: c.client_user_id,
    clientName: c.client_name,
    clientEmail: c.client_email,
    serviceNotes: c.service_notes,
    status: c.status,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

async function removeClient(token: string, clientId: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/v1/professionals/me/clients/${clientId}`, {
    method: "DELETE",
    mode: "cors",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to remove client");
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  pending: {
    label: "Pending",
    icon: <Clock className="h-3 w-3" />,
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  registered: {
    label: "Registered",
    icon: <UserCheck className="h-3 w-3" />,
    className: "bg-sky-100 text-sky-700 border-sky-200",
  },
  reviewed: {
    label: "Reviewed",
    icon: <UserCheck className="h-3 w-3" />,
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

export function ClientListManager() {
  const { accessToken, status } = useAuthSession();

  const [clients, setClients] = useState<ExpertClient[]>([]);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [loadError, setLoadError] = useState("");

  // Add form state
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState("");

  // Remove state
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;

    let active = true;
    setLoadState("loading");

    void (async () => {
      try {
        const data = await fetchClients(accessToken);
        if (!active) return;
        setClients(data);
        setLoadState("ready");
      } catch (err) {
        if (!active) return;
        setLoadError(err instanceof Error ? err.message : "Unknown error");
        setLoadState("error");
      }
    })();

    return () => { active = false; };
  }, [accessToken, status]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!accessToken) return;

    setIsAdding(true);
    setAddError("");

    try {
      const client = await addClient(accessToken, {
        client_name: name.trim(),
        client_email: email.trim().toLowerCase(),
        service_notes: notes.trim() || null,
      });
      setClients((prev) => [client, ...prev]);
      setName("");
      setEmail("");
      setNotes("");
      setShowForm(false);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Failed to add client");
    } finally {
      setIsAdding(false);
    }
  }

  async function handleRemove(clientId: number) {
    if (!accessToken) return;
    setRemovingId(clientId);
    try {
      await removeClient(accessToken, clientId);
      setClients((prev) => prev.filter((c) => c.id !== clientId));
    } catch {
      // silently ignore — client stays in list
    } finally {
      setRemovingId(null);
    }
  }

  const pendingCount = clients.filter((c) => c.status === "pending").length;
  const registeredCount = clients.filter((c) => c.status === "registered").length;
  const reviewedCount = clients.filter((c) => c.status === "reviewed").length;

  return (
    <Card className="border-zinc-200/70 bg-white/70 shadow-lg backdrop-blur-sm">
      <CardContent className="space-y-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-zinc-500" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">Client List</h2>
          </div>
          <Button
            size="sm"
            variant={showForm ? "outline" : "default"}
            className="h-7 gap-1 text-xs"
            onClick={() => { setShowForm((v) => !v); setAddError(""); }}
          >
            <Plus className="h-3 w-3" />
            {showForm ? "Cancel" : "Add Client"}
          </Button>
        </div>

        {/* Summary badges */}
        {loadState === "ready" && clients.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs text-zinc-600">
              <span className="font-semibold text-zinc-900">{clients.length}</span> total
            </span>
            {registeredCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs text-sky-700">
                <UserCheck className="h-3 w-3" />
                <span className="font-semibold">{registeredCount}</span> registered
              </span>
            )}
            {pendingCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs text-amber-700">
                <Clock className="h-3 w-3" />
                <span className="font-semibold">{pendingCount}</span> pending
              </span>
            )}
            {reviewedCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-700">
                <UserCheck className="h-3 w-3" />
                <span className="font-semibold">{reviewedCount}</span> reviewed
              </span>
            )}
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <form
            onSubmit={handleAdd}
            className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4"
          >
            <p className="text-xs font-medium text-zinc-700">
              Adding a client allows them to leave you a review on your public profile.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="cl-name" className="text-xs">Full Name *</Label>
                <Input
                  id="cl-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith"
                  required
                  maxLength={255}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="cl-email" className="text-xs">Email Address *</Label>
                <Input
                  id="cl-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@example.com"
                  required
                  maxLength={255}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cl-notes" className="text-xs">Session Notes (optional)</Label>
              <Textarea
                id="cl-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Yoga therapy sessions, 3 months"
                maxLength={1000}
                rows={2}
                className="resize-none text-sm"
              />
            </div>
            {addError && <p className="text-xs text-red-600">{addError}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="h-7 text-xs" disabled={isAdding}>
                {isAdding ? "Adding…" : "Add to List"}
              </Button>
            </div>
          </form>
        )}

        {/* Loading */}
        {loadState === "loading" && (
          <div className="space-y-2">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
        )}

        {/* Error */}
        {loadState === "error" && (
          <p className="text-sm text-red-600">{loadError}</p>
        )}

        {/* Empty state */}
        {loadState === "ready" && clients.length === 0 && !showForm && (
          <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center">
            <Users className="mx-auto mb-2 h-6 w-6 text-zinc-400" />
            <p className="text-sm font-medium text-zinc-700">No clients yet</p>
            <p className="mt-1 text-xs text-zinc-500">
              Add past or current clients so they can leave you a verified review.
            </p>
          </div>
        )}

        {/* Client rows */}
        {loadState === "ready" && clients.length > 0 && (
          <div className="space-y-2">
            {clients.map((client) => {
              const statusCfg = statusConfig[client.status] ?? statusConfig["pending"];
              return (
                <div
                  key={client.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200/80 bg-white px-3 py-2.5"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-medium text-zinc-900">{client.clientName}</span>
                      <Badge
                        variant="outline"
                        className={`inline-flex items-center gap-1 text-[10px] ${statusCfg.className}`}
                      >
                        {statusCfg.icon}
                        {statusCfg.label}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {client.clientEmail}
                      </span>
                      {client.serviceNotes && (
                        <span className="inline-flex items-center gap-1">
                          <StickyNote className="h-3 w-3" />
                          {client.serviceNotes}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-zinc-400 hover:text-red-600"
                    onClick={() => handleRemove(client.id)}
                    disabled={removingId === client.id}
                    title="Remove client"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
