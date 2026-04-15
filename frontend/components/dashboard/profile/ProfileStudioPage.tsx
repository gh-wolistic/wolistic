"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Calendar,
  ChevronRight,
  CheckCircle2,
  Eye,
  Globe,
  Save,
  Sparkles,
  Upload,
  User,
} from "lucide-react";

import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import { getProfessionalEditorPayload, publishProfessionalProfile, updateProfessionalEditorPayload } from "@/components/dashboard/profile/profileEditorApi";
import {
  deleteDashboardMedia,
  listMyMediaAssets,
  uploadDashboardImage,
  type MediaAsset,
} from "@/components/dashboard/profile/profileMediaApi";
import { ProfileBasicsSection } from "@/components/dashboard/profile/sections/ProfileBasicsSection";
import { ProfileBookingSection } from "@/components/dashboard/profile/sections/ProfileBookingSection";
import { ProfileIdentitySocialSection } from "@/components/dashboard/profile/sections/ProfileIdentitySocialSection";
import { ProfilePracticeSection } from "@/components/dashboard/profile/sections/ProfilePracticeSection";
import { ProfileServicesSection } from "@/components/dashboard/profile/sections/ProfileServicesSection";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileStudioSidePanel } from "@/components/dashboard/profile/ProfileStudioSidePanel";
import type { ProfessionalEditorPayload } from "@/types/professional-editor";

type ProfileTabKey = "basics" | "practice" | "identity" | "services" | "booking";
const profileTabs: ProfileTabKey[] = ["basics", "practice", "identity", "services", "booking"];

export function ProfileStudioPage() {
  const { user, accessToken } = useAuthSession();
  const [activeTab, setActiveTab] = useState<ProfileTabKey>("basics");
  const [editorData, setEditorData] = useState<ProfessionalEditorPayload | null>(null);
  const [mediaBySurface, setMediaBySurface] = useState<Record<string, MediaAsset>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isMediaBusy, setIsMediaBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [saveEpoch, setSaveEpoch] = useState(0);

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
        const mediaAssets = await listMyMediaAssets(accessToken);
        if (!active) return;
        setEditorData(payload);
        setIsPublished(false); // TODO: Add published status to backend API
        const nextBySurface: Record<string, MediaAsset> = {};
        for (const asset of mediaAssets) {
          if ((asset.surface === "profile" || asset.surface === "cover") && !nextBySurface[asset.surface]) {
            nextBySurface[asset.surface] = asset;
          }
        }
        setMediaBySurface(nextBySurface);
      } catch (caughtError) {
        if (!active) return;
        setError(caughtError instanceof Error ? caughtError.message : "Unable to load profile editor data.");
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => { active = false; };
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
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [editorData]);

  const initials = useMemo(() => {
    const source = editorData?.username?.trim() || user?.name || "";
    if (!source) return "SM";
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  }, [editorData?.username, user?.name]);

  const handleSave = async () => {
    if (!accessToken || !editorData) return;
    setIsSaving(true);
    setSaveMessage(null);
    setError(null);
    try {
      const updated = await updateProfessionalEditorPayload(accessToken, editorData);
      setEditorData(updated);
      setSaveEpoch((n) => n + 1);
      setSaveMessage("Profile changes saved. Click Publish to make it visible to clients.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save profile right now.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!accessToken || !editorData) return;
    setIsPublishing(true);
    setSaveMessage(null);
    setError(null);
    try {
      // Save first, then publish
      const updated = await updateProfessionalEditorPayload(accessToken, editorData);
      setEditorData(updated);
      await publishProfessionalProfile(accessToken);
      
      // Reload media assets to reflect any removals
      const mediaAssets = await listMyMediaAssets(accessToken);
      const nextBySurface: Record<string, MediaAsset> = {};
      for (const asset of mediaAssets) {
        if ((asset.surface === "profile" || asset.surface === "cover") && !nextBySurface[asset.surface]) {
          nextBySurface[asset.surface] = asset;
        }
      }
      setMediaBySurface(nextBySurface);
      
      setSaveEpoch((n) => n + 1);
      setIsPublished(true);
      setSaveMessage("Profile published and live.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to publish profile right now.");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleImageUpload = async (surface: "profile" | "cover", file: File) => {
    if (!accessToken) return;
    setIsMediaBusy(true);
    setError(null);
    setSaveMessage(null);
    try {
      const uploaded = await uploadDashboardImage(accessToken, file, surface);
      setMediaBySurface((current) => ({ ...current, [surface]: uploaded.media }));
      setEditorData((current) => {
        if (!current) return current;
        // Store the relative object_path, not the full signed URL
        if (surface === "profile") return { ...current, profile_image_url: uploaded.media.object_path };
        return { ...current, cover_image_url: uploaded.media.object_path };
      });
      setSaveMessage(`${surface === "profile" ? "Profile" : "Cover"} image uploaded.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to upload image right now.");
    } finally {
      setIsMediaBusy(false);
    }
  };

  const handleImageRemove = async (surface: "profile" | "cover") => {
    if (!accessToken) return;
    setIsMediaBusy(true);
    setError(null);
    setSaveMessage(null);
    try {
      const media = mediaBySurface[surface];
      if (media) await deleteDashboardMedia(accessToken, media);
      setMediaBySurface((current) => {
        const next = { ...current };
        delete next[surface];
        return next;
      });
      setEditorData((current) => {
        if (!current) return current;
        if (surface === "profile") return { ...current, profile_image_url: "" };
        return { ...current, cover_image_url: "" };
      });
      setSaveMessage(`${surface === "profile" ? "Profile" : "Cover"} image removed.`);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to remove image right now.");
    } finally {
      setIsMediaBusy(false);
    }
  };

  const goToPreviousTab = () => {
    const currentIndex = profileTabs.indexOf(activeTab);
    if (currentIndex > 0) setActiveTab(profileTabs[currentIndex - 1]);
  };

  const handleSaveAndNext = async () => {
    await handleSave();
    const currentIndex = profileTabs.indexOf(activeTab);
    if (currentIndex >= 0 && currentIndex < profileTabs.length - 1) {
      setActiveTab(profileTabs[currentIndex + 1]);
    }
  };

  if (!user) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <p className="text-sm text-zinc-400">Sign in to manage your profile.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-44 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!editorData) {
    return (
      <Alert variant="destructive" className="rounded-xl border border-red-500/30 bg-red-500/10">
        <AlertTitle className="text-red-300">Profile Studio unavailable</AlertTitle>
        <AlertDescription className="text-red-400">{error ?? "Profile editor is unavailable for this account."}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">      
          <div className="min-w-0 space-y-4 sm:space-y-6">
            <header className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">Profile Studio</h1>
                <p className="mt-1 text-sm text-zinc-400 sm:mt-2 sm:text-lg">Manage your professional profile and practice settings</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  className="h-9 rounded-xl border-white/20 bg-white/5 px-3 text-zinc-300 hover:bg-white/10 hover:text-white sm:h-12 sm:rounded-2xl sm:px-5"
                >
                  <Link href={`/${editorData.username}?preview=draft`} target="_blank" rel="noopener noreferrer">
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">Preview</span>
                  </Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-9 rounded-xl border-white/20 bg-white/5 px-3 text-zinc-300 hover:bg-white/10 hover:text-white sm:h-12 sm:rounded-2xl sm:px-5"
                  onClick={() => void handleSave()}
                  disabled={isSaving || isPublishing}
                >
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">{isSaving ? "Saving..." : "Save Draft"}</span>
                </Button>
                <Button
                  type="button"
                  className="h-9 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 px-3 text-white shadow-lg shadow-emerald-500/25 hover:opacity-95 sm:h-12 sm:rounded-2xl sm:px-6"
                  onClick={() => void handlePublish()}
                  disabled={isSaving || isPublishing}
                >
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">{isPublishing ? "Publishing..." : "Publish"}</span>
                </Button>
              </div>
            </header>

            {!isPublished && !saveMessage?.includes("published") && (
              <Alert className="rounded-xl border-amber-500/30 bg-amber-500/10">
                <Upload className="h-4 w-4 text-amber-400" />
                <AlertTitle className="text-amber-300">Profile is in draft</AlertTitle>
                <AlertDescription className="text-amber-400">
                  Your profile is saved but not yet visible to clients. Click <strong>Publish</strong> when ready.
                </AlertDescription>
              </Alert>
            )}

            {user?.userSubtype === "mind_expert" && (
              <Alert className="rounded-xl border-sky-500/30 bg-sky-500/10">
                <Sparkles className="h-4 w-4 text-sky-400" />
                <AlertTitle className="text-sky-300">Safeguarding tip for mental wellness practitioners</AlertTitle>
                <AlertDescription className="text-sky-400">
                  Consider adding a crisis support reference (e.g. iCall: 9152987821) in your About section so clients in distress know where to turn.
                </AlertDescription>
              </Alert>
            )}

            {saveMessage && (
              <Alert className="rounded-xl border-emerald-500/30 bg-emerald-500/10">
                <CheckCircle2 className="text-emerald-400" />
                <AlertTitle className="text-emerald-300">
                  {saveMessage.includes("published") ? "Published" : "Saved"}
                </AlertTitle>
                <AlertDescription className="text-emerald-400">{saveMessage}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="rounded-xl border border-red-500/30 bg-red-500/10">
                <AlertTitle>Update failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-xl border border-white/10 bg-white/5 p-2 sm:p-3 backdrop-blur-sm">
              <Tabs value={activeTab} onValueChange={(next) => setActiveTab(next as ProfileTabKey)} className="space-y-4 sm:space-y-5">
                <div className="w-full overflow-x-auto pb-1">
                  <TabsList className="w-max min-w-full border border-white/10 bg-white/5 p-1">
                  <TabsTrigger
                    value="basics"
                    className="gap-1.5 text-zinc-400 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  >
                    <User className="h-4 w-4 shrink-0" />
                    <span>Basics</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="practice"
                    className="gap-1.5 text-zinc-400 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  >
                    <Sparkles className="h-4 w-4 shrink-0" />
                    <span>Practice</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="identity"
                    className="gap-1.5 text-zinc-400 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  >
                    <Globe className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Identity & Social</span>
                    <span className="sm:hidden">Identity</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="services"
                    className="gap-1.5 text-zinc-400 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  >
                    <Save className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Services & Pricing</span>
                    <span className="sm:hidden">Services</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="booking"
                    className="gap-1.5 text-zinc-400 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                  >
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span className="hidden sm:inline">Booking Setup</span>
                    <span className="sm:hidden">Booking</span>
                  </TabsTrigger>
                </TabsList>
                </div>

                <TabsContent key={`basics-${saveEpoch}`} value="basics">
                  <ProfileBasicsSection
                    value={editorData}
                    onFieldChange={(field, nextValue) =>
                      setEditorData((current) => (current ? { ...current, [field]: nextValue } : current))
                    }
                    onUploadImage={handleImageUpload}
                    onRemoveImage={handleImageRemove}
                    isMediaBusy={isMediaBusy}
                  />
                </TabsContent>

                <TabsContent key={`practice-${saveEpoch}`} value="practice">
                  <ProfilePracticeSection
                    value={editorData}
                    onFieldChange={(field, nextValue) =>
                      setEditorData((current) => (current ? { ...current, [field]: nextValue } : current))
                    }
                    onLanguagesChange={(languages) =>
                      setEditorData((current) => (current ? { ...current, languages } : current))
                    }
                    onSessionTypesChange={(session_types) =>
                      setEditorData((current) => (current ? { ...current, session_types } : current))
                    }
                    onSubcategoriesChange={(subcategories) =>
                      setEditorData((current) => (current ? { ...current, subcategories } : current))
                    }
                    onEducationChange={(education) =>
                      setEditorData((current) => (current ? { ...current, education } : current))
                    }
                    onApproachesChange={(approaches) =>
                      setEditorData((current) => (current ? { ...current, approaches } : current))
                    }
                    onExpertiseAreasChange={(expertise_areas) =>
                      setEditorData((current) => (current ? { ...current, expertise_areas } : current))
                    }
                    onCertificationsChange={(certifications) =>
                      setEditorData((current) => (current ? { ...current, certifications } : current))
                    }
                  />
                </TabsContent>

                <TabsContent key={`identity-${saveEpoch}`} value="identity">
                  <ProfileIdentitySocialSection
                    value={editorData}
                    onFieldChange={(field, nextValue) =>
                      setEditorData((current) => (current ? { ...current, [field]: nextValue } : current))
                    }
                  />
                </TabsContent>

                <TabsContent key={`services-${saveEpoch}`} value="services">
                  <ProfileServicesSection
                    value={editorData}
                    onServicesChange={(services) =>
                      setEditorData((current) => (current ? { ...current, services } : current))
                    }
                  />
                </TabsContent>

                <TabsContent key={`booking-${saveEpoch}`} value="booking">
                  <ProfileBookingSection
                    value={editorData}
                    defaultTimezone={editorData.default_timezone || "Asia/Kolkata"}
                    onAvailabilityChange={(availability_slots) =>
                      setEditorData((current) => (current ? { ...current, availability_slots } : current))
                    }
                    onQuestionTemplatesChange={(booking_question_templates) =>
                      setEditorData((current) =>
                        current ? { ...current, booking_question_templates } : current,
                      )
                    }
                  />
                </TabsContent>

                <div className="sticky bottom-0 z-10 rounded-xl border border-white/10 bg-zinc-900/95 p-3 sm:p-5 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-2">
                    {activeTab !== "basics" ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-10 rounded-xl border-white/20 bg-white/5 px-4 text-zinc-300 hover:bg-white/10 hover:text-white sm:h-12 sm:rounded-2xl sm:px-6"
                        onClick={goToPreviousTab}
                      >
                        <ChevronRight className="h-4 w-4 rotate-180" />
                        <span className="hidden sm:inline">Previous</span>
                      </Button>
                    ) : (
                      <span />
                    )}
                    {activeTab !== "booking" ? (
                      <Button
                        type="button"
                        className="ml-auto h-10 rounded-xl bg-linear-to-r from-emerald-500 to-teal-600 px-4 text-white shadow-lg shadow-emerald-500/25 sm:h-12 sm:rounded-2xl sm:px-7"
                        onClick={() => void handleSaveAndNext()}
                        disabled={isSaving || isPublishing}
                      >
                        {isSaving ? "Saving..." : "Save & Next"} <ChevronRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        className="ml-auto h-12 rounded-2xl bg-linear-to-r from-emerald-500 to-teal-600 px-7 text-white shadow-lg shadow-emerald-500/25"
                        onClick={() => void handlePublish()}
                        disabled={isSaving || isPublishing}
                      >
                        {isPublishing ? "Publishing..." : "Save & Publish"} <Upload className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Tabs>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="sticky top-6 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <ProfileStudioSidePanel
                editorData={editorData}
                username={user.name}
                initials={initials}
                completion={completion}
              />
            </div>
          </aside>
      </div>
    </div>
  );
}
