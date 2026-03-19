"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { getProfessionalEditorPayload, updateProfessionalEditorPayload } from "@/components/dashboard/profile/profileEditorApi";
import { ProfileBasicsSection } from "@/components/dashboard/profile/sections/ProfileBasicsSection";
import { ProfileBookingSection } from "@/components/dashboard/profile/sections/ProfileBookingSection";
import { ProfilePracticeSection } from "@/components/dashboard/profile/sections/ProfilePracticeSection";
import { ProfileServicesSection } from "@/components/dashboard/profile/sections/ProfileServicesSection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProfessionalEditorPayload } from "@/types/professional-editor";

function parseLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseObjectRows(field: "approaches" | "expertise_areas" | "certifications" | "gallery", text: string) {
  const rows = parseLines(text);

  if (field === "approaches" || field === "expertise_areas") {
    return rows.map((row) => {
      const [title = "", description = ""] = row.split("|");
      return { title: title.trim(), description: description.trim() };
    });
  }

  if (field === "certifications") {
    return rows.map((row) => {
      const [name = "", issuer = "", issuedYear = ""] = row.split("|");
      return {
        name: name.trim(),
        issuer: issuer.trim(),
        issued_year: issuedYear.trim() ? Number(issuedYear.trim()) : undefined,
      };
    });
  }

  return rows.map((row, index) => {
    const [imageUrl = "", caption = "", displayOrder = ""] = row.split("|");
    return {
      image_url: imageUrl.trim(),
      caption: caption.trim(),
      display_order: displayOrder.trim() ? Number(displayOrder.trim()) : index,
    };
  });
}

export default function ExpertProfileEditPage() {
  const { user, accessToken } = useAuthSession();
  const [editorData, setEditorData] = useState<ProfessionalEditorPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    void (async () => {
      try {
        const payload = await getProfessionalEditorPayload(accessToken);
        if (!active) return;
        setEditorData(payload);
      } catch (caughtError) {
        if (!active) return;
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load profile editor data.");
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [accessToken]);

  const completion = useMemo(() => {
    if (!editorData) return 0;
    const checks = [
      Boolean(editorData.username),
      Boolean(editorData.specialization),
      Boolean(editorData.short_bio),
      Boolean(editorData.about),
      editorData.services.length > 0,
      editorData.availability_slots.length > 0,
      editorData.booking_question_templates.length > 0,
      editorData.languages.length > 0,
    ];
    const passed = checks.filter(Boolean).length;
    return Math.round((passed / checks.length) * 100);
  }, [editorData]);

  const handleSave = async () => {
    if (!accessToken || !editorData) {
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    setError(null);

    try {
      const updated = await updateProfessionalEditorPayload(accessToken, editorData);
      setEditorData(updated);
      setSaveMessage("Profile changes saved.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save profile right now.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return <p className="text-sm text-zinc-600">Sign in to manage your profile.</p>;
  }

  if (isLoading) {
    return <p className="text-sm text-zinc-600">Loading profile editor...</p>;
  }

  if (!editorData) {
    return <p className="text-sm text-red-600">{error ?? "Profile editor is unavailable for this account."}</p>;
  }

  return (
    <section className="space-y-4">
      <header className="rounded-xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Expert Workspace</p>
            <h1 className="mt-1 text-2xl font-semibold text-zinc-900">Profile Studio</h1>
            <p className="mt-1 text-sm text-zinc-600">Edit once, publish everywhere: public profile, booking intake, and service catalog.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600 text-white">{completion}% complete</Badge>
            <Button type="button" variant="outline" asChild>
              <Link href="/v1/profile/view-as-public">View as Public</Link>
            </Button>
            <Button type="button" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Updates"}
            </Button>
          </div>
        </div>

        {saveMessage ? <p className="mt-2 text-sm text-emerald-700">{saveMessage}</p> : null}
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </header>

      <Tabs defaultValue="basics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="practice">Practice</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="booking">Booking</TabsTrigger>
        </TabsList>

        <TabsContent value="basics">
          <ProfileBasicsSection
            value={editorData}
            onFieldChange={(field, nextValue) =>
              setEditorData((current) => (current ? { ...current, [field]: nextValue } : current))
            }
          />
        </TabsContent>

        <TabsContent value="practice">
          <ProfilePracticeSection
            value={editorData}
            onStringListChange={(field, nextValue) =>
              setEditorData((current) => (current ? { ...current, [field]: parseLines(nextValue) } : current))
            }
            onObjectListChange={(field, nextValue) =>
              setEditorData((current) => (current ? { ...current, [field]: parseObjectRows(field, nextValue) } : current))
            }
          />
        </TabsContent>

        <TabsContent value="services">
          <ProfileServicesSection
            value={editorData}
            onServicesChange={(services) => setEditorData((current) => (current ? { ...current, services } : current))}
          />
        </TabsContent>

        <TabsContent value="booking">
          <ProfileBookingSection
            value={editorData}
            onAvailabilityChange={(availability_slots) =>
              setEditorData((current) => (current ? { ...current, availability_slots } : current))
            }
            onQuestionTemplatesChange={(booking_question_templates) =>
              setEditorData((current) => (current ? { ...current, booking_question_templates } : current))
            }
          />
        </TabsContent>
      </Tabs>
    </section>
  );
}
