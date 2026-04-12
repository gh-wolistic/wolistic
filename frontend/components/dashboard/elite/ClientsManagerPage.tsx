"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Plus,
  MoreVertical,
  Mail,
  Phone,
  Edit,
  Trash2,
  Bell,
  UserCheck,
  ShieldBan,
  ShieldCheck,
  ClipboardList,
  CalendarDays,
  CheckCircle2,
  Video,
  MapPin,
  MessageCircle,
  AlertTriangle,
  Zap,
} from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { cn } from "@/components/ui/utils";
import { useAuthSession } from "@/components/auth/AuthSessionProvider";
import {
  getClientsBoard,
  createClient,
  updateClient,
  deleteClient,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  createLead,
  updateLead,
  deleteLead,
  convertLeadToClient,
  type ClientRecord,
  type ClientStatus,
  type FollowUpRecord,
  type LeadRecord,
  type LeadSource,
  type LeadStatus,
} from "./clientsApi";

type TabType = "clients" | "followups" | "leads";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

function getForwardRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 0) return "Passed";
  if (diffDays < 7) return `In ${diffDays} days`;
  if (diffDays < 30) return `In ${Math.floor(diffDays / 7)} weeks`;
  return `In ${Math.floor(diffDays / 30)} months`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={`border-white/10 bg-white/5 backdrop-blur-sm ${className}`}>
      {children}
    </Card>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  highlight,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  highlight?: boolean;
}) {
  return (
    <GlassCard className={cn("p-6", highlight && "ring-2 ring-amber-400/30")}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500 mb-1">{label}</p>
          <p className={cn("text-3xl font-bold", highlight ? "text-amber-400" : "text-white")}>
            {value}
          </p>
        </div>
        <div className={`rounded-lg ${color} p-3`}>
          <Icon className="size-6" />
        </div>
      </div>
    </GlassCard>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function ClientsManagerPage() {
  const { accessToken } = useAuthSession();

  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpRecord[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);

  const [activeTab, setActiveTab] = useState<TabType>("clients");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ClientStatus>("all");
  const [packageFilter, setPackageFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "name" | "session">("newest");

  // Sheets
  const [isAddEditSheetOpen, setIsAddEditSheetOpen] = useState(false);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [editingClient, setEditingClient] = useState<ClientRecord | null>(null);

  // Follow-up sheet
  const [isFollowUpSheetOpen, setIsFollowUpSheetOpen] = useState(false);
  const [followUpClientId, setFollowUpClientId] = useState<number | null>(null);
  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpDueDate, setFollowUpDueDate] = useState("");

  // Lead sheet
  const [isLeadSheetOpen, setIsLeadSheetOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<LeadRecord | null>(null);
  const [leadForm, setLeadForm] = useState({
    name: "", email: "", phone: "", source: "direct" as LeadSource, interest: "", status: "new" as LeadStatus,
  });

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "client" | "followup" | "lead"; id: number } | null>(null);

  // Saving state
  const [saving, setSaving] = useState(false);

  // Client form
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", notes: "", packageName: "none", status: "active" as ClientStatus,
  });

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadBoard = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const data = await getClientsBoard(accessToken);
      setClients(data.clients);
      setFollowUps(data.follow_ups);
      setLeads(data.leads);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status === "active").length;
  const followUpsDue = followUps.filter((f) => !f.resolved).length;
  const leadsPending = leads.filter((l) => l.status === "new" || l.status === "contacted").length;

  // ── Filtered clients ──────────────────────────────────────────────────────

  const filteredClients = clients
    .filter((client) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        client.name.toLowerCase().includes(q) ||
        client.email.toLowerCase().includes(q) ||
        (client.phone ?? "").includes(q);
      const matchesStatus = statusFilter === "all" || client.status === statusFilter;
      const matchesPackage =
        packageFilter === "all" ||
        (packageFilter === "initial" && client.package_name === "Initial Consultation") ||
        (packageFilter === "package" && client.package_name && client.package_name !== "Initial Consultation") ||
        (packageFilter === "none" && !client.package_name);
      return matchesSearch && matchesStatus && matchesPackage;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "session") {
        if (!a.last_session_date) return 1;
        if (!b.last_session_date) return -1;
        return new Date(b.last_session_date).getTime() - new Date(a.last_session_date).getTime();
      }
      return 0;
    });

  // ── Client handlers ───────────────────────────────────────────────────────

  const handleAddClient = () => {
    setEditingClient(null);
    setFormData({ name: "", email: "", phone: "", notes: "", packageName: "none", status: "active" });
    setIsAddEditSheetOpen(true);
  };

  const handleEditClient = (client: ClientRecord) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      email: client.email,
      phone: client.phone ?? "",
      notes: client.notes ?? "",
      packageName: client.package_name ?? "none",
      status: client.status,
    });
    setIsAddEditSheetOpen(true);
  };

  const handleSaveClient = async () => {
    if (!accessToken) return;
    setSaving(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        notes: formData.notes || undefined,
        status: formData.status,
        package_name: formData.packageName === "none" ? null : formData.packageName,
      };

      if (editingClient) {
        const updated = await updateClient(accessToken, editingClient.id, payload);
        setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await createClient(accessToken, payload);
        setClients((prev) => [created, ...prev]);
      }
      setIsAddEditSheetOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleViewClient = (client: ClientRecord) => {
    setSelectedClient(client);
    setIsDetailSheetOpen(true);
  };

  const handleToggleBlock = async (client: ClientRecord) => {
    if (!accessToken) return;
    const newStatus: ClientStatus = client.status === "blocked" ? "active" : "blocked";
    const updated = await updateClient(accessToken, client.id, { status: newStatus });
    setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const handleDelete = (type: "client" | "followup" | "lead", id: number) => {
    setItemToDelete({ type, id });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete || !accessToken) return;
    try {
      if (itemToDelete.type === "client") {
        await deleteClient(accessToken, itemToDelete.id);
        setClients((prev) => prev.filter((c) => c.id !== itemToDelete.id));
      } else if (itemToDelete.type === "followup") {
        await deleteFollowUp(accessToken, itemToDelete.id);
        setFollowUps((prev) => prev.filter((f) => f.id !== itemToDelete.id));
      } else if (itemToDelete.type === "lead") {
        await deleteLead(accessToken, itemToDelete.id);
        setLeads((prev) => prev.filter((l) => l.id !== itemToDelete.id));
      }
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  // ── Follow-up handlers ────────────────────────────────────────────────────

  const handleOpenFollowUp = (clientId: number) => {
    setFollowUpClientId(clientId);
    setFollowUpNote("");
    setFollowUpDueDate("");
    setIsFollowUpSheetOpen(true);
  };

  const handleSaveFollowUp = async () => {
    if (!accessToken || !followUpClientId || !followUpNote || !followUpDueDate) return;
    setSaving(true);
    try {
      const created = await createFollowUp(accessToken, {
        client_id: followUpClientId,
        note: followUpNote,
        due_date: new Date(followUpDueDate).toISOString(),
      });
      setFollowUps((prev) => [...prev, created]);
      setIsFollowUpSheetOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleResolveFollowUp = async (id: number) => {
    if (!accessToken) return;
    const updated = await updateFollowUp(accessToken, id, { resolved: true });
    setFollowUps((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  };

  // ── Lead handlers ─────────────────────────────────────────────────────────

  const handleAddLead = () => {
    setEditingLead(null);
    setLeadForm({ name: "", email: "", phone: "", source: "direct", interest: "", status: "new" });
    setIsLeadSheetOpen(true);
  };

  const handleEditLead = (lead: LeadRecord) => {
    setEditingLead(lead);
    setLeadForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone ?? "",
      source: lead.source,
      interest: lead.interest ?? "",
      status: lead.status,
    });
    setIsLeadSheetOpen(true);
  };

  const handleSaveLead = async () => {
    if (!accessToken) return;
    setSaving(true);
    try {
      const payload = {
        name: leadForm.name,
        email: leadForm.email,
        phone: leadForm.phone || undefined,
        source: leadForm.source,
        interest: leadForm.interest || undefined,
        status: leadForm.status,
      };
      if (editingLead) {
        const updated = await updateLead(accessToken, editingLead.id, payload);
        setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      } else {
        const created = await createLead(accessToken, payload);
        setLeads((prev) => [created, ...prev]);
      }
      setIsLeadSheetOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkContacted = async (lead: LeadRecord) => {
    if (!accessToken) return;
    const updated = await updateLead(accessToken, lead.id, { status: "contacted" });
    setLeads((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
  };

  const handleConvertLead = async (lead: LeadRecord) => {
    if (!accessToken) return;
    const newClient = await convertLeadToClient(accessToken, lead.id);
    setClients((prev) => [newClient, ...prev]);
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status: "converted" as LeadStatus } : l)));
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="size-6 text-emerald-400" />
            <h1 className="text-2xl font-bold text-white">Clients</h1>
          </div>
          <p className="text-zinc-400">Manage your client relationships, follow-ups, and leads</p>
        </div>
        <Button
          onClick={handleAddClient}
          className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
        >
          <Plus className="size-4" />
          Add Client
        </Button>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Total Clients" value={totalClients} icon={Users} color="bg-emerald-500/20 text-emerald-400" />
        <MetricCard label="Active Clients" value={activeClients} icon={UserCheck} color="bg-emerald-500/20 text-emerald-400" />
        <MetricCard label="Follow-ups Due" value={followUpsDue} icon={Bell} color="bg-amber-500/20 text-amber-400" highlight={followUpsDue > 0} />
        <MetricCard label="Leads Pending" value={leadsPending} icon={AlertTriangle} color="bg-sky-500/20 text-sky-400" />
      </div>

      {/* Tab Bar */}
      <div className="flex items-center gap-1 border-b border-white/10">
        {([
          { id: "clients" as TabType, label: "All Clients" },
          { id: "followups" as TabType, label: "Follow-ups" },
          { id: "leads" as TabType, label: "Leads" },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative px-4 py-3 text-sm font-medium transition-colors",
              activeTab === tab.id ? "text-white" : "text-zinc-400 hover:text-white"
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400" />
            )}
          </button>
        ))}
      </div>

      {/* ─── Tab: All Clients ─────────────────────────────────────────────── */}
      {activeTab === "clients" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <Input
                type="text"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="w-35 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
              <Select value={packageFilter} onValueChange={setPackageFilter}>
                <SelectTrigger className="w-35 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Package" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                  <SelectItem value="all">All Packages</SelectItem>
                  <SelectItem value="initial">Initial Consultation</SelectItem>
                  <SelectItem value="package">Package</SelectItem>
                  <SelectItem value="none">No Sessions</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                <SelectTrigger className="w-35 bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="name">Name A–Z</SelectItem>
                  <SelectItem value="session">Last Session</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Client List */}
          <div className="space-y-3">
            {filteredClients.map((client) => (
              <GlassCard key={client.id} className="p-4 transition-all hover:bg-white/8">
                <div className="flex items-center gap-4">
                  <Avatar className="size-12 ring-2 ring-emerald-500/30">
                    <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                      {toInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white">{client.name}</h3>
                      {client.status === "active" && (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">Active</Badge>
                      )}
                      {client.status === "blocked" && (
                        <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 border text-xs">Blocked</Badge>
                      )}
                      {client.status === "inactive" && (
                        <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30 border text-xs">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm flex-wrap">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Mail className="size-3" />
                        {client.email}
                      </span>
                      {client.phone && (
                        <span className="text-zinc-500 flex items-center gap-1">
                          <Phone className="size-3" />
                          {client.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hidden lg:flex items-center gap-4 text-sm">
                    {client.package_name ? (
                      client.package_name === "Initial Consultation" ? (
                        <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 border">
                          Initial Consultation
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border">
                          {client.package_name}
                        </Badge>
                      )
                    ) : (
                      <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30 border">
                        No sessions yet
                      </Badge>
                    )}
                    <div className="text-zinc-400 min-w-25">
                      {client.last_session_date ? getRelativeTime(client.last_session_date) : "—"}
                    </div>
                    <div className="text-zinc-400 min-w-25">
                      {client.next_session_date ? getForwardRelativeTime(client.next_session_date) : "—"}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 hover:bg-white/5">
                        <MoreVertical className="size-4 text-zinc-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                      <DropdownMenuItem onClick={() => handleEditClient(client)} className="gap-2 text-zinc-300 hover:bg-white/5">
                        <Edit className="size-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewClient(client)} className="gap-2 text-zinc-300 hover:bg-white/5">
                        <ClipboardList className="size-4" /> View History
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-zinc-300 hover:bg-white/5">
                        <CalendarDays className="size-4" /> Schedule Session
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenFollowUp(client.id)} className="gap-2 text-zinc-300 hover:bg-white/5">
                        <Bell className="size-4" /> Add Follow-up
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem
                        onClick={() => handleToggleBlock(client)}
                        className={cn("gap-2 hover:bg-white/5", client.status === "blocked" ? "text-emerald-400" : "text-rose-400")}
                      >
                        {client.status === "blocked" ? (
                          <><ShieldCheck className="size-4" /> Unblock</>
                        ) : (
                          <><ShieldBan className="size-4" /> Block</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete("client", client.id)} className="gap-2 text-rose-400 hover:bg-white/5">
                        <Trash2 className="size-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </GlassCard>
            ))}

            {filteredClients.length === 0 && (
              <GlassCard className="p-12 text-center">
                <Users className="size-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No clients found</h3>
                <p className="text-zinc-400">
                  {searchQuery || statusFilter !== "all" || packageFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Add your first client to start managing relationships"}
                </p>
              </GlassCard>
            )}
          </div>
        </div>
      )}

      {/* ─── Tab: Follow-ups ──────────────────────────────────────────────── */}
      {activeTab === "followups" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="gap-2 border-white/10 text-emerald-400 hover:bg-white/5"
              onClick={() => {
                if (clients.length > 0) {
                  handleOpenFollowUp(clients[0].id);
                }
              }}
            >
              <Plus className="size-4" />
              Add Follow-up
            </Button>
          </div>

          <div className="space-y-3">
            {followUps.map((followUp) => {
              const dueDate = new Date(followUp.due_date);
              const now = new Date();
              const isOverdue = dueDate < now && !followUp.resolved;
              const isToday = dueDate.toDateString() === now.toDateString() && !followUp.resolved;

              return (
                <GlassCard key={followUp.id} className="p-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="size-12 ring-2 ring-cyan-500/30">
                      <AvatarFallback className="bg-cyan-500/20 text-cyan-400">
                        {followUp.client_initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white">{followUp.client_name}</h3>
                        {followUp.last_session_date && (
                          <span className="text-sm text-zinc-500">
                            Last session: {getRelativeTime(followUp.last_session_date)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-300">{followUp.note}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {followUp.resolved ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border">Resolved</Badge>
                        ) : isOverdue ? (
                          <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 border">Overdue</Badge>
                        ) : isToday ? (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 border animate-pulse">Today</Badge>
                        ) : (
                          <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 border">Upcoming</Badge>
                        )}
                        <span className="text-sm text-zinc-400">
                          Due: {dueDate.toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!followUp.resolved && (
                        <Button
                          size="sm"
                          onClick={() => handleResolveFollowUp(followUp.id)}
                          className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
                        >
                          <CheckCircle2 className="size-4" />
                          Mark Resolved
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 hover:bg-white/5">
                            <MoreVertical className="size-4 text-zinc-400" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                          <DropdownMenuItem
                            onClick={() => handleDelete("followup", followUp.id)}
                            className="gap-2 text-rose-400 hover:bg-white/5"
                          >
                            <Trash2 className="size-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </GlassCard>
              );
            })}

            {followUps.length === 0 && (
              <GlassCard className="p-12 text-center">
                <Bell className="size-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">All caught up</h3>
                <p className="text-zinc-400">No follow-ups pending</p>
              </GlassCard>
            )}
          </div>
        </div>
      )}

      {/* ─── Tab: Leads ───────────────────────────────────────────────────── */}
      {activeTab === "leads" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={handleAddLead}
              className="bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
            >
              <Plus className="size-4" />
              Add Lead
            </Button>
          </div>

          <div className="space-y-3">
            {leads.map((lead) => (
              <GlassCard key={lead.id} className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="size-12 ring-2 ring-sky-500/30">
                    <AvatarFallback className="bg-sky-500/20 text-sky-400">
                      {toInitials(lead.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white">{lead.name}</h3>
                      {lead.status === "new" && <Badge className="bg-sky-500/20 text-sky-400 border-sky-500/30 border">New</Badge>}
                      {lead.status === "contacted" && <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 border">Contacted</Badge>}
                      {lead.status === "converted" && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border">Converted</Badge>}
                      {lead.status === "dropped" && <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30 border">Dropped</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-sm flex-wrap">
                      <span className="text-zinc-400 flex items-center gap-1">
                        <Mail className="size-3" />{lead.email}
                      </span>
                      {lead.phone && (
                        <span className="text-zinc-500 flex items-center gap-1">
                          <Phone className="size-3" />{lead.phone}
                        </span>
                      )}
                    </div>
                    {lead.interest && <p className="text-sm text-zinc-300">{lead.interest}</p>}
                    <div className="flex items-center gap-2 flex-wrap">
                      {lead.source === "platform" && (
                        <Badge className="bg-violet-500/20 text-violet-400 border-violet-500/30 border text-xs">Wolistic Platform</Badge>
                      )}
                      {lead.source === "referral" && (
                        <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 border text-xs">Referral</Badge>
                      )}
                      {lead.source === "direct" && (
                        <Badge className="bg-zinc-500/20 text-zinc-400 border-zinc-500/30 border text-xs">Direct</Badge>
                      )}
                      <span className="text-sm text-zinc-500">
                        Enquiry: {getRelativeTime(lead.enquiry_date)}
                      </span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8 hover:bg-white/5">
                        <MoreVertical className="size-4 text-zinc-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                      <DropdownMenuItem onClick={() => handleEditLead(lead)} className="gap-2 text-zinc-300 hover:bg-white/5">
                        <Edit className="size-4" /> Edit
                      </DropdownMenuItem>
                      {lead.status !== "converted" && (
                        <DropdownMenuItem onClick={() => handleConvertLead(lead)} className="gap-2 text-emerald-400 hover:bg-white/5">
                          <UserCheck className="size-4" /> Convert to Client
                        </DropdownMenuItem>
                      )}
                      {lead.status === "new" && (
                        <DropdownMenuItem onClick={() => handleMarkContacted(lead)} className="gap-2 text-zinc-300 hover:bg-white/5">
                          <CheckCircle2 className="size-4" /> Mark Contacted
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem onClick={() => handleDelete("lead", lead.id)} className="gap-2 text-rose-400 hover:bg-white/5">
                        <Trash2 className="size-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </GlassCard>
            ))}

            {leads.length === 0 && (
              <GlassCard className="p-12 text-center">
                <Zap className="size-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No leads yet</h3>
                <p className="text-zinc-400">Track prospects before they become full clients</p>
              </GlassCard>
            )}
          </div>
        </div>
      )}

      {/* ─── Add/Edit Client Sheet ────────────────────────────────────────── */}
      <Sheet open={isAddEditSheetOpen} onOpenChange={setIsAddEditSheetOpen}>
        <SheetContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl text-white overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">
              {editingClient ? "Edit Client" : "Add New Client"}
            </SheetTitle>
            <SheetDescription className="text-zinc-400">
              {editingClient ? "Update client information" : "Enter client details to create a new profile"}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 py-6">
            <div>
              <Label htmlFor="client-name" className="text-zinc-300">Full Name *</Label>
              <Input id="client-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1.5" placeholder="Enter full name" />
            </div>
            <div>
              <Label htmlFor="client-email" className="text-zinc-300">Email *</Label>
              <Input id="client-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1.5" placeholder="email@example.com" />
            </div>
            <div>
              <Label htmlFor="client-phone" className="text-zinc-300">Phone</Label>
              <Input id="client-phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1.5" placeholder="+91 98765 43210" />
            </div>
            <div>
              <Label htmlFor="client-package" className="text-zinc-300">Package</Label>
              <Select value={formData.packageName} onValueChange={(v) => setFormData({ ...formData, packageName: v })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1.5">
                  <SelectValue placeholder="Select package" />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="Initial Consultation">Initial Consultation</SelectItem>
                  <SelectItem value="Wellness Package - 12 Sessions">Wellness Package - 12 Sessions</SelectItem>
                  <SelectItem value="Premium Yoga - 24 Sessions">Premium Yoga - 24 Sessions</SelectItem>
                  <SelectItem value="Mindfulness Package - 8 Sessions">Mindfulness Package - 8 Sessions</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="client-status" className="text-zinc-300">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as ClientStatus })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="client-notes" className="text-zinc-300">Notes</Label>
              <Textarea id="client-notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1.5 min-h-25" placeholder="Additional notes about the client..." />
            </div>
          </div>

          <SheetFooter>
            <Button variant="ghost" onClick={() => setIsAddEditSheetOpen(false)} className="border-white/10 text-zinc-400 hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleSaveClient} disabled={!formData.name || !formData.email || saving} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              {saving ? "Saving..." : editingClient ? "Save Changes" : "Add Client"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ─── Client Detail Sheet ──────────────────────────────────────────── */}
      <Sheet open={isDetailSheetOpen} onOpenChange={setIsDetailSheetOpen}>
        <SheetContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl text-white overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle className="text-white">Client Details</SheetTitle>
          </SheetHeader>
          {selectedClient && (
            <div className="space-y-6 py-6">
              <div className="flex items-center gap-4">
                <Avatar className="size-16 ring-2 ring-emerald-500/30">
                  <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-lg">
                    {toInitials(selectedClient.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold text-white">{selectedClient.name}</h3>
                  <p className="text-zinc-400">{selectedClient.email}</p>
                  {selectedClient.phone && <p className="text-zinc-500 text-sm">{selectedClient.phone}</p>}
                </div>
              </div>
              <div>
                <Label className="text-zinc-400 text-sm">Package</Label>
                <p className="text-white mt-1">{selectedClient.package_name ?? "No package assigned"}</p>
              </div>
              <div>
                <Label className="text-zinc-400 text-sm">Last Session</Label>
                <p className="text-white mt-1">
                  {selectedClient.last_session_date ? getRelativeTime(selectedClient.last_session_date) : "—"}
                </p>
              </div>
              <div>
                <Label className="text-zinc-400 text-sm">Next Session</Label>
                <p className="text-white mt-1">
                  {selectedClient.next_session_date ? getForwardRelativeTime(selectedClient.next_session_date) : "—"}
                </p>
              </div>
              {selectedClient.notes && (
                <div>
                  <Label className="text-zinc-400 text-sm">Notes</Label>
                  <p className="text-white mt-1">{selectedClient.notes}</p>
                </div>
              )}
              <div>
                <Label className="text-zinc-400 text-sm">Follow-ups</Label>
                <div className="mt-2 space-y-2">
                  {followUps.filter((f) => f.client_id === selectedClient.id).length === 0 && (
                    <p className="text-zinc-500 text-sm">No follow-ups for this client</p>
                  )}
                  {followUps
                    .filter((f) => f.client_id === selectedClient.id)
                    .map((f) => (
                      <div key={f.id} className="rounded-lg border border-white/8 bg-white/5 p-3 text-sm">
                        <p className="text-white">{f.note}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-zinc-500 text-xs">
                            Due: {new Date(f.due_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                          </span>
                          {f.resolved ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 border text-xs">Resolved</Badge>
                          ) : (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 border text-xs">Pending</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
          <SheetFooter>
            <Button variant="ghost" onClick={() => setIsDetailSheetOpen(false)} className="border-white/10 text-zinc-400 hover:bg-white/5">
              Close
            </Button>
            {selectedClient && (
              <Button onClick={() => { setIsDetailSheetOpen(false); handleEditClient(selectedClient); }} className="bg-emerald-500 hover:bg-emerald-600 text-white">
                Edit Client
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ─── Add Follow-up Sheet ──────────────────────────────────────────── */}
      <Sheet open={isFollowUpSheetOpen} onOpenChange={setIsFollowUpSheetOpen}>
        <SheetContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl text-white overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">Add Follow-up</SheetTitle>
            <SheetDescription className="text-zinc-400">
              {followUpClientId && clients.find((c) => c.id === followUpClientId)
                ? `For: ${clients.find((c) => c.id === followUpClientId)!.name}`
                : "Set a reminder to follow up with this client"}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            {clients.length > 0 && !followUpClientId && (
              <div>
                <Label className="text-zinc-300">Client</Label>
                <Select value={String(followUpClientId ?? "")} onValueChange={(v) => setFollowUpClientId(Number(v))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1.5">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                    {clients.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label htmlFor="followup-note" className="text-zinc-300">Note *</Label>
              <Textarea id="followup-note" value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} className="bg-white/5 border-white/10 text-white mt-1.5 min-h-25" placeholder="What do you need to follow up on?" />
            </div>
            <div>
              <Label htmlFor="followup-due" className="text-zinc-300">Due Date *</Label>
              <Input id="followup-due" type="date" value={followUpDueDate} onChange={(e) => setFollowUpDueDate(e.target.value)} className="bg-white/5 border-white/10 text-white mt-1.5" />
            </div>
          </div>
          <SheetFooter>
            <Button variant="ghost" onClick={() => setIsFollowUpSheetOpen(false)} className="border-white/10 text-zinc-400 hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleSaveFollowUp} disabled={!followUpNote || !followUpDueDate || saving} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              {saving ? "Saving..." : "Add Follow-up"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ─── Add/Edit Lead Sheet ──────────────────────────────────────────── */}
      <Sheet open={isLeadSheetOpen} onOpenChange={setIsLeadSheetOpen}>
        <SheetContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl text-white overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-white">{editingLead ? "Edit Lead" : "Add New Lead"}</SheetTitle>
            <SheetDescription className="text-zinc-400">
              {editingLead ? "Update lead information" : "Track a new prospect or enquiry"}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div>
              <Label htmlFor="lead-name" className="text-zinc-300">Full Name *</Label>
              <Input id="lead-name" value={leadForm.name} onChange={(e) => setLeadForm({ ...leadForm, name: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1.5" placeholder="Enter full name" />
            </div>
            <div>
              <Label htmlFor="lead-email" className="text-zinc-300">Email *</Label>
              <Input id="lead-email" type="email" value={leadForm.email} onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1.5" placeholder="email@example.com" />
            </div>
            <div>
              <Label htmlFor="lead-phone" className="text-zinc-300">Phone</Label>
              <Input id="lead-phone" value={leadForm.phone} onChange={(e) => setLeadForm({ ...leadForm, phone: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1.5" placeholder="+91 98765 43210" />
            </div>
            <div>
              <Label className="text-zinc-300">Source</Label>
              <Select value={leadForm.source} onValueChange={(v) => setLeadForm({ ...leadForm, source: v as LeadSource })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                  <SelectItem value="platform">Wolistic Platform</SelectItem>
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="direct">Direct</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-300">Status</Label>
              <Select value={leadForm.status} onValueChange={(v) => setLeadForm({ ...leadForm, status: v as LeadStatus })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="dropped">Dropped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="lead-interest" className="text-zinc-300">Interest / Notes</Label>
              <Textarea id="lead-interest" value={leadForm.interest} onChange={(e) => setLeadForm({ ...leadForm, interest: e.target.value })} className="bg-white/5 border-white/10 text-white mt-1.5 min-h-20" placeholder="What are they interested in?" />
            </div>
          </div>
          <SheetFooter>
            <Button variant="ghost" onClick={() => setIsLeadSheetOpen(false)} className="border-white/10 text-zinc-400 hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleSaveLead} disabled={!leadForm.name || !leadForm.email || saving} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              {saving ? "Saving..." : editingLead ? "Save Changes" : "Add Lead"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ─── Delete Confirmation ──────────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#0d1526]/95 border-white/10 backdrop-blur-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete this {itemToDelete?.type}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-rose-500 hover:bg-rose-600 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
