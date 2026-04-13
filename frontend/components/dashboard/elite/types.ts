export type ElitePageView = "dashboard" | "coins" | "profile" | "settings" | "activities" | "clients" | "classes" | "subscription" | "messages";

export type TodaySession = {
  id: string;
  time: string;
  clientName: string;
  clientInitials: string;
  serviceName: string;
  status: "upcoming" | "in-progress" | "completed" | "cancelled";
};

export type FollowUp = {
  id: string;
  clientName: string;
  clientInitials: string;
  lastSession: string;
  reason: string;
};

export type ActiveClient = {
  id: string;
  name: string;
  initials: string;
  lastSession: string;
  nextSession: string;
  status: "active" | "inactive";
};

export type Message = {
  id: string;
  senderName: string;
  senderInitials: string;
  preview: string;
  timeAgo: string;
  unread: boolean;
};

export type MockCoinTransaction = {
  id: string;
  date: string;
  event: string;
  coins: number;
};

export type MockService = {
  id: string;
  name: string;
  mode: "online" | "in-person" | "hybrid";
  price: number;
  currency: string;
  duration: number;
};

export type MockAvailabilitySlot = {
  id: string;
  day: string;
  start_time: string;
  end_time: string;
};
