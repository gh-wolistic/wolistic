'use client';

import React, { useState, useMemo } from 'react';
import { Client, AcquisitionSource, ClientStatus, Routine } from '@/types/routines';
import { 
  mockClients, 
  mockDashboardMetrics,
  mockRoutines 
} from '@/lib/mockClientsData';
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

export default function ClientsManagerV2Page() {
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

  // Filtered and sorted clients
  const filteredClients = useMemo(() => {
    let filtered = [...mockClients];

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
  }, [searchQuery, sourceFilter, statusFilter, sortBy]);

  const handleClientClick = (client: Client) => {
    setSelectedClient(client);
    setIsDetailSheetOpen(true);
  };

  const handleCreateRoutine = () => {
    setIsRoutineEditorOpen(true);
  };

  // Template handlers
  const templateRoutines = useMemo(() => {
    return mockRoutines.filter(routine => routine.isTemplate === true);
  }, []);

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

  const handleBulkAssign = (templateId: number, clientIds: number[]) => {
    console.log(`Assigning template ${templateId} to clients:`, clientIds);
    // TODO: API call to create routine copies for each client
    // Each copy should have: template_id, client_id, and duplicate items
    alert(`Successfully assigned template to ${clientIds.length} client(s)!`);
  };

  // Follow-up handlers
  const handleAddFollowUp = (clientId?: number) => {
    setPreselectedClientForFollowUp(clientId);
    setIsAddFollowUpModalOpen(true);
  };

  const handleSaveFollowUp = (followUp: { client_id: number; note: string; due_date: string }) => {
    console.log('Saving follow-up:', followUp);
    // TODO: API call to create follow-up
    alert(`Follow-up added for client ${followUp.client_id}!`);
  };

  // Invite client handler
  const handleInviteClient = (email: string, name?: string, personalMessage?: string) => {
    console.log('Inviting client:', { email, name, personalMessage });
    // TODO: API call to send invitation email
    alert(`Invitation sent to ${email}!${name ? ` (${name})` : ''}`);
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

    mockClients.forEach(client => {
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
  }, []);

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
            value={mockDashboardMetrics.total_clients} 
            variant="emerald" 
          />
          <MetricCard 
            label="Active Clients" 
            value={mockDashboardMetrics.active_clients} 
            variant="emerald" 
          />
          <MetricCard 
            label="Follow-ups Due" 
            value={mockDashboardMetrics.followups_due} 
            variant={mockDashboardMetrics.followups_due > 0 ? 'amber' : 'zinc'} 
          />
          <MetricCard 
            label="Leads Pending" 
            value={mockDashboardMetrics.leads_pending} 
            variant="violet" 
          />
        </div>

        {/* Acquisition Channel Breakdown */}
        <AcquisitionBreakdown 
          channels={acquisitionBreakdown}
          totalClients={mockDashboardMetrics.total_clients}
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
        clients={mockClients}
        onAssign={handleBulkAssign}
      />

      {/* Add Follow-Up Modal */}
      <AddFollowUpModal 
        isOpen={isAddFollowUpModalOpen}
        onClose={() => {
          setIsAddFollowUpModalOpen(false);
          setPreselectedClientForFollowUp(undefined);
        }}
        clients={mockClients}
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
