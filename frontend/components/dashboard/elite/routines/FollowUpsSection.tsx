import React from 'react';
import { FollowUp } from '@/types/routines';

interface FollowUpsSectionProps {
  followUps: FollowUp[];
  onAddFollowUp?: () => void;
  onMarkDone?: (followUpId: number) => void;
  onEdit?: (followUpId: number) => void;
}

export function FollowUpsSection({ 
  followUps, 
  onAddFollowUp,
  onMarkDone,
  onEdit
}: FollowUpsSectionProps) {
  const pendingFollowUps = followUps.filter(f => !f.resolved);

  // Empty state
  if (pendingFollowUps.length === 0) {
    return (
      <div className="mb-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-100">📋 Pending Follow-ups</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-4xl mb-3">👍</div>
          <p className="text-sm text-zinc-400 mb-2">All caught up!</p>
          <p className="text-xs text-zinc-500 mb-4">Check in with them soon?</p>
          {onAddFollowUp && (
            <button 
              onClick={onAddFollowUp}
              className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg 
                hover:bg-emerald-600 transition-colors"
            >
              + Add Follow-up
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-zinc-100">
          📋 Pending Follow-ups ({pendingFollowUps.length})
        </h3>
        {onAddFollowUp && (
          <button 
            onClick={onAddFollowUp}
            className="px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 
              border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors"
          >
            + Add Follow-up
          </button>
        )}
      </div>

      {/* Follow-ups List */}
      <div className="space-y-3">
        {pendingFollowUps.map((followUp) => {
          const dueDate = new Date(followUp.due_date);
          const today = new Date();
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          const isOverdue = followUp.is_overdue;
          const isTomorrow = dueDate.toDateString() === tomorrow.toDateString();
          const isToday = dueDate.toDateString() === today.toDateString();

          let dueDateText = dueDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          });
          
          if (isToday) dueDateText = 'Today';
          else if (isTomorrow) dueDateText = 'Tomorrow';
          else if (isOverdue) dueDateText = `Overdue (${dueDateText})`;

          return (
            <div 
              key={followUp.id}
              className="bg-black/20 rounded-xl p-4 border border-white/5"
            >
              <div className="mb-3">
                <div className={`text-xs font-medium mb-2 ${
                  isOverdue ? 'text-rose-400' : 
                  isTomorrow ? 'text-amber-400' : 
                  'text-zinc-400'
                }`}>
                  Due: {dueDateText}
                </div>
                <div className="text-sm text-zinc-200">
                  {followUp.note}
                </div>
              </div>
              
              <div className="flex gap-2">
                {onMarkDone && (
                  <button
                    onClick={() => onMarkDone(followUp.id)}
                    className="px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 
                      border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors"
                  >
                    ✓ Mark Done
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={() => onEdit(followUp.id)}
                    className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-white/5 border border-white/10 
                      rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Edit
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
