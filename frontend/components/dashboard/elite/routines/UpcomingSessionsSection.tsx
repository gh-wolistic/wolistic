import React from 'react';
import { UpcomingSession } from '@/types/routines';

interface UpcomingSessionsSectionProps {
  sessions: UpcomingSession[];
  onViewAll?: () => void;
  onReschedule?: (sessionId: number) => void;
  onCancel?: (sessionId: number) => void;
}

export function UpcomingSessionsSection({ 
  sessions, 
  onViewAll,
  onReschedule,
  onCancel
}: UpcomingSessionsSectionProps) {
  // Empty state
  if (sessions.length === 0) {
    return (
      <div className="mb-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-100">📅 Upcoming Sessions</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-zinc-400 mb-4">No sessions scheduled.</p>
          <button className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
            Schedule One →
          </button>
        </div>
      </div>
    );
  }

  // Show first 3 sessions
  const displaySessions = sessions.slice(0, 3);
  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  return (
    <div className="mb-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-zinc-100">
          📅 Upcoming Sessions ({sessions.length})
        </h3>
        {onViewAll && sessions.length > 3 && (
          <button 
            onClick={onViewAll}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            View All →
          </button>
        )}
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {displaySessions.map((session) => {
          const sessionDate = new Date(session.date);
          const isUpcomingSoon = sessionDate <= twoDaysFromNow;

          return (
            <div 
              key={session.id}
              className="bg-black/20 rounded-xl p-4 border border-white/5"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className={`text-sm font-medium mb-1 ${isUpcomingSoon ? 'text-emerald-400' : 'text-zinc-300'}`}>
                    {sessionDate.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    })}, {session.time}
                  </div>
                  <div className="text-xs text-zinc-500">
                    {session.type === 'online' ? '💻 ' : '📍 '}{session.location}
                  </div>
                  {session.zoom_link && (
                    <a 
                      href={session.zoom_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-emerald-400 hover:text-emerald-300 mt-1 inline-block"
                    >
                      Join Zoom →
                    </a>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2 mt-3">
                {onReschedule && (
                  <button
                    onClick={() => onReschedule(session.id)}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-white/5 border border-white/10 
                      rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Reschedule
                  </button>
                )}
                {onCancel && (
                  <button
                    onClick={() => onCancel(session.id)}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-white/5 border border-white/10 
                      rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
