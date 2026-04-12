import type {
  TodaySession,
  FollowUp,
  ActiveClient,
  Message,
  MockCoinTransaction,
  MockService,
  MockAvailabilitySlot,
} from "./types";

export const mockTodaysSessions: TodaySession[] = [
  {
    id: "session_1",
    time: "09:00 AM",
    clientName: "Amit Kumar",
    clientInitials: "AK",
    serviceName: "Beginner Yoga Session",
    status: "upcoming",
  },
  {
    id: "session_2",
    time: "11:00 AM",
    clientName: "Sneha Patel",
    clientInitials: "SP",
    serviceName: "Meditation & Mindfulness",
    status: "upcoming",
  },
  {
    id: "session_3",
    time: "03:00 PM",
    clientName: "Rajesh Menon",
    clientInitials: "RM",
    serviceName: "Advanced Vinyasa Flow",
    status: "upcoming",
  },
];

export const mockFollowUps: FollowUp[] = [
  {
    id: "follow_1",
    clientName: "Pradeep Singh",
    clientInitials: "PS",
    lastSession: "3 days ago",
    reason: "Check progress on breathing exercises",
  },
  {
    id: "follow_2",
    clientName: "Kavita Reddy",
    clientInitials: "KR",
    lastSession: "1 week ago",
    reason: "Schedule next wellness consultation",
  },
];

export const mockActiveClients: ActiveClient[] = [
  {
    id: "client_1",
    name: "Amit Kumar",
    initials: "AK",
    lastSession: "Yesterday",
    nextSession: "Today, 9:00 AM",
    status: "active",
  },
  {
    id: "client_2",
    name: "Sneha Patel",
    initials: "SP",
    lastSession: "2 days ago",
    nextSession: "Today, 11:00 AM",
    status: "active",
  },
  {
    id: "client_3",
    name: "Rajesh Menon",
    initials: "RM",
    lastSession: "4 days ago",
    nextSession: "Today, 3:00 PM",
    status: "active",
  },
  {
    id: "client_4",
    name: "Pradeep Singh",
    initials: "PS",
    lastSession: "3 days ago",
    nextSession: "Tomorrow",
    status: "active",
  },
];

export const mockMessages: Message[] = [
  {
    id: "msg_1",
    senderName: "Amit Kumar",
    senderInitials: "AK",
    preview: "Thank you for today's session! The breathing techniques really helped.",
    timeAgo: "5m ago",
    unread: true,
  },
  {
    id: "msg_2",
    senderName: "Kavita Reddy",
    senderInitials: "KR",
    preview: "Can we reschedule tomorrow's session to next week?",
    timeAgo: "2h ago",
    unread: true,
  },
  {
    id: "msg_3",
    senderName: "Rajesh Menon",
    senderInitials: "RM",
    preview: "Looking forward to our session this afternoon!",
    timeAgo: "1d ago",
    unread: false,
  },
];

export const mockCoinTransactions: MockCoinTransaction[] = [
  { id: "tx_1", date: "Apr 10", event: "Completed session with Amit Kumar", coins: 50 },
  { id: "tx_2", date: "Apr 9", event: "Received 5-star review", coins: 30 },
  { id: "tx_3", date: "Apr 8", event: "Completed session with Sneha Patel", coins: 50 },
  { id: "tx_4", date: "Apr 7", event: "Profile milestone bonus", coins: 100 },
  { id: "tx_5", date: "Apr 6", event: "Completed session with Rajesh Menon", coins: 50 },
];

export const mockServices: MockService[] = [
  {
    id: "svc_1",
    name: "Beginner Yoga Session",
    mode: "online",
    price: 800,
    currency: "₹",
    duration: 60,
  },
  {
    id: "svc_2",
    name: "Advanced Vinyasa Flow",
    mode: "in-person",
    price: 1200,
    currency: "₹",
    duration: 90,
  },
  {
    id: "svc_3",
    name: "Meditation & Mindfulness",
    mode: "hybrid",
    price: 600,
    currency: "₹",
    duration: 45,
  },
  {
    id: "svc_4",
    name: "Personal Wellness Consultation",
    mode: "online",
    price: 1500,
    currency: "₹",
    duration: 60,
  },
];

export const mockAvailability: MockAvailabilitySlot[] = [
  { id: "slot_1", day: "Monday", start_time: "09:00", end_time: "12:00" },
  { id: "slot_2", day: "Monday", start_time: "15:00", end_time: "18:00" },
  { id: "slot_3", day: "Wednesday", start_time: "09:00", end_time: "12:00" },
  { id: "slot_4", day: "Wednesday", start_time: "15:00", end_time: "18:00" },
  { id: "slot_5", day: "Friday", start_time: "09:00", end_time: "12:00" },
  { id: "slot_6", day: "Friday", start_time: "15:00", end_time: "18:00" },
];
