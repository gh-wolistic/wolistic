'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Client, AcquisitionSource, ClientStatus, Routine, DashboardMetrics, FollowUp } from '@/types/routines';
import { MetricCard } from '@/components/dashboard/elite/routines/MetricCard';
import { AcquisitionBreakdown } from '@/components/dashboard/elite/routines/AcquisitionBreakdown';
import { TabsNavigation, TabType } from '@/components/dashboard/elite/routines/TabsNavigation';
import { FiltersBar } from '@/components/dashboard/elite/routines/FiltersBar';
import { ClientCard } from '@/components/dashboard/elite/routines/ClientCard';
import { EmptyState } from '@/components/dashboard/elite/routines/EmptyState';
import { ClientDetailSheet } from '@/components/dashboard/elite/routines/ClientDetailSheet';
import { RoutineEditorModal } from '@/components/dashboard/elite/routines/RoutineEditorModal';
import { TemplateRoutineCard } from '@/components/dashboard/elite/routines/TemplateRoutineCard';
import { BulkAssignModal } from '@/components/dashboard/elite/routines/BulkAssignModal';
import { AddFollowUpModal } from '@/components/dashboard/elite/routines/AddFollowUpModal';
import { InviteClientModal } from '@/components/dashboard/elite/routines/InviteClientModal';
import * as clientAPI from '@/lib/client-manager-api';

export default function ClientsManagerV2Page() {
  // Data state
  const [clients, setClients] = useState<Client[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({ total_clients: 0, active_clients: 0, followups_due: 0, leads_pending: 0 });
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State management
  const [activeTab, setActiveTab] = useState<TabType>('clients');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDetailSheetOpen, setIsDetailSheetOpen] = useState(false);
  const [isRoutineEditorOpen, setIsRoutineEditorOpen] = useState(false);
  
  // Bulk Assign state
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Routine | null>(null);
  
  // Follow-up state
  const [isAddFollowUpModalOpen, setIsAddFollowUpModalOpen] = useState(false);
  const [preselectedClientForFollowUp, setPreselectedClientForFollowUp] = useState<number | undefined>();
  
  // Invite client state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<AcquisitionSource | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ClientStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'sessions'>('recent');

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [metricsData, boardData, routinesData] = await Promise.all([
          clientAPI.fetchDashboardMetrics(),
          clientAPI.fetchClientsBoard(),
          clientAPI.fetchRoutines(),
        ]);
        
        setMetrics(metricsData);
        setClients(boardData.clients.map(c => ({
          ...c,
          initials: _initials(c.name),
          pending_followups: 0, // Will be computed from followUps
        })));
        setFollowUps(boardData.follow_ups);
        setRoutines(routinesData);
      } catch (err) {
        console.error('Failed to load data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Helper to generate initials
  const _initials = (name: string) => {
    const parts = name.trim().split(' ');
    return parts.slice(0, 2).map(p => p[0].toUpperCase()).join('') || '??';
  };

  // Filtered and sorted clients
  const filteredClients = useMemo(() => {
    let filtered = [...clients];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(client => client.acquisition_source === sourceFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(client => client.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'sessions') {
        return b.completed_sessions - a.completed_sessions;
      } else {
        // recent (by enrolled_date)
        return new Date(b.enrolled_date).getTime() - new Date(a.enrolled_date).getTime();
      }
    });

    return filtered;
  }, [clients, searchQuery, sourceFilter, statusFilter, sortBy]);

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setIsDetailSheetOpen(true);
  };

  const handleMessageClient = (client: Client) => {
    // TODO: Navigate to messaging page with this client pre-selected
    // For now, show a message
    alert(`Opening messages for ${client.name}...\n\nThis will navigate to the messaging page once integrated with the parent shell.`);
  };

  const handleScheduleClient = (client: Client) => {
    // TODO: Navigate to classes/schedule page or open schedule modal
    // For now, show a message
    alert(`Schedule session for ${client.name}...\n\nThis will open the scheduling interface once integrated.`);
  };

  const handleCreateRoutine = () => {
    setIsRoutineEditorOpen(true);
  };

  // Template handlers
  const templateRoutines = useMemo(() => {
    return routines.filter(routine => routine.isTemplate === true);
  }, [routines]);

  const handleAssignTemplate = (templateId: number) => {
    const template = templateRoutines.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      setIsBulkAssignModalOpen(true);
    }
  };

  const handleEditTemplate = (templateId: number) => {
    console.log('Edit template:', templateId);
    // TODO: Open routine editor in edit mode with template data
  };

  const handleBulkAssign = async (templateId: number, clientIds: number[]) => {
    try {
      await Promise.all(
        clientIds.map(clientId => 
          clientAPI.assignRoutineToClient(templateId, clientId)
        )
      );
      
      // Reload routines to show new assignments
      const routinesData = await clientAPI.fetchRoutines();
      setRoutines(routinesData);
      
      alert(`Successfully assigned template to ${clientIds.length} client(s)!`);
    } catch (err) {
      console.error('Failed to assign template:', err);
      alert('Failed to assign template. Please try again.');
    }
  };

  // Follow-up handlers
  const handleAddFollowUp = (clientId?: number) => {
    setPreselectedClientForFollowUp(clientId);
    setIsAddFollowUpModalOpen(true);
  };

  const handleSaveFollowUp = async (followUp: { client_id: number; note: string; due_date: string }) => {
    try {
      await clientAPI.createFollowUp(followUp);
      
      // Reload board data to show new follow-up
      const boardData = await clientAPI.fetchClientsBoard();
      setFollowUps(boardData.follow_ups);
      
      // Update metrics
      const metricsData = await clientAPI.fetchDashboardMetrics();
      setMetrics(metricsData);
      
      alert(`Follow-up added for client ${followUp.client_id}!`);
    } catch (err) {
      console.error('Failed to save follow-up:', err);
      alert('Failed to add follow-up. Please try again.');
    }
  };

  // Invite client handler (dummy for now per user request)
  const handleInviteClient = async (email: string, name?: string, personalMessage?: string) => {
    try {
      // Create client with expert_invite source (dummy email invitation)
      await clientAPI.createClient({
        name: name || email,
        email,
        acquisition_source: 'expert_invite',
        status: 'active',
      });
      
      // Reload data
      const [metricsData, boardData] = await Promise.all([
        clientAPI.fetchDashboardMetrics(),
        clientAPI.fetchClientsBoard(),
      ]);
      
      setMetrics(metricsData);
      setClients(boardData.clients.map(c => ({
        ...c,
        initials: _initials(c.name),
        pending_followups: 0,
      })));
      
      alert(`Client ${name || email} created! (Email invitation not yet implemented)`);
    } catch (err) {
      console.error('Failed to invite client:', err);
      alert('Failed to create client. Please try again.');
    }
  };

  // Calculate acquisition breakdown
  const acquisitionBreakdown = useMemo(() => {
    const channelConfig: Record<AcquisitionSource, { label: string; icon: string; color: string }> = {
      expert_invite: { label: 'Self Invited', icon: '✉️', color: 'bg-emerald-500' },
      wolistic_recommendation: { label: 'Wolistic', icon: '⭐', color: 'bg-violet-500' },
      corporate_event: { label: 'Corporate Event', icon: '🏢', color: 'bg-blue-500' },
      organic_search: { label: 'Organic Search', icon: '🔍', color: 'bg-amber-500' },
      wolistic_lead: { label: 'Social Media Ads', icon: '📱', color: 'bg-pink-500' }
    };

    const counts: Record<AcquisitionSource, number> = {
      expert_invite: 0,
      wolistic_recommendation: 0,
      corporate_event: 0,
      organic_search: 0,
      wolistic_lead: 0
    };

    clients.forEach(client => {
      counts[client.acquisition_source]++;
    });

    return Object.entries(counts)
      .map(([source, count]) => ({
        source: source as AcquisitionSource,
        count,
        label: channelConfig[source as AcquisitionSource].label,
        icon: channelConfig[source as AcquisitionSource].icon,
        color: channelConfig[source as AcquisitionSource].color
      }))
      .sort((a, b) => b.count - a.count);
  }, [clients]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="text-red-400">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-zinc-100">
      {/* Fixed Header */}
      <div className="sticky top-0 z-20 bg-[#0a0f1e]/95 backdrop-blur-lg border-b border-white/10 px-4 md:px-8 py-4 md:py-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h1 className="text-xl md:text-3xl font-bold text-zinc-100">Client Manager v2</h1>
          <button 
            onClick={() => setIsInviteModalOpen(true)}
            className="px-4 md:px-6 py-2 md:py-3 bg-emerald-500 text-white text-sm md:text-base font-medium rounded-lg 
              hover:bg-emerald-600 transition-colors whitespace-nowrap"
          >
            + Invite
            <span className="hidden sm:inline"> Client</span>
          </button>
        </div>

        {/* Metrics Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
          <MetricCard 
            label="Total Clients" 
            value={metrics.total_clients} 
            variant="emerald" 
          />
          <MetricCard 
            label="Active Clients" 
            value={metrics.active_clients} 
            variant="emerald" 
          />
          <MetricCard 
            label="Follow-ups Due" 
            value={metrics.followups_due} 
            variant={metrics.followups_due > 0 ? 'amber' : 'zinc'} 
          />
          <MetricCard 
            label="Leads Pending" 
            value={metrics.leads_pending} 
            variant="violet" 
          />
        </div>

        {/* Acquisition Channel Breakdown */}
        <AcquisitionBreakdown 
          channels={acquisitionBreakdown}
          totalClients={metrics.total_clients}
        />

        {/* Tabs */}
        <TabsNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-8 py-4 md:py-6">
        {/* Filters Bar */}
        {activeTab === 'clients' && (
          <>
            <FiltersBar 
              onSearchChange={setSearchQuery}
              onSourceFilter={setSourceFilter}
              onStatusFilter={setStatusFilter}
              onSortChange={setSortBy}
            />

            {/* Client Cards Grid */}
            {filteredClients.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {filteredClients.map(client => (
                  <ClientCard 
                    key={client.id} 
                    client={client} 
                    onClick={() => handleClientClick(client)}
                    onViewDetails={() => handleClientClick(client)}
                    onMessage={() => handleMessageClient(client)}
                    onSchedule={() => handleScheduleClient(client)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState 
                variant="no-clients" 
                onAction={() => setIsInviteModalOpen(true)}
              />
            )}
          </>
        )}

        {/* Follow-ups Tab */}
        {activeTab === 'followups' && (
          <div className="max-w-3xl mx-auto">
            <EmptyState 
              variant="no-followups" 
              onAction={() => handleAddFollowUp()}
            />
          </div>
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <div className="max-w-3xl mx-auto">
            <div className="text-center py-16">
              <div className="text-6xl mb-6 opacity-30">📝</div>
              <h3 className="text-xl font-semibold text-zinc-100 mb-3">
                Leads coming soon!
              </h3>
              <p className="text-sm text-zinc-400">
                Track potential clients and nurture them into active clients.
              </p>
            </div>
          </div>
        )}

        {/* Routines Tab */}
        {activeTab === 'routines' && (
          <div className="max-w-3xl mx-auto">
            <EmptyState 
              variant="no-routines" 
              onAction={handleCreateRoutine}
            />
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-zinc-100">Routine Templates</h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Reusable routines you can assign to multiple clients
                </p>
              </div>
              <button 
                onClick={() => {
                  // Open routine editor in template mode (no client selected)
                  setSelectedClient(null);
                  setIsRoutineEditorOpen(true);
                }}
                className="px-6 py-3 bg-violet-500 text-white font-medium rounded-lg 
                  hover:bg-violet-600 transition-colors"
              >
                + Create Template
              </button>
            </div>

            {templateRoutines.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templateRoutines.map(template => (
                  <TemplateRoutineCard 
                    key={template.id}
                    template={template}
                    onAssign={handleAssignTemplate}
                    onEdit={handleEditTemplate}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white/5 border border-white/10 rounded-xl">
                <div className="text-6xl mb-6 opacity-30">📋</div>
                <h3 className="text-xl font-semibold text-zinc-100 mb-3">
                  No templates yet
                </h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Create reusable routine templates to quickly onboard new clients
                </p>
                <button
                  onClick={() => {
                    setSelectedClient(null);
                    setIsRoutineEditorOpen(true);
                  }}
                  className="px-6 py-3 bg-violet-500 text-white font-medium rounded-lg 
                    hover:bg-violet-600 transition-colors"
                >
                  Create Your First Template
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Client Detail Sheet */}
      <ClientDetailSheet 
        client={selectedClient}
        isOpen={isDetailSheetOpen}
        onClose={() => {
          setIsDetailSheetOpen(false);
          setSelectedClient(null);
        }}
        onAddFollowUp={handleAddFollowUp}
      />

      {/* Routine Editor Modal */}
      <RoutineEditorModal 
        isOpen={isRoutineEditorOpen}
        onClose={() => setIsRoutineEditorOpen(false)}
        clientId={selectedClient?.id}
        clients={clients}
        onSave={(routine) => {
          console.log('Saving routine:', routine);
        }}
      />

      {/* Bulk Assign Modal */}
      <BulkAssignModal 
        isOpen={isBulkAssignModalOpen}
        onClose={() => {
          setIsBulkAssignModalOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        clients={clients}
        onAssign={handleBulkAssign}
      />

      {/* Add Follow-Up Modal */}
      <AddFollowUpModal 
        isOpen={isAddFollowUpModalOpen}
        onClose={() => {
          setIsAddFollowUpModalOpen(false);
          setPreselectedClientForFollowUp(undefined);
        }}
        clients={clients}
        preselectedClientId={preselectedClientForFollowUp}
        onSave={handleSaveFollowUp}
      />

      {/* Invite Client Modal */}
      <InviteClientModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvite={handleInviteClient}
      />
    </div>
  );
}
