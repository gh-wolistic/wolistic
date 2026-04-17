"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Search,
  Filter,
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { getProfessionalSessions, type ProfessionalSession } from "@/lib/api/sessions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SessionsBrowsePageProps {
  professionalUsername?: string;
  professionalName?: string;
}

export function SessionsBrowsePage({ 
  professionalUsername, 
  professionalName 
}: SessionsBrowsePageProps) {
  const router = useRouter();
  
  const [sessions, setSessions] = useState<ProfessionalSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ProfessionalSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  useEffect(() => {
    loadSessions();
  }, [professionalUsername]);

  useEffect(() => {
    applyFilters();
  }, [sessions, searchQuery, categoryFilter, dateFilter]);

  async function loadSessions() {
    setLoading(true);
    try {
      if (professionalUsername) {
        const data = await getProfessionalSessions(professionalUsername);
        setSessions(data);
      } else {
        // TODO: Implement getAllPublishedSessions endpoint in backend
        // For now, showing empty state
        setSessions([]);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load sessions");
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...sessions];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((s) => s.category === categoryFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter((s) => {
        const sessionDate = new Date(s.session_date);
        sessionDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((sessionDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case "today":
            return daysDiff === 0;
          case "this-week":
            return daysDiff >= 0 && daysDiff <= 7;
          case "this-month":
            return daysDiff >= 0 && daysDiff <= 30;
          default:
            return true;
        }
      });
    }

    setFilteredSessions(filtered);
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      month: "short", 
      day: "numeric",
      year: "numeric"
    });
  }

  function formatTime(timeStr: string): string {
    const [hours, minutes] = timeStr.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  function getCategoryColor(category: string): string {
    switch (category) {
      case "mind": return "from-violet-500 to-purple-600";
      case "body": return "from-emerald-500 to-green-600";
      case "nutrition": return "from-amber-500 to-orange-600";
      case "lifestyle": return "from-sky-500 to-blue-600";
      default: return "from-zinc-500 to-zinc-600";
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 size-[500px] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-20 left-20 size-[400px] rounded-full bg-violet-500/10 blur-[120px]" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            {professionalName ? `Sessions with ${professionalName}` : "Available Sessions"}
          </h1>
          <p className="text-zinc-400">
            {filteredSessions.length} session{filteredSessions.length !== 1 ? "s" : ""} available
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" />
              <Input
                placeholder="Search sessions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-emerald-400/50"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900/95 border-white/10 backdrop-blur-xl">
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="mind">Mind</SelectItem>
                <SelectItem value="body">Body</SelectItem>
                <SelectItem value="nutrition">Nutrition</SelectItem>
                <SelectItem value="lifestyle">Lifestyle</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900/95 border-white/10 backdrop-blur-xl">
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Sessions Grid */}
        {filteredSessions.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
            <CalendarDays className="size-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No sessions found</h3>
            <p className="text-zinc-400 mb-6">
              {searchQuery || categoryFilter !== "all" || dateFilter !== "all"
                ? "Try adjusting your filters"
                : "Check back soon for new sessions"}
            </p>
            {(searchQuery || categoryFilter !== "all" || dateFilter !== "all") && (
              <Button
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                  setDateFilter("all");
                }}
                variant="outline"
                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
              >
                Clear Filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredSessions.map((session) => {
              const spotsRemaining = session.capacity - session.enrolled_count;
              const availabilityColor =
                session.is_sold_out ? "text-rose-400" :
                spotsRemaining <= 2 ? "text-amber-400" :
                "text-emerald-400";

              return (
                <div
                  key={session.id}
                  onClick={() => router.push(`/sessions/${session.id}`)}
                  className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer"
                >
                  {/* Category Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={`bg-gradient-to-r ${getCategoryColor(session.category)} text-white border-0`}>
                      {session.category}
                    </Badge>
                    <Badge className="bg-white/10 text-zinc-300 border-white/20 text-xs">
                      {session.display_term}
                    </Badge>
                  </div>

                  {/* Title & Price */}
                  <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {session.title}
                  </h3>
                  <p className="text-2xl font-bold text-emerald-400 mb-4">₹{session.price}</p>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Calendar className="size-4" />
                      <span>{formatDate(session.session_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Clock className="size-4" />
                      <span>{formatTime(session.start_time)} • {session.duration_minutes} min</span>
                    </div>
                    {session.work_location && (
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <MapPin className="size-4" />
                        <span className="truncate">{session.work_location.name}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className={`size-4 ${availabilityColor}`} />
                      <span className={availabilityColor}>
                        {session.is_sold_out 
                          ? "Sold Out" 
                          : `${spotsRemaining} spot${spotsRemaining !== 1 ? "s" : ""} left`
                        }
                      </span>
                    </div>
                  </div>

                  {/* CTA */}
                  <Button
                    className={`w-full ${
                      session.is_sold_out
                        ? "bg-zinc-500/20 border border-zinc-400/30 text-zinc-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                    }`}
                    disabled={session.is_sold_out}
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/sessions/${session.id}`);
                    }}
                  >
                    {session.is_sold_out ? "Sold Out" : "View Details"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
