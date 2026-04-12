const fallbackApiBase =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000";

const rawApiBase =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
  fallbackApiBase;

const API_BASE = rawApiBase.replace(/\/$/, "").endsWith("/api/v1")
  ? rawApiBase.replace(/\/$/, "")
  : `${rawApiBase.replace(/\/$/, "")}/api/v1`;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface NotificationChannel {
  email: boolean;
  inApp: boolean;
}

export interface NotificationsPayload {
  newBooking: NotificationChannel;
  sessionReminder: NotificationChannel;
  reviewReceived: NotificationChannel;
  followUpDue: NotificationChannel;
  paymentReceived: NotificationChannel;
  coinReward: NotificationChannel;
  platformTips: NotificationChannel;
}

export interface PrivacyPayload {
  profileVisible: boolean;
  showInSearch: boolean;
  allowMessages: boolean;
  shareActivityData: boolean;
}

export interface SettingsRecord {
  display_name: string | null;
  timezone: string;
  language: string;
  notifications: NotificationsPayload;
  weekly_digest: boolean;
  privacy: PrivacyPayload;
}

// ── API Calls ─────────────────────────────────────────────────────────────────

export async function getSettings(token: string): Promise<SettingsRecord> {
  const res = await fetch(`${API_BASE}/partners/settings/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to load settings");
  return res.json();
}

export async function updateAccountSettings(
  token: string,
  payload: { display_name?: string | null; timezone: string; language: string }
): Promise<SettingsRecord> {
  const res = await fetch(`${API_BASE}/partners/settings/account`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save account settings");
  return res.json();
}

export async function updateNotificationsSettings(
  token: string,
  payload: { notifications: NotificationsPayload; weekly_digest: boolean }
): Promise<SettingsRecord> {
  const res = await fetch(`${API_BASE}/partners/settings/notifications`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save notification settings");
  return res.json();
}

export async function updatePrivacySettings(
  token: string,
  payload: { privacy: PrivacyPayload }
): Promise<SettingsRecord> {
  const res = await fetch(`${API_BASE}/partners/settings/privacy`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to save privacy settings");
  return res.json();
}

export async function requestDataExport(token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/partners/settings/export`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to request data export");
}

export async function deleteAccount(token: string): Promise<void> {
  const res = await fetch(`${API_BASE}/partners/settings/account`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to delete account");
}
