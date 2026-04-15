"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CalendarDays,
  Plus,
  Activity,
  Calendar,
  Users,
  MapPin,
  Clock,
  Eye,
  CalendarPlus,
  Pencil,
  CheckCircle,
  XCircle,
  ClipboardList,
  Trash2,
  AlertCircle,
  CalendarCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";

import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import {
  listWorkLocations,
  createWorkLocation,
  deleteWorkLocation,
  listClasses,
  createClass,
  updateClass,
  deleteClass,
  listEnrollments,
  createSession,
  updateEnrollment,
  type WorkLocation,
  type GroupClass,
  type ClassEnrollment,
} from "./classesApi";

// ── Types ─────────────────────────────────────────────────────────────────────

type TabView = "classes" | "enrollments" | "schedule";
type ClassCategory = "yoga" | "zumba" | "pilates" | "hiit" | "dance" | "other";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getCategoryColor(category: ClassCategory): string {
  const map: Record<ClassCategory, string> = {
    yoga: "violet",
    zumba: "amber",
    pilates: "emerald",
    hiit: "rose",
    dance: "sky",
    other: "zinc",
  };
  return map[category] ?? "zinc";
}

function categoryBadgeClass(category: ClassCategory): string {
  const map: Record<ClassCategory, string> = {
    yoga: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    zumba: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    pilates: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    hiit: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    dance: "bg-sky-500/20 text-sky-400 border-sky-500/30",
    other: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  };
  return map[category] ?? map.other;
}

function categoryBarClass(category: ClassCategory): string {
  const map: Record<ClassCategory, string> = {
    yoga: "bg-gradient-to-r from-violet-500 to-violet-600",
    zumba: "bg-gradient-to-r from-amber-500 to-amber-600",
    pilates: "bg-gradient-to-r from-emerald-500 to-emerald-600",
    hiit: "bg-gradient-to-r from-rose-500 to-rose-600",
    dance: "bg-gradient-to-r from-sky-500 to-sky-600",
    other: "bg-gradient-to-r from-zinc-500 to-zinc-600",
  };
  return map[category] ?? map.other;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(timeStr: string): string {
  const [h, m] = timeStr.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ── EliteGlassCard ─────────────────────────────────────────────────────────────

function EliteGlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface ClassesManagerPageProps {
  specialization?: string;
  subcategories?: string[];
}

export function ClassesManagerPage({ specialization = "", subcategories = [] }: ClassesManagerPageProps) {
  const { accessToken } = useAuthSession();

  const [currentTab, setCurrentTab] = useState<TabView>("schedule");
  const [newClassOpen, setNewClassOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<number | null>(null);
  const [addSessionOpen, setAddSessionOpen] = useState(false);
  const [addLocationOpen, setAddLocationOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [showConflictsModal, setShowConflictsModal] = useState(false);
  const [showLocationsModal, setShowLocationsModal] = useState(false);

  // Data state
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // New class form
  const [newClassName, setNewClassName] = useState("");
  const [newClassCategory, setNewClassCategory] = useState(() => specialization?.trim() || subcategories[0]?.trim() || "yoga");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [newClassLocationId, setNewClassLocationId] = useState<string>("");
  const [newClassDuration, setNewClassDuration] = useState("60");
  const [newClassCapacity, setNewClassCapacity] = useState("20");
  const [newClassPrice, setNewClassPrice] = useState("");
  const [newClassActive, setNewClassActive] = useState(true);
  const [savingClass, setSavingClass] = useState(false);

  // New session form
  const [newSessionDate, setNewSessionDate] = useState("");
  const [newSessionTime, setNewSessionTime] = useState("");
  const [newSessionDuration, setNewSessionDuration] = useState("60");
  const [savingSession, setSavingSession] = useState(false);

  // New location form
  const [newLocName, setNewLocName] = useState("");
  const [newLocAddress, setNewLocAddress] = useState("");
  const [newLocType, setNewLocType] = useState("gym");
  const [savingLocation, setSavingLocation] = useState(false);

  // Load data
  const loadAll = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const [cls, enr, locs] = await Promise.all([
        listClasses(accessToken),
        listEnrollments(accessToken),
        listWorkLocations(accessToken),
      ]);
      setClasses(cls);
      setEnrollments(enr);
      setWorkLocations(locs);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── Derived stats ───────────────────────────────────────────────────────────

  const stats = {
    activeClasses: classes.filter((c) => c.status === "active").length,
    totalSessions: classes.reduce((sum, c) => sum + c.upcoming_sessions.length, 0),
    totalEnrolled: classes.reduce((sum, c) => sum + c.enrolled_count, 0),
  };

  // Find the next upcoming session across all classes
  const getNextSession = () => {
    const now = new Date();
    let nextSession: { cls: GroupClass; date: string; time: string } | null = null;
    let closestMs = Infinity;
    classes.forEach((cls) => {
      cls.upcoming_sessions.forEach((s) => {
        const dt = new Date(`${s.session_date}T${s.start_time}`);
        const diff = dt.getTime() - now.getTime();
        if (diff > 0 && diff < closestMs) {
          closestMs = diff;
          nextSession = { cls, date: s.session_date, time: s.start_time };
        }
      });
    });
    return nextSession as { cls: GroupClass; date: string; time: string } | null;
  };

  const nextSession = getNextSession();

  // ── Handlers ────────────────────────────────────────────────────────────────

  function openEditDrawer(classItem: GroupClass) {
    setEditingClassId(classItem.id);
    setNewClassName(classItem.title);
    setNewClassCategory(classItem.category);
    setNewClassDescription(classItem.description ?? "");
    setNewClassLocationId(classItem.work_location_id ? String(classItem.work_location_id) : "");
    setNewClassDuration(String(classItem.duration_minutes));
    setNewClassCapacity(String(classItem.capacity));
    setNewClassPrice(String(classItem.price));
    setNewClassActive(classItem.status === "active");
    setNewClassOpen(true);
  }

  function closeClassDrawer() {
    setNewClassOpen(false);
    setEditingClassId(null);
    setNewClassName("");
    const defaultCat = specialization?.trim() || subcategories[0]?.trim() || "yoga";
    setNewClassCategory(defaultCat);
    setNewClassDescription("");
    setNewClassLocationId("");
    setNewClassDuration("60");
    setNewClassCapacity("20");
    setNewClassPrice("");
    setNewClassActive(true);
  }

  async function handleSaveClass() {
    if (!accessToken || !newClassName.trim()) return;
    setSavingClass(true);
    try {
      const payload = {
        title: newClassName.trim(),
        category: newClassCategory,
        status: newClassActive ? "active" : "draft",
        duration_minutes: parseInt(newClassDuration) || 60,
        capacity: parseInt(newClassCapacity) || 20,
        price: parseFloat(newClassPrice) || 0,
        description: newClassDescription.trim() || undefined,
        work_location_id: newClassLocationId ? parseInt(newClassLocationId) : undefined,
      };
      if (editingClassId !== null) {
        await updateClass(accessToken, editingClassId, payload);
        toast.success("Class updated successfully");
      } else {
        await createClass(accessToken, payload);
        toast.success("Class created successfully");
      }
      closeClassDrawer();
      await loadAll();
    } catch {
      toast.error(editingClassId !== null ? "Failed to update class" : "Failed to create class");
    } finally {
      setSavingClass(false);
    }
  }

  async function handleSaveSession() {
    if (!accessToken || !selectedClassId || !newSessionDate || !newSessionTime) return;
    setSavingSession(true);
    try {
      await createSession(accessToken, selectedClassId, {
        session_date: newSessionDate,
        start_time: newSessionTime,
      });
      toast.success("Session scheduled successfully");
      setAddSessionOpen(false);
      setNewSessionDate("");
      setNewSessionTime("");
      await loadAll();
    } catch {
      toast.error("Failed to schedule session");
    } finally {
      setSavingSession(false);
    }
  }

  async function handleSaveLocation() {
    if (!accessToken || !newLocName.trim()) return;
    setSavingLocation(true);
    try {
      await createWorkLocation(accessToken, {
        name: newLocName.trim(),
        address: newLocAddress.trim() || undefined,
        location_type: newLocType,
      });
      toast.success("Location added successfully");
      setAddLocationOpen(false);
      setNewLocName("");
      setNewLocAddress("");
      setNewLocType("gym");
      await loadAll();
    } catch {
      toast.error("Failed to add location");
    } finally {
      setSavingLocation(false);
    }
  }

  async function handleDeleteLocation(locationId: number) {
    if (!accessToken) return;
    try {
      await deleteWorkLocation(accessToken, locationId);
      toast.success("Location deleted successfully");
      await loadAll();
    } catch {
      toast.error("Failed to delete location");
    }
  }

  async function handleUpdateEnrollment(id: number, patch: { status?: string; payment_status?: string }) {
    if (!accessToken) return;
    try {
      const updated = await updateEnrollment(accessToken, id, patch);
      setEnrollments((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      toast.success("Enrollment updated");
    } catch {
      toast.error("Failed to update enrollment");
    }
  }

  // ── Schedule tab helpers ─────────────────────────────────────────────────────

  type DaySession = { classItem: GroupClass; sessionDate: string; startTime: string; sessionId: number; enrolledCount: number };

  const sessionsByDate: Record<string, DaySession[]> = {};
  classes.forEach((classItem) => {
    classItem.upcoming_sessions.forEach((s) => {
      if (!sessionsByDate[s.session_date]) sessionsByDate[s.session_date] = [];
      sessionsByDate[s.session_date].push({
        classItem,
        sessionDate: s.session_date,
        startTime: s.start_time,
        sessionId: s.id,
        enrolledCount: s.enrolled_count,
      });
    });
  });

  const sortedDates = Object.keys(sessionsByDate).sort();

  function detectConflicts(daySessions: DaySession[]): boolean {
    for (let i = 0; i < daySessions.length; i++) {
      for (let j = i + 1; j < daySessions.length; j++) {
        const t1 = new Date(`${daySessions[i].sessionDate}T${daySessions[i].startTime}`);
        const t2 = new Date(`${daySessions[j].sessionDate}T${daySessions[j].startTime}`);
        const e1 = new Date(t1.getTime() + daySessions[i].classItem.duration_minutes * 60000);
        const e2 = new Date(t2.getTime() + daySessions[j].classItem.duration_minutes * 60000);
        if (t1 < e2 && e1 > t2) return true;
      }
    }
    return false;
  }

  const totalConflicts = (() => {
    let count = 0;
    sortedDates.forEach((d) => {
      const daySessions = sessionsByDate[d];
      for (let i = 0; i < daySessions.length; i++) {
        for (let j = i + 1; j < daySessions.length; j++) {
          const t1 = new Date(`${daySessions[i].sessionDate}T${daySessions[i].startTime}`);
          const t2 = new Date(`${daySessions[j].sessionDate}T${daySessions[j].startTime}`);
          const e1 = new Date(t1.getTime() + daySessions[i].classItem.duration_minutes * 60000);
          const e2 = new Date(t2.getTime() + daySessions[j].classItem.duration_minutes * 60000);
          if (t1 < e2 && e1 > t2) count++;
        }
      }
    });
    return count;
  })();

  // Get detailed conflicts for modal
  const getDetailedConflicts = (): Array<{ session1: DaySession; session2: DaySession; date: string }> => {
    const conflicts: Array<{ session1: DaySession; session2: DaySession; date: string }> = [];
    sortedDates.forEach((d) => {
      const daySessions = sessionsByDate[d];
      for (let i = 0; i < daySessions.length; i++) {
        for (let j = i + 1; j < daySessions.length; j++) {
          const t1 = new Date(`${daySessions[i].sessionDate}T${daySessions[i].startTime}`);
          const t2 = new Date(`${daySessions[j].sessionDate}T${daySessions[j].startTime}`);
          const e1 = new Date(t1.getTime() + daySessions[i].classItem.duration_minutes * 60000);
          const e2 = new Date(t2.getTime() + daySessions[j].classItem.duration_minutes * 60000);
          if (t1 < e2 && e1 > t2) {
            conflicts.push({ session1: daySessions[i], session2: daySessions[j], date: d });
          }
        }
      }
    });
    return conflicts;
  };

  const schedCatBarClass = (category: string) => {
    const map: Record<string, string> = {
      yoga: "bg-violet-400",
      zumba: "bg-amber-400",
      pilates: "bg-emerald-400",
      hiit: "bg-rose-400",
      dance: "bg-sky-400",
      other: "bg-zinc-400",
    };
    return map[category] ?? "bg-zinc-400";
  };

  const schedCatBgClass = (category: string) => {
    const map: Record<string, string> = {
      yoga: "bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20",
      zumba: "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20",
      pilates: "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20",
      hiit: "bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20",
      dance: "bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/20",
      other: "bg-zinc-500/10 hover:bg-zinc-500/20 border-zinc-500/20",
    };
    return map[category] ?? map.other;
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="relative min-h-screen">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 size-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-20 left-20 size-[400px] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <div className="relative space-y-6 p-4 sm:p-6 pb-16 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 blur-xl rounded-full" />
              <div className="relative rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-600/10 p-2.5 sm:p-3 border border-amber-400/20 backdrop-blur-sm">
                <CalendarDays className="size-6 sm:size-7 text-amber-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
                Classes &amp; Sessions
              </h1>
              <p className="text-sm sm:text-base text-zinc-400 mt-0.5 sm:mt-1">Manage your group fitness classes and enrollments</p>
            </div>
          </div>
          <Button
            onClick={() => setNewClassOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:via-amber-700 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30"
          >
            <Plus className="size-4 mr-2" />
            New Class
          </Button>
        </div>

        {/* Next Session Hero Card */}
        {nextSession && (
          <div className="relative overflow-hidden rounded-2xl border border-sky-400/30 bg-gradient-to-br from-sky-500/10 via-sky-600/5 to-transparent backdrop-blur-xl">
            <div className="absolute inset-0 bg-gradient-to-r from-sky-500/5 via-transparent to-cyan-500/5" />
            <div className="absolute top-0 right-0 size-64 bg-sky-500/10 blur-3xl rounded-full" />
            <div className="relative p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6">
                <div className="flex items-start sm:items-center gap-3 sm:gap-6 flex-1 w-full">
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-sky-500/30 blur-xl rounded-full animate-pulse" />
                    <div className="relative rounded-2xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 p-3 sm:p-4 border border-sky-400/30 shadow-lg shadow-sky-500/20">
                      <CalendarDays className="size-6 sm:size-8 text-sky-400" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-sky-400">Next Session Coming Up</p>
                      <Badge className={`${categoryBadgeClass(nextSession.cls.category as ClassCategory)} border capitalize text-xs`}>
                        {nextSession.cls.category}
                      </Badge>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-3 truncate">{nextSession.cls.title}</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-white/5 p-1.5 sm:p-2"><Calendar className="size-3.5 sm:size-4 text-sky-400" /></div>
                        <div><p className="text-xs text-zinc-500">Date</p><p className="text-xs sm:text-sm font-medium text-white truncate">{formatDate(nextSession.date)}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-white/5 p-1.5 sm:p-2"><Clock className="size-3.5 sm:size-4 text-emerald-400" /></div>
                        <div><p className="text-xs text-zinc-500">Time</p><p className="text-xs sm:text-sm font-medium text-white truncate">{formatTime(nextSession.time)}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-white/5 p-1.5 sm:p-2"><MapPin className="size-3.5 sm:size-4 text-violet-400" /></div>
                        <div><p className="text-xs text-zinc-500">Location</p><p className="text-xs sm:text-sm font-medium text-white truncate">{nextSession.cls.work_location_name ?? "Not set"}</p></div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-white/5 p-1.5 sm:p-2"><Users className="size-3.5 sm:size-4 text-amber-400" /></div>
                        <div><p className="text-xs text-zinc-500">Enrolled</p><p className="text-xs sm:text-sm font-medium text-white">{nextSession.cls.enrolled_count}/{nextSession.cls.capacity}</p></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-row lg:flex-col items-center lg:items-end gap-3 lg:gap-3 w-full lg:w-auto justify-between lg:justify-start">
                  <div className="text-left lg:text-right">
                    <p className="text-xs text-zinc-500 mb-1">Duration</p>
                    <p className="text-lg sm:text-xl font-bold text-white">{nextSession.cls.duration_minutes} min</p>
                  </div>
                  <div className="h-8 lg:h-px w-px lg:w-16 bg-white/10" />
                  <div className="text-right">
                    <p className="text-xs text-zinc-500 mb-1">Price</p>
                    <p className="text-xl sm:text-2xl font-bold text-emerald-400">₹{nextSession.cls.price}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10 pb-1">
          {[
            { id: "schedule" as TabView, label: "Schedule Overview" },
            { id: "classes" as TabView, label: "My Classes" },
            { id: "enrollments" as TabView, label: "Enrollments" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors ${
                currentTab === tab.id
                  ? "bg-white/10 text-white border-b-2 border-amber-400"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── CLASSES TAB ─────────────────────────────────────────────────────── */}
        {currentTab === "classes" && (
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
              <EliteGlassCard className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-3 border border-emerald-400/20">
                    <Activity className="size-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Active Classes</p>
                    <p className="text-2xl font-bold text-white">{stats.activeClasses}</p>
                  </div>
                </div>
              </EliteGlassCard>
              <EliteGlassCard className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 p-3 border border-sky-400/20">
                    <Calendar className="size-6 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Upcoming Sessions</p>
                    <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
                  </div>
                </div>
              </EliteGlassCard>
              <EliteGlassCard className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/10 p-3 border border-violet-400/20">
                    <Users className="size-6 text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Total Enrolled</p>
                    <p className="text-2xl font-bold text-white">{stats.totalEnrolled}</p>
                  </div>
                </div>
              </EliteGlassCard>
            </div>

            {/* Class Cards Grid */}
            {loading ? (
              <div className="text-center py-12 text-zinc-400">Loading classes…</div>
            ) : classes.length === 0 ? (
              <div className="p-12 text-center">
                <div className="rounded-full bg-white/5 p-4 w-fit mx-auto mb-4">
                  <CalendarDays className="size-8 text-zinc-500" />
                </div>
                <p className="text-white font-medium mb-1">No classes yet</p>
                <p className="text-sm text-zinc-400">Create your first group fitness class to get started</p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {classes.map((classItem) => {
                  const statusBadgeClass =
                    classItem.status === "active"
                      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                      : classItem.status === "draft"
                      ? "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                      : "bg-rose-500/20 text-rose-400 border-rose-500/30";
                  const statusLabel =
                    classItem.status === "active" ? "Active" : classItem.status === "draft" ? "Draft" : "Cancelled";

                  return (
                    <EliteGlassCard key={classItem.id} className="overflow-hidden">
                      <div className={`h-1 ${categoryBarClass(classItem.category as ClassCategory)}`} />
                      <div className="p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <h3 className="text-lg font-bold text-white">{classItem.title}</h3>
                          <Badge className={`${statusBadgeClass} border`}>{statusLabel}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
                          <div className="flex items-center gap-1.5">
                            <MapPin className="size-4" />
                            <span>{classItem.work_location_name ?? "No location"}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Users className="size-4" />
                            <span>{classItem.enrolled_count}/{classItem.capacity} spots</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="size-4" />
                            <span>{classItem.duration_minutes} min</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge className={`${categoryBadgeClass(classItem.category as ClassCategory)} border capitalize`}>
                            {classItem.category}
                          </Badge>
                          <p className="text-lg font-semibold text-emerald-400">₹{classItem.price}</p>
                        </div>
                        {classItem.upcoming_sessions.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-zinc-500 mb-2">Upcoming Sessions</p>
                            <div className="flex flex-wrap gap-2">
                              {classItem.upcoming_sessions.slice(0, 3).map((session) => (
                                <Badge key={session.id} className="bg-sky-500/20 text-sky-400 border-sky-500/30 border text-xs">
                                  <Clock className="size-3 mr-1.5 inline-block" />
                                  {formatDate(session.session_date)} • {formatTime(session.start_time)}
                                </Badge>
                              ))}
                              {classItem.upcoming_sessions.length > 3 && (
                                <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30 border text-xs">
                                  +{classItem.upcoming_sessions.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentTab("enrollments")}
                            className="text-zinc-400 hover:text-white hover:bg-white/5 flex-1"
                          >
                            <Eye className="size-4 mr-2" />
                            View Enrollments
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedClassId(classItem.id);
                              setAddSessionOpen(true);
                            }}
                            className="text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 flex-1"
                          >
                            <CalendarPlus className="size-4 mr-2" />
                            Add Session
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDrawer(classItem)}
                            className="text-zinc-400 hover:text-white hover:bg-white/5"
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </div>
                      </div>
                    </EliteGlassCard>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── SCHEDULE TAB ────────────────────────────────────────────────────── */}
        {currentTab === "schedule" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <EliteGlassCard className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-3 border border-emerald-400/20">
                    <CalendarCheck className="size-6 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Total Sessions</p>
                    <p className="text-2xl font-bold text-white">{stats.totalSessions}</p>
                  </div>
                </div>
              </EliteGlassCard>
              <EliteGlassCard className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 p-3 border border-rose-400/20">
                    <AlertCircle className="size-6 text-rose-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Conflicts Detected</p>
                    <p className="text-2xl font-bold text-white">{totalConflicts}</p>
                  </div>
                </div>
                {totalConflicts > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConflictsModal(true)}
                    className="mt-3 w-full text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  >
                    View Conflicts →
                  </Button>
                )}
              </EliteGlassCard>
              <EliteGlassCard className="p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-sky-500/20 to-sky-600/10 p-3 border border-sky-400/20">
                    <Clock className="size-6 text-sky-400" />
                  </div>
                  <div>
                    <p className="text-sm text-zinc-400">Locations</p>
                    <p className="text-2xl font-bold text-white">{workLocations.length}</p>
                  </div>
                </div>
                {workLocations.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLocationsModal(true)}
                    className="mt-3 w-full text-sm text-sky-400 hover:text-sky-300 hover:bg-sky-500/10"
                  >
                    View Locations →
                  </Button>
                )}
              </EliteGlassCard>
            </div>

            {/* Weekly Schedule */}
            <EliteGlassCard className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">Weekly Schedule</h3>
                <p className="text-sm text-zinc-400">All upcoming sessions at a glance</p>
              </div>
              {sortedDates.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  <CalendarDays className="size-8 mx-auto mb-3 text-zinc-600" />
                  <p>No upcoming sessions scheduled</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sortedDates.slice(0, 6).map((date) => {
                    const daySessions = [...sessionsByDate[date]].sort((a, b) => a.startTime.localeCompare(b.startTime));
                    const hasConflict = detectConflicts(daySessions);
                    const dateObj = new Date(date + "T00:00:00");
                    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                    const dayNum = dateObj.getDate();
                    const monthName = dateObj.toLocaleDateString("en-US", { month: "short" });

                    return (
                      <div
                        key={date}
                        className={`relative overflow-hidden rounded-xl border transition-all hover:border-white/20 ${
                          hasConflict
                            ? "border-rose-400/30 bg-gradient-to-br from-rose-500/10 to-rose-600/5"
                            : "border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]"
                        }`}
                      >
                        <div className={`p-4 border-b ${hasConflict ? "border-rose-500/20 bg-rose-500/5" : "border-white/10 bg-white/[0.02]"}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={`flex flex-col items-center justify-center size-12 rounded-lg ${hasConflict ? "bg-rose-500/20 border border-rose-400/30" : "bg-emerald-500/20 border border-emerald-400/30"}`}>
                                <span className={`text-xs font-medium ${hasConflict ? "text-rose-400" : "text-emerald-400"}`}>{dayName}</span>
                                <span className="text-lg font-bold text-white">{dayNum}</span>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-white">{monthName}</p>
                                <p className="text-xs text-zinc-500">{daySessions.length} session{daySessions.length !== 1 ? "s" : ""}</p>
                              </div>
                            </div>
                            {hasConflict && <AlertCircle className="size-4 text-rose-400" />}
                          </div>
                        </div>
                        <div className="p-4 space-y-2">
                          {daySessions.map((item, idx) => (
                            <div key={idx} className={`group relative flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${schedCatBgClass(item.classItem.category)}`}>
                              <div className={`w-1 h-full absolute left-0 top-0 rounded-l-lg ${schedCatBarClass(item.classItem.category)}`} />
                              <div className="pl-2 min-w-[70px]">
                                <p className="text-xs font-semibold text-white">{formatTime(item.startTime)}</p>
                                <p className="text-xs text-zinc-500">{item.classItem.duration_minutes}m</p>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{item.classItem.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                                    <Users className="size-3" />
                                    {item.enrolledCount}/{item.classItem.capacity}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </EliteGlassCard>

            {/* Quick Insights */}
            <div className="grid gap-4 md:grid-cols-2">
              <EliteGlassCard className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-3 border border-amber-400/20">
                    <Clock className="size-6 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white mb-3">Peak Hours</h3>
                    <div className="space-y-2">
                      {[
                        { label: "6:00 AM - 8:00 AM", pct: 85, color: "amber" },
                        { label: "5:00 PM - 7:00 PM", pct: 70, color: "amber" },
                        { label: "10:00 AM - 12:00 PM", pct: 45, color: "emerald" },
                      ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between">
                          <span className="text-xs text-zinc-400">{row.label}</span>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full bg-gradient-to-r ${row.color === "amber" ? "from-amber-500 to-orange-500" : "from-emerald-500 to-emerald-600"}`}
                                style={{ width: `${row.pct}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${row.color === "amber" ? "text-amber-400" : "text-emerald-400"}`}>{row.pct}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </EliteGlassCard>
              <EliteGlassCard className="p-6">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-3 border border-emerald-400/20">
                    <CalendarCheck className="size-6 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white mb-3">Open Slots</h3>
                    <div className="space-y-2">
                      {[
                        { time: "Early Morning", period: "5:00 - 6:00 AM" },
                        { time: "Afternoon", period: "2:00 - 4:00 PM" },
                        { time: "Late Evening", period: "8:00 - 10:00 PM" },
                      ].map((slot) => (
                        <div key={slot.time} className="flex items-center justify-between py-1.5">
                          <div className="flex items-center gap-2">
                            <div className="size-1.5 rounded-full bg-emerald-400" />
                            <span className="text-xs font-medium text-white">{slot.time}</span>
                          </div>
                          <span className="text-xs text-zinc-500">{slot.period}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </EliteGlassCard>
            </div>
          </div>
        )}

        {/* ── ENROLLMENTS TAB ─────────────────────────────────────────────────── */}
        {currentTab === "enrollments" && (
          <div className="space-y-6">
            {/* Filters */}
            <EliteGlassCard className="p-4">
              <div className="flex flex-wrap gap-3">
                <Select defaultValue="all">
                  <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white h-10">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  placeholder="Session date"
                  className="w-48 bg-white/5 border-white/10 text-white h-10"
                />
              </div>
            </EliteGlassCard>

            {/* Enrollments Table */}
            <EliteGlassCard className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-left bg-white/[0.02]">
                      <th className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider">Client</th>
                      <th className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider">Class</th>
                      <th className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider">Location</th>
                      <th className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider">Session Date</th>
                      <th className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider">Payment</th>
                      <th className="px-6 py-4 font-medium text-zinc-400 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enrollment) => {
                      const initials = enrollment.client_name
                        .trim()
                        .split(/\s+/)
                        .map((n) => n[0] ?? "")
                        .join("")
                        .slice(0, 2)
                        .toUpperCase();

                      return (
                        <tr key={enrollment.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="size-8">
                                <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs">{initials}</AvatarFallback>
                              </Avatar>
                              <span className="text-white font-medium">{enrollment.client_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-zinc-300">{enrollment.class_title ?? "—"}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1.5 text-zinc-400 text-sm">
                              <MapPin className="size-3.5" />
                              <span>{enrollment.work_location_name ?? "—"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-white font-medium">{enrollment.session_date ? formatDate(enrollment.session_date) : "—"}</span>
                              {enrollment.start_time && (
                                <span className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5">
                                  <Clock className="size-3" />
                                  {formatTime(enrollment.start_time)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={
                                enrollment.status === "confirmed"
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border"
                                  : "bg-rose-500/20 text-rose-400 border-rose-500/30 border"
                              }
                            >
                              {enrollment.status === "confirmed" ? "Confirmed" : "Cancelled"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <Badge
                              className={
                                enrollment.payment_status === "paid"
                                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border"
                                  : "bg-amber-500/20 text-amber-400 border-amber-500/30 border"
                              }
                            >
                              {enrollment.payment_status === "paid" ? "Paid" : "Pending"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10"
                                onClick={() => handleUpdateEnrollment(enrollment.id, { status: "confirmed" })}
                                disabled={enrollment.status === "confirmed"}
                              >
                                <CheckCircle className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10"
                                onClick={() => handleUpdateEnrollment(enrollment.id, { status: "cancelled" })}
                                disabled={enrollment.status === "cancelled"}
                              >
                                <XCircle className="size-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {enrollments.length === 0 && !loading && (
                <div className="p-12 text-center">
                  <div className="rounded-full bg-white/5 p-4 w-fit mx-auto mb-4">
                    <ClipboardList className="size-8 text-zinc-500" />
                  </div>
                  <p className="text-white font-medium mb-1">No enrollments found</p>
                  <p className="text-sm text-zinc-400">Adjust your filters or add new class sessions</p>
                </div>
              )}
            </EliteGlassCard>
          </div>
        )}
      </div>

      {/* ── New Class Drawer ──────────────────────────────────────────────────── */}
      <Sheet open={newClassOpen} onOpenChange={(open) => { if (!open) closeClassDrawer(); }}>
        <SheetContent className="w-full sm:max-w-lg bg-[#0a0f1e] border-white/10 flex flex-col">
          <SheetHeader>
            <SheetTitle className="text-white">{editingClassId !== null ? "Edit Class" : "Create New Class"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 py-6 overflow-y-auto flex-1 pr-1">
            <div>
              <Label className="text-sm font-medium text-zinc-300 mb-2 block">Class Name</Label>
              <Input
                placeholder="e.g. Morning Power Yoga"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 h-11"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-zinc-300 mb-2 block">Category</Label>
              <Select value={newClassCategory} onValueChange={setNewClassCategory}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-11"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                  {(() => {
                    const profileOptions: string[] = [];
                    if (specialization?.trim()) profileOptions.push(specialization.trim());
                    subcategories.forEach((s) => { if (s.trim() && !profileOptions.includes(s.trim())) profileOptions.push(s.trim()); });
                    if (profileOptions.length > 0) {
                      return profileOptions.map((opt) => (
                        <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                      ));
                    }
                    return (
                      <>
                        <SelectItem value="yoga">Yoga</SelectItem>
                        <SelectItem value="zumba">Zumba</SelectItem>
                        <SelectItem value="pilates">Pilates</SelectItem>
                        <SelectItem value="hiit">HIIT</SelectItem>
                        <SelectItem value="dance">Dance</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </>
                    );
                  })()}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-zinc-300 mb-2 block">Description</Label>
              <textarea
                rows={3}
                placeholder="Brief description of the class"
                value={newClassDescription}
                onChange={(e) => setNewClassDescription(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 text-white focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-zinc-300">Work Location</Label>
                <button
                  type="button"
                  onClick={() => setAddLocationOpen(true)}
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                >
                  <Plus className="size-3" />
                  Add New
                </button>
              </div>
              <Select value={newClassLocationId} onValueChange={setNewClassLocationId}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-11"><SelectValue placeholder="Select location" /></SelectTrigger>
                <SelectContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                  {workLocations.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-zinc-500 mt-1.5">Select from your saved work locations</p>
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div>
                <Label className="text-sm font-medium text-zinc-300 mb-2 block">Duration (min)</Label>
                <Input
                  type="number"
                  placeholder="60"
                  value={newClassDuration}
                  onChange={(e) => setNewClassDuration(e.target.value)}
                  className="bg-white/5 border-white/10 text-white focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 h-11"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-zinc-300 mb-2 block">Capacity</Label>
                <Input
                  type="number"
                  placeholder="20"
                  value={newClassCapacity}
                  onChange={(e) => setNewClassCapacity(e.target.value)}
                  className="bg-white/5 border-white/10 text-white focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 h-11"
                />
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-zinc-300 mb-2 block">Price per Spot (₹)</Label>
              <Input
                type="number"
                placeholder="500"
                value={newClassPrice}
                onChange={(e) => setNewClassPrice(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 h-11"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-zinc-300 mb-2 block">Status</Label>
              <div className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/5">
                <Switch
                  checked={newClassActive}
                  onCheckedChange={setNewClassActive}
                  className="data-[state=checked]:bg-emerald-500"
                />
                <span className="text-sm text-zinc-300">Active (visible to clients)</span>
              </div>
            </div>
          </div>
          <SheetFooter>
            <Button variant="ghost" onClick={closeClassDrawer} className="text-zinc-400 hover:bg-white/5">
              Cancel
            </Button>
            <Button
              onClick={handleSaveClass}
              disabled={savingClass || !newClassName.trim()}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
            >
              {savingClass ? "Saving…" : editingClassId !== null ? "Update Class" : "Save Class"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Add Session Modal ─────────────────────────────────────────────────── */}
      <AlertDialog open={addSessionOpen} onOpenChange={setAddSessionOpen}>
        <AlertDialogContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Schedule New Session</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Add a new session date for this class
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium text-zinc-300 mb-2 block">Session Date</Label>
              <Input
                type="date"
                value={newSessionDate}
                onChange={(e) => setNewSessionDate(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 h-11"
              />
            </div>
            <div className="grid gap-4 grid-cols-2">
              <div>
                <Label className="text-sm font-medium text-zinc-300 mb-2 block">Start Time</Label>
                <Input
                  type="time"
                  value={newSessionTime}
                  onChange={(e) => setNewSessionTime(e.target.value)}
                  className="bg-white/5 border-white/10 text-white focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 h-11"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-zinc-300 mb-2 block">Duration (min)</Label>
                <Input
                  type="number"
                  value={newSessionDuration}
                  onChange={(e) => setNewSessionDuration(e.target.value)}
                  className="bg-white/5 border-white/10 text-white focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 h-11"
                />
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAddSessionOpen(false)} className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveSession}
              disabled={savingSession || !newSessionDate || !newSessionTime}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
            >
              {savingSession ? "Scheduling…" : "Schedule Session"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Add Location Modal ────────────────────────────────────────────────── */}
      <AlertDialog open={addLocationOpen} onOpenChange={setAddLocationOpen}>
        <AlertDialogContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Add Work Location</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Add a new gym, studio, or workspace to your saved locations
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium text-zinc-300 mb-2 block">Location Name</Label>
              <Input
                placeholder="e.g. GoodLife Fitness Koramangala"
                value={newLocName}
                onChange={(e) => setNewLocName(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 h-11"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-zinc-300 mb-2 block">Address / Area</Label>
              <Input
                placeholder="e.g. Koramangala 5th Block"
                value={newLocAddress}
                onChange={(e) => setNewLocAddress(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 h-11"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-zinc-300 mb-2 block">Type</Label>
              <Select value={newLocType} onValueChange={setNewLocType}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-11"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                  <SelectItem value="gym">Gym</SelectItem>
                  <SelectItem value="studio">Studio</SelectItem>
                  <SelectItem value="home">Home Visits</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAddLocationOpen(false)} className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveLocation}
              disabled={savingLocation || !newLocName.trim()}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
            >
              {savingLocation ? "Adding…" : (
                <>
                  <Plus className="size-4 mr-2" />
                  Add Location
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── View Conflicts Modal ─────────────────────────────────────────────── */}
      <AlertDialog open={showConflictsModal} onOpenChange={setShowConflictsModal}>
        <AlertDialogContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl sm:max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertCircle className="size-5 text-rose-400" />
              Schedule Conflicts Detected
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              {totalConflicts} session{totalConflicts !== 1 ? 's' : ''} with overlapping times
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[400px] overflow-y-auto py-4">
            {getDetailedConflicts().map((conflict, idx) => {
              const { session1, session2, date } = conflict;
              return (
                <div key={idx} className="mb-4 p-4 bg-rose-500/10 border border-rose-400/20 rounded-lg">
                  <p className="text-sm font-semibold text-white mb-3">
                    {formatDate(date)}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2 bg-white/5 rounded">
                      <Clock className="size-4 text-emerald-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{session1.classItem.title}</p>
                        <p className="text-xs text-zinc-400">
                          {formatTime(session1.startTime)} - {formatTime(
                            new Date(
                              new Date(`${session1.sessionDate}T${session1.startTime}`).getTime() +
                                session1.classItem.duration_minutes * 60000
                            ).toTimeString().slice(0, 5)
                          )}
                        </p>
                      </div>
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-400/30">
                        {session1.classItem.duration_minutes}m
                      </Badge>
                    </div>
                    <div className="text-center text-xs text-rose-400">⚠️ Overlaps with ⚠️</div>
                    <div className="flex items-center gap-3 p-2 bg-white/5 rounded">
                      <Clock className="size-4 text-sky-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{session2.classItem.title}</p>
                        <p className="text-xs text-zinc-400">
                          {formatTime(session2.startTime)} - {formatTime(
                            new Date(
                              new Date(`${session2.sessionDate}T${session2.startTime}`).getTime() +
                                session2.classItem.duration_minutes * 60000
                            ).toTimeString().slice(0, 5)
                          )}
                        </p>
                      </div>
                      <Badge className="bg-sky-500/20 text-sky-400 border-sky-400/30">
                        {session2.classItem.duration_minutes}m
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConflictsModal(false)} className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10">
              Close
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── View Locations Modal ──────────────────────────────────────────────── */}
      <AlertDialog open={showLocationsModal} onOpenChange={setShowLocationsModal}>
        <AlertDialogContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <MapPin className="size-5 text-sky-400" />
              Work Locations
            </AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              All your saved work locations
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="max-h-[400px] overflow-y-auto py-4 space-y-3">
            {workLocations.map((loc) => (
              <div key={loc.id} className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/8 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <MapPin className="size-4 text-sky-400" />
                      <h4 className="font-semibold text-white">{loc.name}</h4>
                    </div>
                    {loc.address && (
                      <p className="text-sm text-zinc-400 mb-2">{loc.address}</p>
                    )}
                    <Badge className="bg-sky-500/20 text-sky-400 border-sky-400/30 text-xs capitalize">
                      {loc.location_type}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteLocation(loc.id)}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowLocationsModal(false)} className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10">
              Close
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowLocationsModal(false);
                setAddLocationOpen(true);
              }}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
            >
              <Plus className="size-4 mr-2" />
              Add Location
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
