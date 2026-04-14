import React from 'react';
import { Client } from '@/types/routines';
import { StatusBadge } from './StatusBadge';
import { SourceBadge } from './SourceBadge';
import { ProgressBar } from './ProgressBar';

interface ClientCardProps {
  client: Client;
  onClick: () => void;
  onViewDetails?: () => void;
  onMessage?: () => void;
  onSchedule?: () => void;
}

export function ClientCard({ client, onClick, onViewDetails, onMessage, onSchedule }: ClientCardProps) {
  const isUpcomingSoon = client.next_session && 
    new Date(client.next_session.date) <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDetails) {
      onViewDetails();
    } else {
      onClick(); // Fallback to card onClick
    }
  };

  const handleMessage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMessage) {
      onMessage();
    }
  };

  const handleSchedule = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSchedule) {
      onSchedule();
    }
  };

  return (
    <div
      onClick={onClick}
      className="relative bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 
        cursor-pointer transition-all duration-300 
        hover:translate-y-[-4px] hover:border-emerald-500/30 hover:shadow-[0_8px_32px_rgba(16,185,129,0.15)]"
    >
      {/* Header: Avatar + Name + Status + Source */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 
            flex items-center justify-center text-white font-semibold text-lg ring-2 ring-emerald-500/30">
            {client.initials}
          </div>
          
          {/* Name + Status */}
          <div>
            <h3 className="text-lg font-semibold text-zinc-100 mb-1">
              {client.name}
            </h3>
            <div className="flex items-center gap-2">
              <StatusBadge status={client.status} />
            </div>
          </div>
        </div>
        
        {/* Source Badge */}
        <div>
          <SourceBadge source={client.acquisition_source} />
        </div>
      </div>

      {/* Next Session (if exists) */}
      {client.next_session && (
        <div className="mb-4 pb-4 border-b border-white/10">
          <div className="text-xs text-zinc-400 mb-1">📅 Next Session</div>
          <div className={`text-sm font-medium ${isUpcomingSoon ? 'text-emerald-400' : 'text-zinc-300'}`}>
            {new Date(client.next_session.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            })}, {client.next_session.time}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">
            {client.next_session.type === 'online' ? '💻 ' : '📍 '}{client.next_session.location}
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="mb-4">
        <ProgressBar 
          current={client.completed_sessions}
          total={client.total_sessions}
          label={`${client.completed_sessions}/${client.total_sessions} sessions`}
          showPercentage={true}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button 
          onClick={handleViewDetails}
          className="flex-1 px-3 py-2 text-xs font-medium text-zinc-300 bg-white/5 border border-white/10 
            rounded-lg hover:bg-white/10 transition-colors"
        >
          View Details
        </button>
        <button 
          onClick={handleMessage}
          className="flex-1 px-3 py-2 text-xs font-medium text-zinc-300 bg-white/5 border border-white/10 
            rounded-lg hover:bg-white/10 transition-colors"
        >
          Message
        </button>
        <button 
          onClick={handleSchedule}
          className="flex-1 px-3 py-2 text-xs font-medium text-zinc-300 bg-white/5 border border-white/10 
            rounded-lg hover:bg-white/10 transition-colors"
        >
          Schedule
        </button>
      </div>
    </div>
  );
}
