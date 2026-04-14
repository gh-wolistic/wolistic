'use client';

import React from 'react';
import { Client, Routine, UpcomingSession, FollowUp } from '@/types/routines';
import { StatusBadge } from './StatusBadge';
import { SourceBadge } from './SourceBadge';
import { ActiveRoutineSection } from './ActiveRoutineSection';
import { UpcomingSessionsSection } from './UpcomingSessionsSection';
import { FollowUpsSection } from './FollowUpsSection';
import { PerformanceMetricsSection } from './PerformanceMetricsSection';
import { ClientProfileSidebar } from './ClientProfileSidebar';

interface ClientDetailSheetProps {
  client: Client | null;
  isOpen: boolean;
  onClose: () => void;
  onAddFollowUp?: (clientId: number) => void;
  activeRoutine?: Routine | null;
  upcomingSessions?: UpcomingSession[];
  followUps?: FollowUp[];
}

export function ClientDetailSheet({ 
  client, 
  isOpen, 
  onClose, 
  onAddFollowUp,
  activeRoutine = null,
  upcomingSessions = [],
  followUps = []
}: ClientDetailSheetProps) {
  if (!client || !isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-end"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <div 
        className="relative w-full max-w-4xl h-full bg-[#0a0f1e] shadow-2xl overflow-hidden
          animate-[slideIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-[#0a0f1e]/95 backdrop-blur-lg border-b border-white/10 px-8 py-6">
          <button
            onClick={onClose}
            className="absolute top-6 right-8 text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            ✕
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 
              flex items-center justify-center text-white font-bold text-xl ring-4 ring-emerald-500/30">
              {client.initials}
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-zinc-100 mb-2">
                {client.name}
              </h2>
              <div className="flex items-center gap-3">
                <StatusBadge status={client.status} />
                <SourceBadge source={client.acquisition_source} />
              </div>
              <div className="text-sm text-zinc-400 mt-2">
                Enrolled: {new Date(client.enrolled_date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white/5 border border-white/10 text-zinc-300 
              text-sm font-medium rounded-lg hover:bg-white/10 transition-colors">
              Schedule Session
            </button>
            <button className="px-4 py-2 bg-white/5 border border-white/10 text-zinc-300 
              text-sm font-medium rounded-lg hover:bg-white/10 transition-colors">
              Send Message
            </button>
            <button className="px-4 py-2 bg-emerald-500 text-white 
              text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors">
              ⭐ Update Routine
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="h-[calc(100vh-180px)] overflow-y-auto px-8 py-6">
          <div className="grid grid-cols-3 gap-6">
            {/* Left Column (2/3 width) */}
            <div className="col-span-2 space-y-6">
              {/* Hero: Active Routine */}
              <ActiveRoutineSection 
                routine={activeRoutine}
                onCreateRoutine={() => console.log('Create routine')}
                onViewDetails={() => console.log('View details')}
                onEdit={() => console.log('Edit routine')}
                onArchive={() => console.log('Archive routine')}
              />

              {/* Upcoming Sessions */}
              <UpcomingSessionsSection 
                sessions={upcomingSessions}
                onViewAll={() => console.log('View all sessions')}
                onReschedule={(id) => console.log('Reschedule', id)}
                onCancel={(id) => console.log('Cancel', id)}
              />

              {/* Follow-ups */}
              <FollowUpsSection 
                followUps={followUps}
                onAddFollowUp={() => onAddFollowUp?.(client.id)}
                onMarkDone={(id) => console.log('Mark done', id)}
                onEdit={(id) => console.log('Edit', id)}
              />

              {/* Performance & Value */}
              <PerformanceMetricsSection client={client} />
            </div>

            {/* Right Column (1/3 width) */}
            <div className="col-span-1">
              <ClientProfileSidebar client={client} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
