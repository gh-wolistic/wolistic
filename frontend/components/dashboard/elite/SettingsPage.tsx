"use client";

import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Shield,
  Bell,
  Gem,
  EyeOff,
  AlertTriangle,
  Lock,
  ChevronDown,
  Download,
  Trash2,
  Check,
  Sparkles,
  Calendar,
  Star,
  Wallet,
  Info,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { toast } from "sonner";

import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import {
  getSettings,
  updateAccountSettings,
  updateNotificationsSettings,
  updatePrivacySettings,
  requestDataExport,
  deleteAccount,
  type NotificationsPayload,
  type PrivacyPayload,
} from "./settingsApi";

// ── Sub-components ─────────────────────────────────────────────────────────────

function EliteGlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-violet-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative">{children}</div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
  iconColor = "text-emerald-400",
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  iconColor?: string;
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-2">
        <div className="rounded-xl bg-gradient-to-br from-white/10 to-white/5 p-2.5 border border-white/10">
          <Icon className={`size-5 ${iconColor}`} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <p className="text-sm text-zinc-400">{subtitle}</p>
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-white/20 via-white/5 to-transparent mt-4" />
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

interface SettingsPageProps {
  userName: string;
  userEmail: string;
  membershipTier: string | null;
  onNavigateToSubscription?: () => void;
}

export function SettingsPage({ userName, userEmail, membershipTier, onNavigateToSubscription }: SettingsPageProps) {
  const { accessToken } = useAuthSession();

  // Account
  const [displayName, setDisplayName] = useState(userName);
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [language, setLanguage] = useState("EN");

  // Notifications
  const [notifications, setNotifications] = useState<NotificationsPayload>({
    newBooking: { email: true, inApp: true },
    sessionReminder: { email: true, inApp: true },
    reviewReceived: { email: true, inApp: true },
    followUpDue: { email: true, inApp: true },
    paymentReceived: { email: true, inApp: false },
    coinReward: { email: false, inApp: true },
    platformTips: { email: false, inApp: false },
  });
  const [weeklyDigest, setWeeklyDigest] = useState(true);
  const [notificationSections, setNotificationSections] = useState({
    clientBookings: false,
    engagement: false,
    financial: false,
    platform: false,
  });



  // Privacy
  const [privacy, setPrivacy] = useState<PrivacyPayload>({
    profileVisible: true,
    showInSearch: true,
    allowMessages: true,
    shareActivityData: false,
  });

  // Delete account
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // ── Load settings from backend ───────────────────────────
  useEffect(() => {
    if (!accessToken) return;
    getSettings(accessToken)
      .then((data) => {
        if (data.display_name) setDisplayName(data.display_name);
        setTimezone(data.timezone);
        setLanguage(data.language);
        setNotifications(data.notifications);
        setWeeklyDigest(data.weekly_digest);
        setPrivacy(data.privacy);
      })
      .catch(() => {
        // silently fall back to defaults
      });
  }, [accessToken]);

  // ── Handlers ───────────────────────────────────────────────

  const handleSaveAccount = async () => {
    if (!accessToken) return;
    try {
      await updateAccountSettings(accessToken, {
        display_name: displayName,
        timezone,
        language,
      });
      toast.success("Account settings saved");
    } catch {
      toast.error("Failed to save account settings");
    }
  };

  const handleSaveNotifications = async () => {
    if (!accessToken) return;
    try {
      await updateNotificationsSettings(accessToken, {
        notifications,
        weekly_digest: weeklyDigest,
      });
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Failed to save notification settings");
    }
  };

  const handleSavePrivacy = async () => {
    if (!accessToken) return;
    try {
      await updatePrivacySettings(accessToken, { privacy });
      toast.success("Privacy settings saved");
    } catch {
      toast.error("Failed to save privacy settings");
    }
  };

  const handleExportData = async () => {
    if (!accessToken) return;
    try {
      await requestDataExport(accessToken);
      toast.success("Export requested. You'll receive an email within 24 hours.");
    } catch {
      toast.error("Failed to request data export");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE" || !accessToken) return;
    try {
      await deleteAccount(accessToken);
      toast.success("Account deletion initiated");
      setDeleteDialogOpen(false);
      setDeleteConfirmText("");
    } catch {
      toast.error("Failed to delete account");
    }
  };



  return (
    <div className="relative min-h-screen">
      {/* Ambient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 size-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-20 left-20 size-[400px] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      <div className="relative space-y-8 p-6 pb-16 max-w-7xl mx-auto">
        {/* Elite Page Header */}
        <div className="relative">
          <div className="flex items-center gap-4 mb-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-violet-500/20 blur-xl rounded-full" />
              <div className="relative rounded-2xl bg-gradient-to-br from-emerald-500/10 via-sky-500/10 to-violet-500/10 p-3 border border-white/10 backdrop-blur-sm">
                <SettingsIcon className="size-7 text-emerald-400" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-white to-zinc-400 bg-clip-text text-transparent">
                Settings & Preferences
              </h1>
              <p className="text-zinc-400 mt-1">Customize your Wolistic experience</p>
            </div>
          </div>
        </div>

        {/* Section 1: Account & Security */}
        <EliteGlassCard className="p-8">
          <SectionHeader
            icon={Shield}
            title="Account & Security"
            subtitle="Manage your authentication and regional settings"
            iconColor="text-sky-400"
          />

          <div className="space-y-8">
            <div className="group">
              <Label htmlFor="displayName" className="text-sm font-medium text-zinc-300 mb-2 block">
                Display Name
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="bg-white/5 border-white/10 text-white focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20 transition-all h-11"
              />
              <p className="mt-2 text-xs text-zinc-500">
                This is your name as shown in the header and notifications.
              </p>
            </div>

            <div className="group">
              <Label htmlFor="email" className="text-sm font-medium text-zinc-300 mb-2 block">
                Email Address
              </Label>
              <div className="relative">
                <Input
                  id="email"
                  value={userEmail}
                  readOnly
                  className="bg-white/5 border-white/10 text-zinc-400 pr-11 h-11 cursor-not-allowed"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-white/5 p-1.5">
                  <Lock className="size-3.5 text-zinc-500" />
                </div>
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                Email is managed by your authentication provider and cannot be changed here.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              <div className="group">
                <Label htmlFor="timezone" className="text-sm font-medium text-zinc-300 mb-2 block">
                  Timezone
                </Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                    <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                    <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                    <SelectItem value="America/Los_Angeles">America/Los Angeles (PST)</SelectItem>
                    <SelectItem value="Australia/Sydney">Australia/Sydney (AEDT)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-2 text-xs text-zinc-500">
                  Used for scheduling and availability display.
                </p>
              </div>

              <div className="group">
                <Label htmlFor="language" className="text-sm font-medium text-zinc-300 mb-2 block">
                  Interface Language
                </Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white h-11 focus:border-emerald-400/50 focus:ring-2 focus:ring-emerald-400/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                    <SelectItem value="EN">English (EN)</SelectItem>
                    <SelectItem value="HI">हिन्दी (HI)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="mt-2 text-xs text-zinc-500">
                  Language used throughout the interface.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
            <Button
              onClick={handleSaveAccount}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20 px-6"
            >
              <Check className="size-4 mr-2" />
              Save Account Settings
            </Button>
          </div>
        </EliteGlassCard>

        {/* Section 2: Notifications */}
        <EliteGlassCard className="p-8">
          <SectionHeader
            icon={Bell}
            title="Notifications"
            subtitle="Configure how you receive updates"
            iconColor="text-amber-400"
          />

          <div className="space-y-3">
            {/* Client & Bookings */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]">
              <button
                onClick={() =>
                  setNotificationSections((prev) => ({
                    ...prev,
                    clientBookings: !prev.clientBookings,
                  }))
                }
                className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-sky-500/20 to-sky-600/10 p-2 border border-sky-400/20">
                    <Calendar className="size-4 text-sky-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">Client & Bookings</p>
                    <p className="text-xs text-zinc-500">Session-related notifications</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-full bg-sky-500/10 border border-sky-400/20 px-2.5 py-1">
                    <div className="size-1 rounded-full bg-sky-400" />
                    <span className="text-xs font-medium text-sky-400">3 types</span>
                  </div>
                  <ChevronDown
                    className={`size-4 text-zinc-400 transition-transform duration-200 ${
                      notificationSections.clientBookings ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
              {notificationSections.clientBookings && (
                <div className="border-t border-white/10 bg-white/[0.02]">
                  <div className="px-5 py-3">
                    <div className="grid grid-cols-[1fr,auto,auto] gap-4 mb-3 pb-2 border-b border-white/5">
                      <div className="text-xs font-medium text-zinc-500">Type</div>
                      <div className="text-xs font-medium text-zinc-500 text-center w-14">Email</div>
                      <div className="text-xs font-medium text-zinc-500 text-center w-14">In-App</div>
                    </div>
                    {(
                      [
                        { key: "newBooking" as const, label: "New Booking Request", icon: Calendar },
                        { key: "sessionReminder" as const, label: "Session Reminder (24h before)", icon: Bell },
                        { key: "followUpDue" as const, label: "Follow-up Due", icon: Users },
                      ] as const
                    ).map(({ key, label, icon: Icon }) => (
                      <div
                        key={key}
                        className="group grid grid-cols-[1fr,auto,auto] gap-4 items-center py-3 hover:bg-white/5 rounded-lg px-3 -mx-3 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="size-3.5 text-sky-400" />
                          <span className="text-sm text-zinc-300">{label}</span>
                        </div>
                        <div className="w-14 flex justify-center">
                          <Switch
                            checked={notifications[key].email}
                            onCheckedChange={(checked) =>
                              setNotifications((prev) => ({
                                ...prev,
                                [key]: { ...prev[key], email: checked },
                              }))
                            }
                            className="data-[state=checked]:bg-sky-500"
                          />
                        </div>
                        <div className="w-14 flex justify-center">
                          <Switch
                            checked={notifications[key].inApp}
                            onCheckedChange={(checked) =>
                              setNotifications((prev) => ({
                                ...prev,
                                [key]: { ...prev[key], inApp: checked },
                              }))
                            }
                            className="data-[state=checked]:bg-sky-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Engagement */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]">
              <button
                onClick={() =>
                  setNotificationSections((prev) => ({
                    ...prev,
                    engagement: !prev.engagement,
                  }))
                }
                className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 p-2 border border-amber-400/20">
                    <Star className="size-4 text-amber-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">Engagement</p>
                    <p className="text-xs text-zinc-500">Reviews and feedback</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-400/20 px-2.5 py-1">
                    <div className="size-1 rounded-full bg-amber-400" />
                    <span className="text-xs font-medium text-amber-400">1 type</span>
                  </div>
                  <ChevronDown
                    className={`size-4 text-zinc-400 transition-transform duration-200 ${
                      notificationSections.engagement ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
              {notificationSections.engagement && (
                <div className="border-t border-white/10 bg-white/[0.02]">
                  <div className="px-5 py-3">
                    <div className="grid grid-cols-[1fr,auto,auto] gap-4 mb-3 pb-2 border-b border-white/5">
                      <div className="text-xs font-medium text-zinc-500">Type</div>
                      <div className="text-xs font-medium text-zinc-500 text-center w-14">Email</div>
                      <div className="text-xs font-medium text-zinc-500 text-center w-14">In-App</div>
                    </div>
                    {(
                      [{ key: "reviewReceived" as const, label: "Review Received", icon: Star }] as const
                    ).map(({ key, label, icon: Icon }) => (
                      <div
                        key={key}
                        className="group grid grid-cols-[1fr,auto,auto] gap-4 items-center py-3 hover:bg-white/5 rounded-lg px-3 -mx-3 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="size-3.5 text-amber-400" />
                          <span className="text-sm text-zinc-300">{label}</span>
                        </div>
                        <div className="w-14 flex justify-center">
                          <Switch
                            checked={notifications[key].email}
                            onCheckedChange={(checked) =>
                              setNotifications((prev) => ({
                                ...prev,
                                [key]: { ...prev[key], email: checked },
                              }))
                            }
                            className="data-[state=checked]:bg-amber-500"
                          />
                        </div>
                        <div className="w-14 flex justify-center">
                          <Switch
                            checked={notifications[key].inApp}
                            onCheckedChange={(checked) =>
                              setNotifications((prev) => ({
                                ...prev,
                                [key]: { ...prev[key], inApp: checked },
                              }))
                            }
                            className="data-[state=checked]:bg-amber-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Financial */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]">
              <button
                onClick={() =>
                  setNotificationSections((prev) => ({
                    ...prev,
                    financial: !prev.financial,
                  }))
                }
                className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-2 border border-emerald-400/20">
                    <Wallet className="size-4 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">Financial</p>
                    <p className="text-xs text-zinc-500">Payments and rewards</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-400/20 px-2.5 py-1">
                    <div className="size-1 rounded-full bg-emerald-400" />
                    <span className="text-xs font-medium text-emerald-400">2 types</span>
                  </div>
                  <ChevronDown
                    className={`size-4 text-zinc-400 transition-transform duration-200 ${
                      notificationSections.financial ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
              {notificationSections.financial && (
                <div className="border-t border-white/10 bg-white/[0.02]">
                  <div className="px-5 py-3">
                    <div className="grid grid-cols-[1fr,auto,auto] gap-4 mb-3 pb-2 border-b border-white/5">
                      <div className="text-xs font-medium text-zinc-500">Type</div>
                      <div className="text-xs font-medium text-zinc-500 text-center w-14">Email</div>
                      <div className="text-xs font-medium text-zinc-500 text-center w-14">In-App</div>
                    </div>
                    {(
                      [
                        { key: "paymentReceived" as const, label: "Payment Received", icon: Wallet },
                        { key: "coinReward" as const, label: "Wolistic Coins Earned", icon: Sparkles },
                      ] as const
                    ).map(({ key, label, icon: Icon }) => (
                      <div
                        key={key}
                        className="group grid grid-cols-[1fr,auto,auto] gap-4 items-center py-3 hover:bg-white/5 rounded-lg px-3 -mx-3 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="size-3.5 text-emerald-400" />
                          <span className="text-sm text-zinc-300">{label}</span>
                        </div>
                        <div className="w-14 flex justify-center">
                          <Switch
                            checked={notifications[key].email}
                            onCheckedChange={(checked) =>
                              setNotifications((prev) => ({
                                ...prev,
                                [key]: { ...prev[key], email: checked },
                              }))
                            }
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </div>
                        <div className="w-14 flex justify-center">
                          <Switch
                            checked={notifications[key].inApp}
                            onCheckedChange={(checked) =>
                              setNotifications((prev) => ({
                                ...prev,
                                [key]: { ...prev[key], inApp: checked },
                              }))
                            }
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Platform Updates */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02]">
              <button
                onClick={() =>
                  setNotificationSections((prev) => ({
                    ...prev,
                    platform: !prev.platform,
                  }))
                }
                className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-600/10 p-2 border border-violet-400/20">
                    <Info className="size-4 text-violet-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-white">Platform Updates</p>
                    <p className="text-xs text-zinc-500">Tips and feature announcements</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-full bg-violet-500/10 border border-violet-400/20 px-2.5 py-1">
                    <div className="size-1 rounded-full bg-violet-400" />
                    <span className="text-xs font-medium text-violet-400">1 type</span>
                  </div>
                  <ChevronDown
                    className={`size-4 text-zinc-400 transition-transform duration-200 ${
                      notificationSections.platform ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </button>
              {notificationSections.platform && (
                <div className="border-t border-white/10 bg-white/[0.02]">
                  <div className="px-5 py-3">
                    <div className="grid grid-cols-[1fr,auto,auto] gap-4 mb-3 pb-2 border-b border-white/5">
                      <div className="text-xs font-medium text-zinc-500">Type</div>
                      <div className="text-xs font-medium text-zinc-500 text-center w-14">Email</div>
                      <div className="text-xs font-medium text-zinc-500 text-center w-14">In-App</div>
                    </div>
                    {(
                      [{ key: "platformTips" as const, label: "Platform Tips & Updates", icon: Info }] as const
                    ).map(({ key, label, icon: Icon }) => (
                      <div
                        key={key}
                        className="group grid grid-cols-[1fr,auto,auto] gap-4 items-center py-3 hover:bg-white/5 rounded-lg px-3 -mx-3 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="size-3.5 text-violet-400" />
                          <span className="text-sm text-zinc-300">{label}</span>
                        </div>
                        <div className="w-14 flex justify-center">
                          <Switch
                            checked={notifications[key].email}
                            onCheckedChange={(checked) =>
                              setNotifications((prev) => ({
                                ...prev,
                                [key]: { ...prev[key], email: checked },
                              }))
                            }
                            className="data-[state=checked]:bg-violet-500"
                          />
                        </div>
                        <div className="w-14 flex justify-center">
                          <Switch
                            checked={notifications[key].inApp}
                            onCheckedChange={(checked) =>
                              setNotifications((prev) => ({
                                ...prev,
                                [key]: { ...prev[key], inApp: checked },
                              }))
                            }
                            className="data-[state=checked]:bg-violet-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Weekly Digest */}
            <div className="relative mt-6 overflow-hidden rounded-xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-amber-600/10">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-orange-500/5" />
              <div className="relative flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-amber-500/30 to-orange-500/20 p-2.5 border border-amber-400/30 shadow-lg shadow-amber-500/20">
                    <Sparkles className="size-5 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Weekly Digest Email</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Receive a curated weekly summary of your activity, insights, and performance metrics
                    </p>
                  </div>
                </div>
                <Switch
                  checked={weeklyDigest}
                  onCheckedChange={setWeeklyDigest}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
            <Button
              onClick={handleSaveNotifications}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20 px-6"
            >
              <Check className="size-4 mr-2" />
              Save Notification Preferences
            </Button>
          </div>
        </EliteGlassCard>

        {/* Section 3: Subscription & Billing */}
        <EliteGlassCard className="p-8">
          <SectionHeader
            icon={Gem}
            title="Subscription & Billing"
            subtitle="Manage your membership and payment details"
            iconColor="text-violet-400"
          />

          <div className="flex items-center justify-between gap-6 rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 to-violet-600/5 p-6">
            <div>
              <p className="text-sm font-medium text-white mb-1">View your plan, features, and billing history</p>
              <p className="text-xs text-zinc-400">Manage your active subscription and compare available plans</p>
            </div>
            <Button
              onClick={onNavigateToSubscription}
              className="shrink-0 bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white shadow-lg shadow-violet-500/20"
            >
              <Gem className="size-4 mr-2" />
              Go to Subscription
            </Button>
          </div>
        </EliteGlassCard>

        {/* Section 4: Privacy & Visibility */}
        <EliteGlassCard className="p-8">
          <SectionHeader
            icon={EyeOff}
            title="Privacy & Visibility"
            subtitle="Control how your profile appears to others"
            iconColor="text-cyan-400"
          />

          <div className="space-y-1">
            {(
              [
                {
                  key: "profileVisible" as const,
                  label: "Profile Visible to Public",
                  help: "Your profile appears in search results and public browsing",
                  color: "emerald",
                },
                {
                  key: "showInSearch" as const,
                  label: "Appear in Search Results",
                  help: "Show up when users search the Wolistic directory",
                  color: "sky",
                },
                {
                  key: "allowMessages" as const,
                  label: "Allow Messages from New Clients",
                  help: "Enable clients who haven't booked to send you messages",
                  color: "violet",
                },
                {
                  key: "shareActivityData" as const,
                  label: "Share Anonymous Activity Data",
                  help: "Help improve Wolistic recommendations and platform features",
                  color: "amber",
                },
              ] as const
            ).map(({ key, label, help, color }) => (
              <div
                key={key}
                className="group flex items-start justify-between py-4 px-4 -mx-4 rounded-xl hover:bg-white/5 transition-all"
              >
                <div className="flex-1 pr-6">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`size-1.5 rounded-full bg-${color}-400 opacity-60`} />
                    <p className="text-sm font-medium text-white">{label}</p>
                  </div>
                  <p className="text-xs text-zinc-500 pl-3.5">{help}</p>
                </div>
                <div className="pt-0.5">
                  <Switch
                    checked={privacy[key]}
                    onCheckedChange={(checked) =>
                      setPrivacy((prev) => ({ ...prev, [key]: checked }))
                    }
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
            <Button
              onClick={handleSavePrivacy}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20 px-6"
            >
              <Check className="size-4 mr-2" />
              Save Privacy Settings
            </Button>
          </div>
        </EliteGlassCard>

        {/* Section 5: Danger Zone */}
        <EliteGlassCard className="p-8 border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent">
          <SectionHeader
            icon={AlertTriangle}
            title="Danger Zone"
            subtitle="Destructive actions that cannot be undone"
            iconColor="text-rose-400"
          />

          <div className="space-y-6">
            {/* Export Data */}
            <div className="flex items-start justify-between p-5 rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-500/5 to-transparent hover:border-rose-500/30 hover:bg-rose-500/10 transition-all group">
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-2 mb-1.5">
                  <Download className="size-4 text-rose-400" />
                  <h3 className="text-sm font-semibold text-white">Export My Data</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Download a complete copy of your profile, bookings, client data, and activity history in JSON format.
                </p>
              </div>
              <Button
                onClick={handleExportData}
                variant="outline"
                className="gap-2 border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:border-rose-400/60 hover:text-rose-200 shadow-lg shadow-rose-500/10"
              >
                <Download className="size-4" />
                Request Export
              </Button>
            </div>

            {/* Delete Account */}
            <div className="flex items-start justify-between p-5 rounded-xl border-2 border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-rose-600/5 hover:border-rose-500/50 hover:bg-rose-500/15 transition-all group">
              <div className="flex-1 pr-6">
                <div className="flex items-center gap-2 mb-1.5">
                  <Trash2 className="size-4 text-rose-400" />
                  <h3 className="text-sm font-semibold text-white">Delete Account Permanently</h3>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Permanently delete your expert profile, all client data, session history, and earnings. This action is irreversible and cannot be undone.
                </p>
              </div>
              <Button
                onClick={() => setDeleteDialogOpen(true)}
                className="gap-2 bg-gradient-to-r from-rose-500/20 to-rose-600/20 text-rose-300 border-2 border-rose-500/40 hover:from-rose-500/30 hover:to-rose-600/30 hover:border-rose-400/60 hover:text-rose-200 shadow-lg shadow-rose-500/20"
              >
                <Trash2 className="size-4" />
                Delete Account
              </Button>
            </div>
          </div>
        </EliteGlassCard>

        {/* Delete Account Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-zinc-400">
                This will permanently delete your expert profile, all client data, sessions, and earnings
                history. Type <span className="font-semibold text-white">DELETE</span> to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setDeleteConfirmText("");
                  setDeleteDialogOpen(false);
                }}
                className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== "DELETE"}
                className="bg-rose-500 hover:bg-rose-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
