"use client";

import { useState, useEffect, useCallback } from "react";
import {
  DndProvider,
  useDrag,
  useDrop,
} from "react-dnd";
import { MultiBackend } from "react-dnd-multi-backend";
import { HTML5toTouch } from "rdndmb-html5-to-touch";
import {
  Kanban,
  Plus,
  GripVertical,
  Clock,
  Calendar,
  MoreVertical,
  Sparkles,
  CalendarDays,
  HelpCircle,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/components/ui/utils";

import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import {
  getActivityBoard,
  createTodo,
  updateTodoStatus,
  deleteTodo,
  updateBookingStatus,
  updateInternalStatus,
} from "./activityApi";
import { ActivityTutorial } from "./ActivityTutorial";
import type {
  Activity,
  ActivityStatus,
  BookingActivity,
  CreateTodoInput,
  TodoActivity,
  TodoPriority,
  WolisticActivity,
} from "@/types/activity";

// ── Constants ─────────────────────────────────────────────────────────────────

const ITEM_TYPE = "ACTIVITY_CARD";

type FilterType = "all" | "todos" | "bookings" | "wolistic";

interface Column {
  id: ActivityStatus;
  title: string;
  badgeColor: string;
}

const COLUMNS: Column[] = [
  {
    id: "yet-to-start",
    title: "Yet to Start",
    badgeColor: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  },
  {
    id: "in-progress",
    title: "In Progress",
    badgeColor: "bg-sky-500/20 text-sky-400 border-sky-500/30",
  },
  {
    id: "accepted",
    title: "Accepted",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  {
    id: "completed",
    title: "Completed",
    badgeColor: "bg-zinc-500/20 text-zinc-500 border-zinc-500/30",
  },
  {
    id: "rejected",
    title: "Rejected",
    badgeColor: "bg-rose-500/20 text-rose-400 border-rose-500/30",
  },
];

// Drag rules: bookings can't go to in-progress; todos/wolistic can't go to accepted
function isDropAllowed(activityType: string, targetColumn: ActivityStatus): boolean {
  if (activityType === "booking" && targetColumn === "in-progress") return false;
  if (activityType !== "booking" && targetColumn === "accepted") return false;
  return true;
}

// ── GlassCard ─────────────────────────────────────────────────────────────────

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={`border-white/10 bg-white/5 backdrop-blur-sm ${className}`}>
      {children}
    </Card>
  );
}

// ── PriorityDot ───────────────────────────────────────────────────────────────

function PriorityDot({ priority }: { priority: TodoPriority }) {
  const colors: Record<TodoPriority, string> = {
    low: "bg-emerald-400",
    medium: "bg-amber-400",
    high: "bg-rose-400",
  };
  return <span className={`mt-0.5 size-2 shrink-0 rounded-full ${colors[priority]}`} />;
}

// ── ActivityCard ──────────────────────────────────────────────────────────────

interface ActivityCardProps {
  activity: Activity;
  onDrop: (id: string, newStatus: ActivityStatus) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, newStatus: ActivityStatus) => void;
  currentStatus: ActivityStatus;
}

function ActivityCard({ activity, onDrop: _onDrop, onDelete, onMove, currentStatus }: ActivityCardProps) {
  const [{ isDragging }, drag, dragPreview] = useDrag(() => ({
    type: ITEM_TYPE,
    item: { id: activity.id, status: activity.status, activityType: activity.type },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  const cardStyle =
    activity.type === "booking"
      ? "bg-gradient-to-br from-sky-500/10 to-sky-600/5 border-sky-400/20 hover:border-sky-400/40 hover:shadow-sky-500/20"
      : activity.type === "todo"
      ? "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-400/20 hover:border-emerald-400/40 hover:shadow-emerald-500/20"
      : "bg-gradient-to-br from-violet-500/10 to-violet-600/5 border-violet-400/20 hover:border-violet-400/40 hover:shadow-violet-500/20";

  // Columns available to move to (filtered by drag rules, excluding current)
  const moveTargets = COLUMNS.filter(
    (col) => col.id !== currentStatus && isDropAllowed(activity.type, col.id)
  );

  const MoveToMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-6 hover:bg-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="size-3.5 text-zinc-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="border-white/10 bg-[#0d1526]/95 backdrop-blur-xl"
      >
        {moveTargets.map((col) => (
          <DropdownMenuItem
            key={col.id}
            className="text-zinc-300 hover:bg-white/5"
            onClick={() => onMove(activity.id, col.id)}
          >
            Move to {col.title}
          </DropdownMenuItem>
        ))}
        {activity.type === "todo" && (
          <DropdownMenuItem
            className="text-rose-400 hover:bg-white/5"
            onClick={() => onDelete(activity.id)}
          >
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const renderBooking = (b: BookingActivity) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <Badge className="border border-sky-400/40 bg-sky-500/30 text-xs text-sky-300">
          Booking
        </Badge>
        <div className="flex items-center gap-1">
          <GripVertical className="size-4 text-sky-400/40 opacity-0 transition-opacity group-hover:opacity-100" />
          <MoveToMenu />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Avatar className="size-8 ring-1 ring-sky-400/30">
          <AvatarFallback className="bg-sky-500/30 text-xs text-sky-300">
            {b.clientInitials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">{b.clientName}</p>
          <p className="truncate text-xs text-sky-300/70">{b.serviceName}</p>
        </div>
      </div>
      {(b.scheduledTime || b.scheduledDate) && (
        <div className="flex items-center gap-2 text-xs text-sky-300/80">
          {b.scheduledTime && (
            <>
              <Clock className="size-3" />
              <span>{b.scheduledTime}</span>
              {b.scheduledDate && <span>•</span>}
            </>
          )}
          {b.scheduledDate && (
            <>
              <Calendar className="size-3" />
              <span>
                {new Date(b.scheduledDate).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );

  const renderTodo = (t: TodoActivity) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <Badge className="border border-emerald-400/40 bg-emerald-500/30 text-xs text-emerald-300">
          Todo
        </Badge>
        <div className="flex items-center gap-1">
          <GripVertical className="size-4 text-emerald-400/40 opacity-0 transition-opacity group-hover:opacity-100" />
          <MoveToMenu />
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-start gap-2">
          <PriorityDot priority={t.priority} />
          <p className="flex-1 text-sm font-semibold text-white">{t.title}</p>
        </div>
        {t.description && (
          <p className="line-clamp-2 text-xs text-emerald-300/70">{t.description}</p>
        )}
      </div>
      {t.dueDate && (
        <div className="flex items-center gap-1 text-xs text-emerald-300/80">
          <Calendar className="size-3" />
          <span>
            {new Date(t.dueDate).toLocaleDateString("en-IN", {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      )}
    </div>
  );

  const renderWolistic = (w: WolisticActivity) => (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <Badge className="flex items-center gap-1 border border-violet-400/40 bg-violet-500/30 text-xs text-violet-300">
          <Sparkles className="size-3" />
          Wolistic
        </Badge>
        <div className="flex items-center gap-1">
          <GripVertical className="size-4 text-violet-400/40 opacity-0 transition-opacity group-hover:opacity-100" />
          <MoveToMenu />
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-white">{w.title}</p>
        {w.description && (
          <p className="line-clamp-2 text-xs text-violet-300/70">{w.description}</p>
        )}
      </div>
      <Badge className="border border-violet-400/30 bg-violet-500/20 text-xs text-violet-300">
        {w.category}
      </Badge>
    </div>
  );

  return (
    <div
      ref={(node) => {
        drag(node);
        dragPreview(node);
      }}
      className={cn(
        "group cursor-grab rounded-xl border p-3.5 backdrop-blur-sm transition-all hover:shadow-lg active:cursor-grabbing",
        cardStyle,
        isDragging && "scale-105 opacity-50"
      )}
    >
      {activity.type === "booking" && renderBooking(activity as BookingActivity)}
      {activity.type === "todo" && renderTodo(activity as TodoActivity)}
      {activity.type === "wolistic" && renderWolistic(activity as WolisticActivity)}
    </div>
  );
}

// ── KanbanColumn ──────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  column: Column;
  activities: Activity[];
  onDrop: (id: string, activityType: string, newStatus: ActivityStatus) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, newStatus: ActivityStatus) => void;
}

function KanbanColumn({ column, activities, onDrop, onDelete, onMove }: KanbanColumnProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ITEM_TYPE,
    canDrop: (item: { id: string; status: ActivityStatus; activityType: string }) =>
      isDropAllowed(item.activityType, column.id),
    drop: (item: { id: string; status: ActivityStatus; activityType: string }) => {
      if (item.status !== column.id) {
        onDrop(item.id, item.activityType, column.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  }));

  const dropRef = (el: HTMLDivElement | null) => { drop(el); };

  return (
    <div className="flex min-w-70 flex-1 flex-col">
      <GlassCard className="mb-3 p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">{column.title}</h3>
          <Badge className={`${column.badgeColor} border text-xs`}>{activities.length}</Badge>
        </div>
      </GlassCard>

      <div
        ref={dropRef}
        className={cn(
          "flex-1 space-y-3 rounded-xl border-2 border-dashed p-3 transition-colors",
          isOver && canDrop
            ? "border-emerald-500/50 bg-emerald-500/5"
            : "border-transparent bg-transparent"
        )}
      >
        {activities.length > 0 ? (
          <div className="max-h-[calc(100vh-320px)] space-y-3 overflow-y-auto pr-1">
            {activities.map((a) => (
              <ActivityCard
                key={a.id}
                activity={a}
                onDrop={(id, newStatus) => onDrop(id, a.type, newStatus)}
                onDelete={onDelete}
                onMove={onMove}
                currentStatus={column.id}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CalendarDays className="mb-3 size-12 text-zinc-600" />
            <p className="text-sm text-zinc-500">No items here</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ActivityManagerPage ───────────────────────────────────────────────────────

export function ActivityManagerPage() {
  const { accessToken } = useAuthSession();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [showTutorial, setShowTutorial] = useState(false);

  // Add-todo sheet state
  const [isTodoOpen, setIsTodoOpen] = useState(false);
  const [todoTitle, setTodoTitle] = useState("");
  const [todoDesc, setTodoDesc] = useState("");
  const [todoPriority, setTodoPriority] = useState<TodoPriority>("medium");
  const [todoDue, setTodoDue] = useState("");
  const [isSavingTodo, setIsSavingTodo] = useState(false);

  const loadBoard = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await getActivityBoard(accessToken);
      setActivities(data);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Show tutorial once
  useEffect(() => {
    const seen = localStorage.getItem("activityManagerTutorialSeen");
    if (!seen) setShowTutorial(true);
  }, []);

  const handleCloseTutorial = () => {
    localStorage.setItem("activityManagerTutorialSeen", "true");
    setShowTutorial(false);
  };

  // ── Drop handler ────────────────────────────────────────────────────────────
  const handleDrop = useCallback(
    async (id: string, activityType: string, newStatus: ActivityStatus) => {
      if (!accessToken) return;

      // Optimistic update
      setActivities((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );

      try {
        if (activityType === "booking") {
          const booking = activities.find((a) => a.id === id) as BookingActivity | undefined;
          if (booking) await updateBookingStatus(accessToken, booking.bookingReference, newStatus);
        } else if (activityType === "todo") {
          const todo = activities.find((a) => a.id === id) as TodoActivity | undefined;
          if (todo) await updateTodoStatus(accessToken, todo.todoId, newStatus);
        } else if (activityType === "wolistic") {
          const w = activities.find((a) => a.id === id) as WolisticActivity | undefined;
          if (w) await updateInternalStatus(accessToken, w.templateId, newStatus);
        }
      } catch {
        // Revert on failure
        setActivities((prev) =>
          prev.map((a) =>
            a.id === id
              ? { ...a, status: activities.find((x) => x.id === id)?.status ?? a.status }
              : a
          )
        );
      }
    },
    [accessToken, activities]
  );

  // ── Delete handler ──────────────────────────────────────────────────────────
  const handleDelete = useCallback(
    async (id: string) => {
      if (!accessToken) return;
      const activity = activities.find((a) => a.id === id);
      if (!activity) return;

      // Optimistic
      setActivities((prev) => prev.filter((a) => a.id !== id));

      try {
        if (activity.type === "todo") {
          await deleteTodo(accessToken, (activity as TodoActivity).todoId);
        } else if (activity.type === "wolistic") {
          await updateInternalStatus(
            accessToken,
            (activity as WolisticActivity).templateId,
            "rejected"
          );
        }
      } catch {
        setActivities((prev) => [...prev, activity]);
      }
    },
    [accessToken, activities]
  );

  // ── Create todo ─────────────────────────────────────────────────────────────
  const handleCreateTodo = async () => {
    if (!accessToken || !todoTitle.trim()) return;
    setIsSavingTodo(true);
    try {
      const input: CreateTodoInput = {
        title: todoTitle.trim(),
        description: todoDesc.trim() || undefined,
        priority: todoPriority,
        dueDate: todoDue || undefined,
      };
      const newTodo = await createTodo(accessToken, input);
      setActivities((prev) => [newTodo, ...prev]);
      setIsTodoOpen(false);
      setTodoTitle("");
      setTodoDesc("");
      setTodoPriority("medium");
      setTodoDue("");
    } finally {
      setIsSavingTodo(false);
    }
  };

  // ── Filter ──────────────────────────────────────────────────────────────────
  const visible = activities.filter((a) => {
    if (filterType === "all") return true;
    if (filterType === "todos") return a.type === "todo";
    if (filterType === "bookings") return a.type === "booking";
    if (filterType === "wolistic") return a.type === "wolistic";
    return true;
  });

  const getColumnItems = (status: ActivityStatus) =>
    visible.filter((a) => a.status === status);

  // Summary stats
  const todoCount = activities.filter((a) => a.type === "todo").length;
  const bookingCount = activities.filter(
    (a) => a.type === "booking" && a.status !== "completed" && a.status !== "rejected"
  ).length;
  const wolisticRemaining = activities.filter(
    (a) => a.type === "wolistic" && a.status !== "completed"
  ).length;

  return (
    <DndProvider backend={MultiBackend} options={HTML5toTouch}>
      {showTutorial && (
        <ActivityTutorial onClose={handleCloseTutorial} onSkip={handleCloseTutorial} />
      )}

      <div className="space-y-6 p-6">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Kanban className="size-6 text-emerald-400" />
              <h1 className="text-2xl font-bold text-white">Activity Manager</h1>
            </div>
            <p className="text-zinc-400">Manage your bookings, tasks, and platform goals</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter tabs */}
            <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1">
              {(["all", "todos", "bookings", "wolistic"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f)}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    filterType === f
                      ? "bg-emerald-500/20 text-white"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>

            {/* Tutorial button */}
            <Button
              variant="ghost"
              onClick={() => setShowTutorial(true)}
              className="gap-2 border-white/10 text-zinc-400 hover:bg-white/5 hover:text-white"
            >
              <HelpCircle className="size-4" />
              Tutorial
            </Button>

            {/* Add Todo */}
            <Button
              className="gap-2 bg-emerald-500 text-white hover:bg-emerald-600"
              onClick={() => setIsTodoOpen(true)}
            >
              <Plus className="size-4" />
              Add Todo
            </Button>
          </div>
        </div>

        {/* Board */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <p className="text-zinc-500">Loading activities…</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                column={col}
                activities={getColumnItems(col.id)}
                onDrop={handleDrop}
                onDelete={handleDelete}
                onMove={(id, newStatus) => {
                  const activity = activities.find((a) => a.id === id);
                  if (activity) void handleDrop(id, activity.type, newStatus);
                }}
              />
            ))}
          </div>
        )}

        {/* Summary strip */}
        <GlassCard className="p-4">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400" />
              <span className="font-medium text-white">{todoCount} Todos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-sky-400" />
              <span className="font-medium text-white">{bookingCount} Active bookings</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-violet-400" />
              <span className="font-medium text-white">
                {wolisticRemaining} Wolistic goals remaining
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Add Todo Sheet */}
      <Sheet open={isTodoOpen} onOpenChange={setIsTodoOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col border-white/10 bg-[#0d1526] text-white sm:max-w-md"
        >
          <SheetHeader className="mb-4">
            <SheetTitle className="text-white">Add New Todo</SheetTitle>
          </SheetHeader>

          <div className="flex-1 space-y-4 overflow-y-auto">
            <div>
              <Label className="mb-1 block text-xs text-zinc-400">Title *</Label>
              <Input
                className="border-white/10 bg-white/5 text-white"
                placeholder="What needs to be done?"
                value={todoTitle}
                onChange={(e) => setTodoTitle(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs text-zinc-400">Description</Label>
              <Input
                className="border-white/10 bg-white/5 text-white"
                placeholder="Optional details…"
                value={todoDesc}
                onChange={(e) => setTodoDesc(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-1 block text-xs text-zinc-400">Priority</Label>
              <Select
                value={todoPriority}
                onValueChange={(v) => setTodoPriority(v as TodoPriority)}
              >
                <SelectTrigger className="border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1 block text-xs text-zinc-400">Due Date</Label>
              <Input
                type="date"
                className="border-white/10 bg-white/5 text-white"
                value={todoDue}
                onChange={(e) => setTodoDue(e.target.value)}
              />
            </div>
          </div>

          <SheetFooter className="flex gap-2 pt-4">
            <SheetClose asChild>
              <Button
                variant="outline"
                className="flex-1 border-white/10 text-zinc-300 hover:bg-white/5"
              >
                Cancel
              </Button>
            </SheetClose>
            <Button
              className="flex-1 bg-emerald-600 text-white hover:bg-emerald-500"
              onClick={handleCreateTodo}
              disabled={isSavingTodo || !todoTitle.trim()}
            >
              {isSavingTodo ? "Saving…" : "Add Todo"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </DndProvider>
  );
}
