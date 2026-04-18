"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import dynamic from "next/dynamic";
import type { CallBackProps, Step } from "react-joyride";
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
  AlertTriangle,
  CalendarCheck,
  Send,
  UserCheck,
  Ban,
  Lock,
  ChevronDown,
  HelpCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { classesManagerTutorialSteps, tutorialStyles } from "./ClassesManagerTutorial";
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
  bulkCreateSessions,
  deleteSession,
  updateEnrollment,
  getTierLimits,
  publishSession,
  cancelSession,
  markAttendance,
  getSessionEnrollments,
  listExpiringClasses,
  type WorkLocation,
  type GroupClass,
  type ClassEnrollment,
  type TierLimits,
  type ExpiringClass,
} from "./classesApi";
import { AttendanceMarkingModal } from "./AttendanceMarkingModal";

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
  return `${String(m).padStart(2, "0")} ${ampm}`;
}

function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function getExpiryWarningLevel(daysUntil: number | null): "critical" | "warning" | "ok" | null {
  if (daysUntil === null) return null;
  if (daysUntil < 0) return "critical"; // Already expired
  if (daysUntil <= 7) return "critical"; // Less than a week
  if (daysUntil <= 30) return "warning"; // Less than a month
  return "ok";
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

// ── Dynamic Imports ───────────────────────────────────────────────────────────

const Joyride = dynamic<any>(
  () => import("react-joyride").then((mod: any) => {
    // Extract the actual component from the module
    return mod.default || mod.Joyride || mod;
  }),
  { 
    ssr: false,
    loading: () => null
  }
);

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
  
  // Publish/Attendance modals
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [selectedSessionDate, setSelectedSessionDate] = useState<string>("");
  const [selectedSessionTitle, setSelectedSessionTitle] = useState<string>("");
  const [selectedSessionTime, setSelectedSessionTime] = useState<string>("");
  const [sessionEnrollments, setSessionEnrollments] = useState<ClassEnrollment[]>([]);
  
  // Tier limit upgrade modal
  const [tierLimitModalOpen, setTierLimitModalOpen] = useState(false);
  const [tierLimitError, setTierLimitError] = useState<{
    tier: string;
    limit: number;
    current_usage: number;
    resource: "class" | "session";
  } | null>(null);

  // Class renewal modal
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [renewingClassId, setRenewingClassId] = useState<number | null>(null);
  const [renewingClassName, setRenewingClassName] = useState<string>("");
  const [renewalExpiryDate, setRenewalExpiryDate] = useState<string>("");
  const [savingRenewal, setSavingRenewal] = useState(false);

  // Data state
  const [classes, setClasses] = useState<GroupClass[]>([]);
  const [enrollments, setEnrollments] = useState<ClassEnrollment[]>([]);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [tierLimits, setTierLimits] = useState<TierLimits | null>(null);
  const [expiringClasses, setExpiringClasses] = useState<ExpiringClass[]>([]);
  const [loading, setLoading] = useState(true);

  // New class form
  const [newClassName, setNewClassName] = useState("");
  const [newClassCategory, setNewClassCategory] = useState(() => specialization?.trim() || subcategories[0]?.trim() || "yoga");
  const [newClassDescription, setNewClassDescription] = useState("");
  const [newClassLocationId, setNewClassLocationId] = useState<string>("");
  const [newClassDuration, setNewClassDuration] = useState("60");
  const [newClassCapacity, setNewClassCapacity] = useState("20");
  const [newClassPrice, setNewClassPrice] = useState("");
  const [newClassExpiryDate, setNewClassExpiryDate] = useState("");
  const [newClassActive, setNewClassActive] = useState(true);
  const [newClassDisplayTerm, setNewClassDisplayTerm] = useState<"session" | "workshop" | "class">("session");
  const [newClassSessionMode, setNewClassSessionMode] = useState<"online" | "in_person" | "hybrid">("in_person");
  const [savingClass, setSavingClass] = useState(false);

  // New session form
  const [newSessionDate, setNewSessionDate] = useState("");
  const [newSessionTime, setNewSessionTime] = useState("");
  const [newSessionDuration, setNewSessionDuration] = useState("60");
  const [savingSession, setSavingSession] = useState(false);
  
  // Bulk session creation
  const [recurrenceType, setRecurrenceType] = useState<"single" | "daily" | "weekly">("single");
  const [endDate, setEndDate] = useState("");
  const [numberOfSessions, setNumberOfSessions] = useState("1");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [useEndDate, setUseEndDate] = useState(true);  // true = end date, false = number of sessions

  // Expanded classes in detailed list view
  const [expandedClasses, setExpandedClasses] = useState<number[]>([]);

  // Tutorial state (manual trigger only, no auto-start)
  const [runTutorial, setRunTutorial] = useState(false);

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
      const [cls, enr, locs, limits, expiring] = await Promise.all([
        listClasses(accessToken),
        listEnrollments(accessToken),
        listWorkLocations(accessToken),
        getTierLimits(accessToken),
        listExpiringClasses(accessToken),
      ]);
      setClasses(cls);
      setEnrollments(enr);
      setWorkLocations(locs);
      setTierLimits(limits);
      setExpiringClasses(expiring);
    } catch (error) {
      console.error("Failed to load data:", error);
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
    setNewClassExpiryDate(classItem.expires_on ?? "");
    setNewClassActive(classItem.status === "active");
    setNewClassDisplayTerm(classItem.display_term);
    setNewClassSessionMode(classItem.session_mode);
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
    
    // Set default expiry to 90 days from now
    const defaultExpiry = new Date();
    defaultExpiry.setDate(defaultExpiry.getDate() + 90);
    setNewClassExpiryDate(defaultExpiry.toISOString().split('T')[0]);
    
    setNewClassActive(true);
    setNewClassDisplayTerm("session");
    setNewClassSessionMode("in_person");
  }

  async function handleSaveClass() {
    if (!accessToken || !newClassName.trim()) return;
    
    // Check tier limits when creating a new class (not when editing)
    if (editingClassId === null && tierLimits) {
      if (tierLimits.usage.active_classes >= tierLimits.limits.max_active_classes) {
        setTierLimitError({
          tier: tierLimits.tier,
          limit: tierLimits.limits.max_active_classes,
          current_usage: tierLimits.usage.active_classes,
          resource: "class",
        });
        setTierLimitModalOpen(true);
        return;
      }
    }
    
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
        expires_on: newClassExpiryDate || undefined,
        display_term: newClassDisplayTerm,
        session_mode: newClassSessionMode,
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
    } catch (error: any) {
      // Check for tier limit error from backend
      if (error?.response?.status === 403 && error?.response?.data?.error === "tier_limit_reached") {
        const errorData = error.response.data;
        setTierLimitError({
          tier: errorData.tier,
          limit: errorData.limit,
          current_usage: errorData.current_usage,
          resource: "class",
        });
        setTierLimitModalOpen(true);
        closeClassDrawer();
      } else {
        toast.error(editingClassId !== null ? "Failed to update class" : "Failed to create class");
      }
    } finally {
      setSavingClass(false);
    }
  }

  async function handleSaveSession() {
    if (!accessToken || !selectedClassId || !newSessionDate || !newSessionTime) return;
    
    // Check if class is expired
    const selectedClass = classes.find((c) => c.id === selectedClassId);
    if (selectedClass?.expires_on) {
      const daysUntil = getDaysUntilExpiry(selectedClass.expires_on);
      if (daysUntil !== null && daysUntil < 0) {
        toast.error("Cannot create sessions for expired classes. Please renew the class first.");
        return;
      }
    }
    
    // Check if session date is beyond class expiry
    if (selectedClass?.expires_on) {
      const sessionDate = new Date(newSessionDate);
      const expiryDate = new Date(selectedClass.expires_on);
      if (sessionDate > expiryDate) {
        toast.error(`Session date (${formatDate(newSessionDate)}) is beyond class expiry (${formatDate(selectedClass.expires_on)})`);
        return;
      }
    }
    
    setSavingSession(true);
    try {
      if (recurrenceType === "single") {
        // Single session creation (original behavior)
        await createSession(accessToken, selectedClassId, {
          session_date: newSessionDate,
          start_time: newSessionTime,
        });
        toast.success("Session scheduled successfully");
      } else {
        // Bulk session creation
        const payload: any = {
          recurrence_type: recurrenceType,
          start_date: newSessionDate,
          start_time: newSessionTime,
        };
        
        if (recurrenceType === "weekly" && selectedDays.length === 0) {
          toast.error("Please select at least one day of the week");
          setSavingSession(false);
          return;
        }
        
        if (useEndDate) {
          if (!endDate) {
            toast.error("Please provide an end date");
            setSavingSession(false);
            return;
          }
          payload.end_date = endDate;
        } else {
          const numSessions = parseInt(numberOfSessions);
          if (isNaN(numSessions) || numSessions < 1) {
            toast.error("Please provide a valid number of sessions");
            setSavingSession(false);
            return;
          }
          payload.number_of_sessions = numSessions;
        }
        
        if (recurrenceType === "weekly") {
          payload.days_of_week = selectedDays;
        }
        
        const result = await bulkCreateSessions(accessToken, selectedClassId, payload);
        toast.success(`${result.sessions_created} sessions scheduled successfully`);
      }
      
      setAddSessionOpen(false);
      setNewSessionDate("");
      setNewSessionTime("");
      setRecurrenceType("single");
      setEndDate("");
      setNumberOfSessions("1");
      setSelectedDays([]);
      await loadAll();
    } catch (error: any) {
      const message = error.message || "Failed to schedule session";
      toast.error(message);
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

  async function handleDeleteClass(classId: number) {
    if (!accessToken) return;
    try {
      await deleteClass(accessToken, classId);
      toast.success("Class deleted successfully");
      await loadAll();
    } catch {
      toast.error("Failed to delete class");
    }
  }

  async function handleDeleteSession(classId: number, sessionId: number, sessionDate: string) {
    if (!accessToken) return;
    if (window.confirm(`Delete session on ${formatDate(sessionDate)}? This action cannot be undone.`)) {
      try {
        await deleteSession(accessToken, classId, sessionId);
        toast.success("Session deleted successfully");
        await loadAll();
      } catch (error: any) {
        toast.error(error.message || "Failed to delete session");
      }
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

  function openRenewalModal(classId: number, className: string, currentExpiry: string) {
    setRenewingClassId(classId);
    setRenewingClassName(className);
    
    // Suggest 3 months from current expiry or today (whichever is later)
    const expiryDate = new Date(currentExpiry);
    const today = new Date();
    const startFrom = expiryDate > today ? expiryDate : today;
    const suggestedExpiry = new Date(startFrom);
    suggestedExpiry.setDate(suggestedExpiry.getDate() + 90); // +3 months
    
    setRenewalExpiryDate(suggestedExpiry.toISOString().split('T')[0]);
    setRenewalModalOpen(true);
  }

  async function handleRenewClass() {
    if (!accessToken || renewingClassId === null || !renewalExpiryDate) return;
    
    setSavingRenewal(true);
    try {
      await renewClass(accessToken, renewingClassId, {
        new_expiry_date: renewalExpiryDate,
        update_details: false, // For now, only extend expiry without editing
      });
      toast.success("Class renewed successfully");
      setRenewalModalOpen(false);
      setRenewingClassId(null);
      setRenewingClassName("");
      setRenewalExpiryDate("");
      await loadAll();
    } catch (error: any) {
      const errorMsg = error?.message || "Failed to renew class";
      toast.error(errorMsg);
    } finally {
      setSavingRenewal(false);
    }
  }

  async function handlePublishSession() {
    if (!accessToken || !selectedSessionId) return;
    try {
      await publishSession(accessToken, selectedSessionId);
      toast.success("Session published successfully! It's now visible to clients.");
      setPublishModalOpen(false);
      setSelectedSessionId(null);
      await loadAll();
    } catch {
      toast.error("Failed to publish session");
    }
  }

  function openPublishModal(sessionId: number) {
    setSelectedSessionId(sessionId);
    setPublishModalOpen(true);
  }

  async function openAttendanceModal(
    sessionId: number,
    sessionDate: string,
    sessionTitle: string,
    sessionTime: string
  ) {
    if (!accessToken) return;

    setSelectedSessionId(sessionId);
    setSelectedSessionDate(sessionDate);
    setSelectedSessionTitle(sessionTitle);
    setSelectedSessionTime(sessionTime);
    
    // Fetch enrollments for this session
    try {
      const enrollments = await getSessionEnrollments(accessToken, sessionId);
      setSessionEnrollments(enrollments);
      setAttendanceModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch session enrollments:", error);
      toast.error("Failed to load enrollments");
    }
  }

  // ── Schedule tab helpers ─────────────────────────────────────────────────────

  type DaySession = { 
    classItem: GroupClass; 
    sessionDate: string; 
    startTime: string; 
    sessionId: number; 
    enrolledCount: number;
    status?: string;
  };

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
        status: s.status,
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
                Sessions
              </h1>
              <p className="text-sm sm:text-base text-zinc-400 mt-0.5 sm:mt-1">Manage your sessions, class schedules, and client enrollments</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {tierLimits && (
              <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white/5 border border-white/10">
                <div className="flex flex-col gap-1 min-w-[140px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Classes</span>
                    <span className="text-xs font-medium text-white">
                      {tierLimits.usage.active_classes} / {tierLimits.limits.max_active_classes}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        tierLimits.usage.active_classes / tierLimits.limits.max_active_classes >= 0.95
                          ? "bg-rose-500"
                          : tierLimits.usage.active_classes / tierLimits.limits.max_active_classes >= 0.8
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(100, (tierLimits.usage.active_classes / tierLimits.limits.max_active_classes) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div className="flex flex-col gap-1 min-w-[140px]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Sessions</span>
                    <span className="text-xs font-medium text-white">
                      {tierLimits.usage.sessions_this_month} / {tierLimits.limits.max_sessions_per_month}
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        tierLimits.usage.sessions_this_month / tierLimits.limits.max_sessions_per_month >= 0.95
                          ? "bg-rose-500"
                          : tierLimits.usage.sessions_this_month / tierLimits.limits.max_sessions_per_month >= 0.8
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(100, (tierLimits.usage.sessions_this_month / tierLimits.limits.max_sessions_per_month) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2">
                  <Badge className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-400/30 text-xs font-medium capitalize">
                    {tierLimits.tier}
                  </Badge>
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setRunTutorial(true);
                }}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
              >
                <HelpCircle className="size-4 mr-2" />
                Tutorial
              </Button>
              <Button
                onClick={() => setNewClassOpen(true)}
                className="tutorial-create-class-button w-full sm:w-auto bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 hover:from-amber-600 hover:via-amber-700 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30"
              >
                <Plus className="size-4 mr-2" />
                New Class
              </Button>
            </div>
          </div>
        </div>

        {/* Expiring Classes Banner */}
        {expiringClasses.length > 0 && (
          <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 p-4 border border-amber-400/30 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-amber-400 mb-1">
                  {expiringClasses.length} {expiringClasses.length === 1 ? 'class needs' : 'classes need'} renewal
                </h3>
                <p className="text-xs text-zinc-400 mb-3">
                  Classes expiring soon or already expired require renewal to create new sessions.
                </p>
                <div className="space-y-2">
                  {expiringClasses.map((cls) => (
                    <div
                      key={cls.class_id}
                      className="flex items-center justify-between p-2 rounded-lg bg-black/20 border border-amber-400/20"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{cls.title}</div>
                        <div className="text-xs text-zinc-400">
                          {cls.days_until_expiry < 0 ? (
                            <span className="text-rose-400">Expired {Math.abs(cls.days_until_expiry)} days ago</span>
                          ) : cls.days_until_expiry === 0 ? (
                            <span className="text-amber-400">Expires today</span>
                          ) : (
                            <span>Expires in {cls.days_until_expiry} days ({formatDate(cls.expires_on)})</span>
                          )}
                          {cls.has_active_enrollments && (
                            <span className="ml-2 text-sky-400">• {cls.active_enrollments_count} active enrollments</span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openRenewalModal(cls.class_id, cls.title, cls.expires_on)}
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        Renew
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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
        <div className="tutorial-tabs flex gap-2 border-b border-white/10 pb-1">
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
            <div className="tutorial-stats-section grid gap-4 md:grid-cols-3">
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
            ) : null}

            {/* ────────────────────────────────────────────────────────────────────
                CARD STYLE CLASSES VIEW (COMMENTED OUT - PREFER LIST VIEW)
                Uncomment this section if you want to use card-based layout
            ──────────────────────────────────────────────────────────────────── */}
            {/* {classes.length > 0 && (
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
                        {classItem.expires_on && (() => {
                          const daysUntil = getDaysUntilExpiry(classItem.expires_on);
                          const level = getExpiryWarningLevel(daysUntil);
                          if (level === "critical" || level === "warning") {
                            return (
                              <div className={`flex items-center gap-2 p-2 rounded-lg border ${
                                level === "critical" 
                                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400" 
                                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              }`}>
                                <AlertTriangle className="size-4 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium">
                                    {daysUntil !== null && daysUntil < 0 
                                      ? "Class expired" 
                                      : daysUntil === 0 
                                      ? "Expires today" 
                                      : `Expires in ${daysUntil} day${daysUntil !== 1 ? "s" : ""}`}
                                  </p>
                                  <p className="text-xs opacity-80">{formatDate(classItem.expires_on)}</p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        })()}
                        {classItem.upcoming_sessions.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-zinc-500 mb-2">Upcoming Sessions</p>
                            <div className="flex flex-wrap gap-2">
                              {classItem.upcoming_sessions.slice(0, 3).map((session) => (
                                <div key={session.id} className="flex items-center gap-1.5">
                                  <Badge className={`${
                                    session.status === "draft"
                                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                                      : "bg-sky-500/20 text-sky-400 border-sky-500/30"
                                  } border text-xs flex items-center gap-1`}>
                                    <Clock className="size-3 inline-block" />
                                    {formatDate(session.session_date)} • {formatTime(session.start_time)}
                                    {session.status === "published" && session.enrolled_count > 0 && (
                                      <span title="Locked - cannot edit (has enrollments)" className="inline-flex">
                                        <Lock className="size-2.5 opacity-60" />
                                      </span>
                                    )}
                                  </Badge>
                                  {session.status === "draft" && (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openPublishModal(session.id);
                                        }}
                                        className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 rounded hover:bg-emerald-500/30 transition-colors"
                                        title="Publish session"
                                      >
                                        <Send className="size-3 inline-block" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteSession(classItem.id, session.id, session.session_date);
                                        }}
                                        className="px-2 py-1 text-xs bg-rose-500/20 text-rose-400 border border-rose-400/30 rounded hover:bg-rose-500/30 transition-colors"
                                        title="Delete session"
                                      >
                                        <Trash2 className="size-3 inline-block" />
                                      </button>
                                    </>
                                  )}
                                  {session.status === "published" && session.enrolled_count === 0 && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSession(classItem.id, session.id, session.session_date);
                                      }}
                                      className="px-2 py-1 text-xs bg-rose-500/20 text-rose-400 border border-rose-400/30 rounded hover:bg-rose-500/30 transition-colors"
                                      title="Delete session (no enrollments)"
                                    >
                                      <Trash2 className="size-3 inline-block" />
                                    </button>
                                  )}
                                </div>
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
                          {classItem.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (window.confirm(`Delete "${classItem.title}"? This action cannot be undone.`)) {
                                  handleDeleteClass(classItem.id);
                                }
                              }}
                              className="text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10"
                              title="Delete draft class"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </EliteGlassCard>
                  );
                })}
              </div>
            )} */}

            {/* ── DETAILED LIST VIEW ────────────────────────────────────────────── */}
            {classes.length > 0 && (
              <div className="tutorial-detailed-list mt-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Detailed Class List</h3>
                    <p className="text-sm text-zinc-400">All classes with full details and quick actions</p>
                  </div>
                </div>
                
                <EliteGlassCard className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10 text-left bg-white/[0.02]">
                          <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Class</th>
                          <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Location</th>
                          <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Capacity</th>
                          <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Price</th>
                          <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Sessions</th>
                          <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">Expiry</th>
                          <th className="px-4 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classes.map((classItem) => {
                          const statusBadgeClass =
                            classItem.status === "active"
                              ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                              : classItem.status === "draft"
                              ? "bg-zinc-500/20 text-zinc-400 border-zinc-500/30"
                              : "bg-rose-500/20 text-rose-400 border-rose-500/30";
                          const statusLabel =
                            classItem.status === "active" ? "Active" : classItem.status === "draft" ? "Draft" : "Cancelled";
                          const daysUntil = getDaysUntilExpiry(classItem.expires_on);
                          const expiryLevel = getExpiryWarningLevel(daysUntil);
                          const isExpanded = expandedClasses.includes(classItem.id);

                          return (
                            <Fragment key={classItem.id}>
                              <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                <td className="px-4 py-4">
                                  <button
                                    onClick={() => {
                                      setExpandedClasses(prev => 
                                        prev.includes(classItem.id) 
                                          ? prev.filter(id => id !== classItem.id)
                                          : [...prev, classItem.id]
                                      );
                                    }}
                                    className="tutorial-expand-class w-full text-left flex items-center gap-2 group"
                                  >
                                    <ChevronDown 
                                      className={`size-4 text-zinc-500 transition-transform flex-shrink-0 ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`}
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium text-white mb-1 group-hover:text-emerald-400 transition-colors">
                                        {classItem.title}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Badge className={`${categoryBadgeClass(classItem.category as ClassCategory)} border text-xs capitalize`}>
                                          {classItem.category}
                                        </Badge>
                                        <span className="text-xs text-zinc-500">{classItem.duration_minutes} min</span>
                                      </div>
                                    </div>
                                  </button>
                                </td>
                              <td className="px-4 py-4">
                                <Badge className={`${statusBadgeClass} border text-xs`}>{statusLabel}</Badge>
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-1.5 text-sm text-zinc-300">
                                  <MapPin className="size-3.5 text-zinc-500" />
                                  <span className="truncate max-w-[150px]">{classItem.work_location_name ?? "No location"}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-sm text-zinc-300">
                                  <span className="font-medium text-white">{classItem.enrolled_count}</span>
                                  <span className="text-zinc-500">/{classItem.capacity}</span>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-base font-semibold text-emerald-400">₹{classItem.price}</div>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-sm">
                                  <div className="text-white font-medium">{classItem.upcoming_sessions.length} upcoming</div>
                                  <div className="text-xs text-zinc-500">
                                    {classItem.upcoming_sessions.filter(s => s.status === "published").length} published
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                {classItem.expires_on && (
                                  <div className="text-sm">
                                    <div className={`font-medium ${
                                      expiryLevel === "critical" ? "text-rose-400" :
                                      expiryLevel === "warning" ? "text-amber-400" :
                                      "text-zinc-300"
                                    }`}>
                                      {daysUntil !== null && daysUntil < 0 
                                        ? "Expired" 
                                        : daysUntil === 0 
                                        ? "Today" 
                                        : `${daysUntil}d left`}
                                    </div>
                                    <div className="text-xs text-zinc-500">{formatDate(classItem.expires_on)}</div>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCurrentTab("enrollments")}
                                    className="text-zinc-400 hover:text-white hover:bg-white/5 h-8"
                                    title="View enrollments"
                                  >
                                    <Eye className="size-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedClassId(classItem.id);
                                      setAddSessionOpen(true);
                                    }}
                                    className="tutorial-add-session text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10 h-8"
                                    title="Add session"
                                  >
                                    <CalendarPlus className="size-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDrawer(classItem)}
                                    className="text-zinc-400 hover:text-white hover:bg-white/5 h-8"
                                    title="Edit class"
                                  >
                                    <Pencil className="size-3.5" />
                                  </Button>
                                  {classItem.status === "draft" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (window.confirm(`Delete "${classItem.title}"? This action cannot be undone.`)) {
                                          handleDeleteClass(classItem.id);
                                        }
                                      }}
                                      className="text-zinc-400 hover:text-rose-400 hover:bg-rose-400/10 h-8"
                                      title="Delete draft class"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* Expanded Sessions List */}
                            {isExpanded && classItem.upcoming_sessions.length > 0 && (
                              <tr key={`${classItem.id}-sessions`}>
                                <td colSpan={8} className="px-0 py-0 bg-white/[0.01]">
                                  <div className="px-4 py-3">
                                    <div className="space-y-2">
                                      {classItem.upcoming_sessions.map((session) => (
                                        <div 
                                          key={session.id}
                                          className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors"
                                        >
                                          {/* Date & Time */}
                                          <div className="flex items-center gap-3 min-w-[180px]">
                                            <div className="flex items-center gap-1.5 text-sm">
                                              <CalendarDays className="size-4 text-zinc-500" />
                                              <span className="text-zinc-300">{formatDate(session.session_date)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-sm">
                                              <Clock className="size-4 text-zinc-500" />
                                              <span className="text-zinc-300">{session.start_time.slice(0, 5)}</span>
                                            </div>
                                          </div>

                                          {/* Status Badge */}
                                          <div className="min-w-[100px]">
                                            {session.status === "draft" ? (
                                              <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30 border text-xs">
                                                Draft
                                              </Badge>
                                            ) : session.status === "published" ? (
                                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">
                                                Published
                                              </Badge>
                                            ) : (
                                              <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 border text-xs">
                                                Cancelled
                                              </Badge>
                                            )}
                                          </div>

                                          {/* Enrollment Count */}
                                          <div className="flex items-center gap-1.5 text-sm min-w-[80px]">
                                            <Users className="size-4 text-zinc-500" />
                                            <span className="text-white font-medium">{session.enrolled_count}</span>
                                            <span className="text-zinc-500">enrolled</span>
                                            {session.interest_count > 0 && (
                                              <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
                                                +{session.interest_count} interested
                                              </span>
                                            )}
                                          </div>

                                          {/* Actions */}
                                          <div className="ml-auto flex items-center gap-2">
                                            {session.status === "draft" && (
                                              <>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    openPublishModal(session.id);
                                                  }}
                                                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10 h-8 px-3"
                                                  title="Publish session"
                                                >
                                                  <Send className="size-3.5 mr-1.5" />
                                                  Publish
                                                </Button>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSession(classItem.id, session.id, session.session_date);
                                                  }}
                                                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 h-8"
                                                  title="Delete session"
                                                >
                                                  <Trash2 className="size-3.5" />
                                                </Button>
                                              </>
                                            )}
                                            {session.status === "published" && session.enrolled_count === 0 && new Date(session.session_date) > new Date() && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeleteSession(classItem.id, session.id, session.session_date);
                                                }}
                                                className="text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 h-8"
                                                title="Delete session (no enrollments)"
                                              >
                                                <Trash2 className="size-3.5" />
                                              </Button>
                                            )}
                                            {session.status === "published" && session.enrolled_count > 0 && new Date(session.session_date) > new Date() && (
                                              <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                                <Lock className="size-3" />
                                                <span>Locked</span>
                                              </div>
                                            )}
                                            {session.status === "published" && session.enrolled_count > 0 && new Date(session.session_date) <= new Date() && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  openAttendanceModal(
                                                    session.id,
                                                    session.session_date,
                                                    classItem.title,
                                                    session.start_time
                                                  );
                                                }}
                                                className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 h-8 px-3"
                                                title="Mark attendance for this session"
                                              >
                                                <UserCheck className="size-3.5 mr-1.5" />
                                                Mark Attendance
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}

                            {isExpanded && classItem.upcoming_sessions.length === 0 && (
                              <tr key={`${classItem.id}-no-sessions`}>
                                <td colSpan={8} className="px-0 py-0 bg-white/[0.01]">
                                  <div className="px-4 py-3 text-center">
                                    <p className="text-sm text-zinc-500">No upcoming sessions</p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </EliteGlassCard>
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
                            <div key={idx} className={`group relative flex items-center gap-3 p-3 rounded-lg border transition-all ${schedCatBgClass(item.classItem.category)}`}>
                              <div className={`w-1 h-full absolute left-0 top-0 rounded-l-lg ${schedCatBarClass(item.classItem.category)}`} />
                              <div className="pl-2 min-w-[70px]">
                                <p className="text-xs font-semibold text-white">{formatTime(item.startTime)}</p>
                                <p className="text-xs text-zinc-500">{item.classItem.duration_minutes}m</p>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-sm font-medium text-white truncate">{item.classItem.title}</p>
                                  {item.status === "draft" && (
                                    <Badge className="bg-amber-500/20 text-amber-400 border-amber-400/30 text-xs">
                                      Draft
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                                    <Users className="size-3" />
                                    {item.enrolledCount}/{item.classItem.capacity}
                                  </span>
                                </div>
                              </div>
                              {item.status === "draft" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPublishModal(item.sessionId);
                                  }}
                                  className="px-2 py-1.5 text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 rounded hover:bg-emerald-500/30 transition-colors"
                                  title="Publish session"
                                >
                                  <Send className="size-3 inline-block mr-1" />
                                  Publish
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </EliteGlassCard>

            {/* Past Sessions (Attendance Marking) */}
            <EliteGlassCard className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">Past Sessions</h3>
                <p className="text-sm text-zinc-400">Mark attendance for completed sessions</p>
              </div>
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const pastSessions: DaySession[] = [];
                classes.forEach((classItem) => {
                  classItem.upcoming_sessions.forEach((s) => {
                    const sessionDate = new Date(s.session_date);
                    sessionDate.setHours(0, 0, 0, 0);
                    if (sessionDate < today) {
                      pastSessions.push({
                        classItem,
                        sessionDate: s.session_date,
                        startTime: s.start_time,
                        sessionId: s.id,
                        enrolledCount: enrollments.filter((e) => e.class_session_id === s.id).length,
                      });
                    }
                  });
                });
                pastSessions.sort((a, b) => b.sessionDate.localeCompare(a.sessionDate));

                if (pastSessions.length === 0) {
                  return (
                    <div className="text-center py-8 text-zinc-400">
                      <CalendarDays className="size-8 mx-auto mb-3 text-zinc-600" />
                      <p>No past sessions</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {pastSessions.slice(0, 5).map((session) => (
                      <div
                        key={session.sessionId}
                        className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-1 h-12 rounded-full ${schedCatBarClass(session.classItem.category)}`} />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-white">{session.classItem.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                              <span className="flex items-center gap-1">
                                <CalendarDays className="size-3" />
                                {formatDate(session.sessionDate)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="size-3" />
                                {formatTime(session.startTime)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="size-3" />
                                {session.enrolledCount} enrolled
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAttendanceModal(session.sessionId, session.sessionDate)}
                          className="bg-emerald-500/10 border-emerald-400/30 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                        >
                          <UserCheck className="size-4 mr-2" />
                          Mark Attendance
                        </Button>
                      </div>
                    ))}
                    {pastSessions.length > 5 && (
                      <p className="text-xs text-zinc-500 text-center mt-3">
                        Showing 5 of {pastSessions.length} past sessions
                      </p>
                    )}
                  </div>
                );
              })()}
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
                    <SelectItem value="all" className="text-white hover:bg-white/10 cursor-pointer">All Classes</SelectItem>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)} className="text-white hover:bg-white/10 cursor-pointer">{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-48 bg-white/5 border-white/10 text-white h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                    <SelectItem value="all" className="text-white hover:bg-white/10 cursor-pointer">All Status</SelectItem>
                    <SelectItem value="confirmed" className="text-white hover:bg-white/10 cursor-pointer">Confirmed</SelectItem>
                    <SelectItem value="cancelled" className="text-white hover:bg-white/10 cursor-pointer">Cancelled</SelectItem>
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
                        <SelectItem key={opt} value={opt} className="text-white hover:bg-white/10 cursor-pointer">{opt}</SelectItem>
                      ));
                    }
                    return (
                      <>
                        <SelectItem value="yoga" className="text-white hover:bg-white/10 cursor-pointer">Yoga</SelectItem>
                        <SelectItem value="zumba" className="text-white hover:bg-white/10 cursor-pointer">Zumba</SelectItem>
                        <SelectItem value="pilates" className="text-white hover:bg-white/10 cursor-pointer">Pilates</SelectItem>
                        <SelectItem value="hiit" className="text-white hover:bg-white/10 cursor-pointer">HIIT</SelectItem>
                        <SelectItem value="dance" className="text-white hover:bg-white/10 cursor-pointer">Dance</SelectItem>
                        <SelectItem value="other" className="text-white hover:bg-white/10 cursor-pointer">Other</SelectItem>
                      </>
                    );
                  })()}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-medium text-zinc-300 mb-2 block">Display Term</Label>
              <Select value={newClassDisplayTerm} onValueChange={(value: "session" | "workshop" | "class") => setNewClassDisplayTerm(value)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-11"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                  <SelectItem value="session" className="text-white hover:bg-white/10 cursor-pointer">Session</SelectItem>
                  <SelectItem value="workshop" className="text-white hover:bg-white/10 cursor-pointer">Workshop</SelectItem>
                  <SelectItem value="class" className="text-white hover:bg-white/10 cursor-pointer">Class</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-zinc-500 mt-1.5">How clients will see this (e.g., "Book Session" vs "Book Workshop")</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-zinc-300 mb-2 block">Session Mode</Label>
              <Select value={newClassSessionMode} onValueChange={(value: "online" | "in_person" | "hybrid") => setNewClassSessionMode(value)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white h-11"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                  <SelectItem value="online" className="text-white hover:bg-white/10 cursor-pointer">Online (Video)</SelectItem>
                  <SelectItem value="in_person" className="text-white hover:bg-white/10 cursor-pointer">In-Person</SelectItem>
                  <SelectItem value="hybrid" className="text-white hover:bg-white/10 cursor-pointer">Hybrid (Both)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-zinc-500 mt-1.5">
                {newClassSessionMode === "online" && "Virtual sessions via video call"}
                {newClassSessionMode === "in_person" && "Physical location required"}
                {newClassSessionMode === "hybrid" && "Clients choose online or in-person"}
              </p>
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
                    <SelectItem key={loc.id} value={String(loc.id)} className="text-white hover:bg-white/10 cursor-pointer">{loc.name}</SelectItem>
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
              <Label className="text-sm font-medium text-zinc-300 mb-2 block">Expiry Date</Label>
              <Input
                type="date"
                value={newClassExpiryDate}
                onChange={(e) => setNewClassExpiryDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="bg-white/5 border-white/10 text-white focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 h-11"
              />
              <p className="text-xs text-zinc-500 mt-1.5">
                Classes expire after this date. Sessions cannot be created beyond expiry. Default: 3 months.
              </p>
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
        <AlertDialogContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Schedule New Session</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Create one or multiple recurring sessions for this class
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            {/* Recurrence Type */}
            <div>
              <Label className="text-sm font-medium text-zinc-300 mb-2 block">Recurrence Type</Label>
              <Select value={recurrenceType} onValueChange={(v) => setRecurrenceType(v as "single" | "daily" | "weekly")}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single Session</SelectItem>
                  <SelectItem value="daily">Daily (Every Day)</SelectItem>
                  <SelectItem value="weekly">Weekly (Specific Days)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-4 grid-cols-2">
              <div>
                <Label className="text-sm font-medium text-zinc-300 mb-2 block">
                  {recurrenceType === "single" ? "Session Date" : "Start Date"}
                </Label>
                <Input
                  type="date"
                  value={newSessionDate}
                  onChange={(e) => setNewSessionDate(e.target.value)}
                  className="bg-white/5 border-white/10 text-white focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 h-11"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-zinc-300 mb-2 block">Start Time</Label>
                <Input
                  type="time"
                  value={newSessionTime}
                  onChange={(e) => setNewSessionTime(e.target.value)}
                  className="bg-white/5 border-white/10 text-white focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 h-11"
                />
              </div>
            </div>
            
            {/* Weekly: Days of Week Selector */}
            {recurrenceType === "weekly" && (
              <div>
                <Label className="text-sm font-medium text-zinc-300 mb-2 block">Days of Week</Label>
                <div className="flex flex-wrap gap-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                    <Button
                      key={day}
                      type="button"
                      variant={selectedDays.includes(index) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (selectedDays.includes(index)) {
                          setSelectedDays(selectedDays.filter((d) => d !== index));
                        } else {
                          setSelectedDays([...selectedDays, index].sort());
                        }
                      }}
                      className={selectedDays.includes(index) 
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                        : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"}
                    >
                      {day}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Recurrence End Condition */}
            {recurrenceType !== "single" && (
              <>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant={useEndDate ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseEndDate(true)}
                    className={useEndDate 
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                      : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"}
                  >
                    End Date
                  </Button>
                  <Button
                    type="button"
                    variant={!useEndDate ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseEndDate(false)}
                    className={!useEndDate 
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                      : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"}
                  >
                    Number of Sessions
                  </Button>
                </div>
                
                {useEndDate ? (
                  <div>
                    <Label className="text-sm font-medium text-zinc-300 mb-2 block">End Date</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="bg-white/5 border-white/10 text-white focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 h-11"
                    />
                  </div>
                ) : (
                  <div>
                    <Label className="text-sm font-medium text-zinc-300 mb-2 block">Number of Sessions</Label>
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={numberOfSessions}
                      onChange={(e) => setNumberOfSessions(e.target.value)}
                      className="bg-white/5 border-white/10 text-white focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 h-11"
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAddSessionOpen(false)} className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSaveSession}
              disabled={savingSession || !newSessionDate || !newSessionTime || (recurrenceType === "weekly" && selectedDays.length === 0)}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
            >
              {savingSession ? "Scheduling…" : recurrenceType === "single" ? "Schedule Session" : "Schedule Sessions"}
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
                  <SelectItem value="gym" className="text-white hover:bg-white/10 cursor-pointer">Gym</SelectItem>
                  <SelectItem value="studio" className="text-white hover:bg-white/10 cursor-pointer">Studio</SelectItem>
                  <SelectItem value="home" className="text-white hover:bg-white/10 cursor-pointer">Home Visits</SelectItem>
                  <SelectItem value="online" className="text-white hover:bg-white/10 cursor-pointer">Online</SelectItem>
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

      {/* ── Publish Session Modal ──────────────────────────────────────────────── */}
      <AlertDialog open={publishModalOpen} onOpenChange={setPublishModalOpen}>
        <AlertDialogContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <Send className="size-5 text-emerald-400" />
              Publish Session
            </AlertDialogTitle>
            <AlertDialogDescription asChild className="text-zinc-400 space-y-2">
              <div>
                <p>Publishing this session will make it visible to clients for enrollment.</p>
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-400/30 rounded-lg">
                  <p className="text-sm text-amber-400 flex items-center gap-2">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span><strong>Important:</strong> Published sessions cannot be edited. You can only cancel them (which triggers automatic refunds).</span>
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPublishModalOpen(false)} className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePublishSession}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
            >
              <Send className="size-4 mr-2" />
              Publish Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Mark Attendance Modal ──────────────────────────────────────────────── */}
      {selectedSessionId && (
        <AttendanceMarkingModal
          isOpen={attendanceModalOpen}
          onClose={() => setAttendanceModalOpen(false)}
          sessionId={selectedSessionId}
          sessionTitle={selectedSessionTitle}
          sessionDate={selectedSessionDate}
          sessionTime={selectedSessionTime}
          enrollments={sessionEnrollments}
          accessToken={accessToken || ""}
          onSuccess={() => {
            loadAll();
            toast.success("Attendance marked successfully");
          }}
        />
      )}

      {/* ── Tier Limit Reached Modal ───────────────────────────────────────────── */}
      <AlertDialog open={tierLimitModalOpen} onOpenChange={setTierLimitModalOpen}>
        <AlertDialogContent className="bg-[#0d1526]/95 border-amber-400/30 backdrop-blur-xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="size-5 text-amber-400" />
              Upgrade to Create More {tierLimitError?.resource === "class" ? "Classes" : "Sessions"}
            </AlertDialogTitle>
            <AlertDialogDescription asChild className="text-zinc-400 space-y-3">
              <div>
                <p>
                  You've reached the <span className="font-semibold capitalize">{tierLimitError?.tier}</span> tier limit of{" "}
                  <span className="font-semibold">{tierLimitError?.limit}</span> active{" "}
                  {tierLimitError?.resource === "class" ? "classes" : "sessions"}.
                </p>
                
                <div className="p-3 bg-emerald-500/10 border border-emerald-400/30 rounded-lg">
                  <p className="text-sm text-emerald-400 font-medium mb-2">Upgrade to Pro to unlock:</p>
                  <ul className="text-sm text-zinc-300 space-y-1.5">
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>5 active classes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>20 sessions per month</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>Priority search ranking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-emerald-400">✓</span>
                      <span>Analytics dashboard</span>
                    </li>
                  </ul>
                </div>

                <p className="text-xs text-zinc-500">
                  Current usage: {tierLimitError?.current_usage} / {tierLimitError?.limit}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => setTierLimitModalOpen(false)} 
              className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
            >
              Stay on {tierLimitError?.tier ? tierLimitError.tier.charAt(0).toUpperCase() + tierLimitError.tier.slice(1) : "Free"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setTierLimitModalOpen(false);
                window.location.href = "/v2/partner/settings?tab=subscription";
              }}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
            >
              <svg className="size-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              Upgrade to Pro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Class Renewal Modal ───────────────────────────────────────────────── */}
      <AlertDialog open={renewalModalOpen} onOpenChange={setRenewalModalOpen}>
        <AlertDialogContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white flex items-center gap-2">
              <CalendarCheck className="size-5 text-amber-400" />
              Renew Class
            </AlertDialogTitle>
            <AlertDialogDescription asChild className="text-zinc-400 space-y-3">
              <div>
                <p>Renewing <span className="font-semibold text-white">{renewingClassName}</span> will allow you to create new sessions beyond the current expiry date.</p>
                
                <div>
                  <Label htmlFor="renewal-expiry" className="text-sm font-medium text-zinc-300 mb-2 block">
                    New Expiry Date
                  </Label>
                  <Input
                    id="renewal-expiry"
                    type="date"
                    value={renewalExpiryDate}
                    onChange={(e) => setRenewalExpiryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="bg-white/5 border-white/10 text-white"
                  />
                  <p className="text-xs text-zinc-500 mt-1.5">
                    Suggested: 3 months from current expiry
                  </p>
                </div>

                <div className="p-3 bg-sky-500/10 border border-sky-400/30 rounded-lg">
                  <p className="text-sm text-sky-400 flex items-center gap-2">
                    <AlertCircle className="size-4 shrink-0" />
                    <span>Existing sessions will remain unchanged. Active enrollments will be honored.</span>
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setRenewalModalOpen(false);
                setRenewingClassId(null);
                setRenewingClassName("");
                setRenewalExpiryDate("");
              }}
              className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
              disabled={savingRenewal}
            >
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={handleRenewClass}
              disabled={savingRenewal || !renewalExpiryDate}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/20"
            >
              {savingRenewal ? (
                <>
                  <span className="animate-spin size-4 border-2 border-white/30 border-t-white rounded-full mr-2" />
                  Renewing...
                </>
              ) : (
                <>
                  <CalendarCheck className="size-4 mr-2" />
                  Renew Class
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── TUTORIAL WALKTHROUGH ──────────────────────────────────────────────── */}
      <Joyride
        steps={classesManagerTutorialSteps}
        run={runTutorial}
        continuous
        showProgress
        showSkipButton
        disableScrolling={false}
        styles={tutorialStyles}
        floaterProps={{
          styles: {
            floater: {
              filter: 'none',
            },
          },
        }}
        callback={(data: CallBackProps) => {
          const { status } = data;
          
          if (["finished", "skipped"].includes(status as any)) {
            setRunTutorial(false);
            // Mark tutorial as completed
            localStorage.setItem('classesManagerTutorialCompleted', 'true');
          }
        }}
      />
    </div>
  );
}
