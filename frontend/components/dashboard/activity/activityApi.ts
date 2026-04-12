import type {
  Activity,
  ActivityStatus,
  BookingActivity,
  CreateTodoInput,
  TodoActivity,
  TodoPriority,
  WolisticActivity,
} from "@/types/activity";

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

// ── Board fetch ─────────────────────────────────────────────────────────────

type RawTodo = {
  id: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
};

type RawBooking = {
  booking_reference: string;
  client_name: string;
  client_initials: string;
  service_name: string;
  scheduled_time: string | null;
  scheduled_date: string | null;
  status: string;
  created_at: string;
};

type RawInternal = {
  template_id: number;
  title: string;
  description: string | null;
  category: string;
  priority: string;
  status: string;
};

type RawBoard = {
  todos: RawTodo[];
  bookings: RawBooking[];
  internal: RawInternal[];
};

export async function getActivityBoard(token: string): Promise<Activity[]> {
  const res = await fetch(`${API_BASE}/partners/me/activity-board`, {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];

  const data = (await res.json()) as RawBoard;

  const todos: TodoActivity[] = data.todos.map((t) => ({
    id: `todo_${t.id}`,
    todoId: t.id,
    type: "todo",
    status: t.status as ActivityStatus,
    title: t.title,
    priority: t.priority as TodoPriority,
    description: t.description ?? undefined,
    dueDate: t.due_date ?? undefined,
    createdAt: t.created_at,
  }));

  const bookings: BookingActivity[] = data.bookings.map((b) => ({
    id: `booking_${b.booking_reference}`,
    bookingReference: b.booking_reference,
    type: "booking",
    status: b.status as ActivityStatus,
    title: `Session with ${b.client_name}`,
    clientName: b.client_name,
    clientInitials: b.client_initials,
    serviceName: b.service_name,
    scheduledTime: b.scheduled_time,
    scheduledDate: b.scheduled_date,
    createdAt: b.created_at,
  }));

  const internal: WolisticActivity[] = data.internal.map((i) => ({
    id: `wolistic_${i.template_id}`,
    templateId: i.template_id,
    type: "wolistic",
    status: i.status as ActivityStatus,
    title: i.title,
    description: i.description ?? "",
    category: i.category,
    priority: i.priority,
    createdAt: new Date().toISOString(),
  }));

  return [...todos, ...bookings, ...internal];
}

// ── Todo CRUD ───────────────────────────────────────────────────────────────

export async function createTodo(token: string, data: CreateTodoInput): Promise<TodoActivity> {
  const res = await fetch(`${API_BASE}/partners/me/activities`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      due_date: data.dueDate || null,
    }),
  });
  if (!res.ok) throw new Error("Failed to create todo");
  const t = (await res.json()) as RawTodo;
  return {
    id: `todo_${t.id}`,
    todoId: t.id,
    type: "todo",
    status: t.status as ActivityStatus,
    title: t.title,
    priority: t.priority as TodoPriority,
    description: t.description ?? undefined,
    dueDate: t.due_date ?? undefined,
    createdAt: t.created_at,
  };
}

export async function updateTodoStatus(
  token: string,
  todoId: number,
  newStatus: string
): Promise<void> {
  await fetch(`${API_BASE}/partners/me/activities/${todoId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: newStatus }),
  });
}

export async function deleteTodo(token: string, todoId: number): Promise<void> {
  await fetch(`${API_BASE}/partners/me/activities/${todoId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ── Booking status ──────────────────────────────────────────────────────────

export async function updateBookingStatus(
  token: string,
  bookingReference: string,
  newStatus: string
): Promise<void> {
  const res = await fetch(
    `${API_BASE}/partners/me/bookings/${bookingReference}/status`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newStatus }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? "Failed to update booking");
  }
}

// ── Internal activity status ────────────────────────────────────────────────

export async function updateInternalStatus(
  token: string,
  templateId: number,
  newStatus: string
): Promise<void> {
  await fetch(`${API_BASE}/partners/me/internal-activities/${templateId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: newStatus }),
  });
}
