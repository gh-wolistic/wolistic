import React from 'react';
import { Routine } from '@/types/routines';
import { ProgressBar } from './ProgressBar';

interface ActiveRoutineSectionProps {
  routine: Routine | undefined;
  onCreateRoutine?: () => void;
  onViewDetails?: () => void;
  onEdit?: () => void;
  onArchive?: () => void;
}

export function ActiveRoutineSection({ 
  routine, 
  onCreateRoutine,
  onViewDetails,
  onEdit,
  onArchive
}: ActiveRoutineSectionProps) {
  // Empty state - no routine
  if (!routine) {
    return (
      <div className="mb-6 bg-white/5 backdrop-blur-md border-2 border-transparent 
        bg-gradient-to-br from-emerald-500/10 to-teal-500/5 
        shadow-[0_0_40px_rgba(16,185,129,0.15)] rounded-3xl p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-6 opacity-30">🎯</div>
          <h3 className="text-xl font-semibold text-zinc-100 mb-3 text-center">
            Create their first personalized routine
          </h3>
          <p className="text-sm text-zinc-400 mb-8 text-center max-w-md">
            Help them reach their goals with a custom workout, meal, or wellness plan.
          </p>
          <button
            onClick={onCreateRoutine}
            className="px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg 
              hover:bg-emerald-600 transition-colors duration-200 text-lg"
          >
            + Create Routine
          </button>
        </div>
      </div>
    );
  }

  // Active routine display
  const completedToday = routine.items.filter(item => item.completed).length;
  const totalToday = routine.items.length;

  return (
    <div className="mb-6 bg-white/5 backdrop-blur-md 
      border-2 border-transparent bg-gradient-to-br from-emerald-500/10 to-teal-500/5
      shadow-[0_0_40px_rgba(16,185,129,0.15)] rounded-3xl p-8
      hover:shadow-[0_0_48px_rgba(16,185,129,0.2)] transition-shadow duration-300">
      
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-sm text-emerald-400 font-medium mb-2">
            🏋️ Active Routine
          </div>
          <h2 className="text-2xl font-bold text-zinc-100 mb-2">
            {routine.title}
          </h2>
          <p className="text-sm text-zinc-400">
            {routine.description}
          </p>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-white/5 border border-white/10 
                rounded-lg hover:bg-white/10 transition-colors"
            >
              Edit
            </button>
          )}
          {onArchive && (
            <button
              onClick={onArchive}
              className="px-3 py-1.5 text-xs font-medium text-zinc-300 bg-white/5 border border-white/10 
                rounded-lg hover:bg-white/10 transition-colors"
            >
              Archive
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="text-sm text-emerald-400 mb-2">
          Week {routine.current_week} of {routine.duration_weeks}
        </div>
        <ProgressBar 
          current={routine.current_week}
          total={routine.duration_weeks}
          showPercentage={true}
        />
      </div>

      {/* Today's Checklist */}
      <div className="bg-black/20 rounded-2xl p-6">
        <div className="text-sm font-medium text-zinc-100 mb-4">
          ⏰ Today's Checklist ({completedToday}/{totalToday} completed)
        </div>
        
        <div className="space-y-3">
          {routine.items.slice(0, 5).map((item) => (
            <div 
              key={item.id}
              className="flex items-start gap-3"
            >
              <div className={`mt-0.5 w-5 h-5 rounded flex items-center justify-center flex-shrink-0
                ${item.completed 
                  ? 'bg-emerald-400 text-white' 
                  : 'bg-white/10 border border-white/20'
                }`}
              >
                {item.completed && '✓'}
              </div>
              <div className="flex-1">
                <div className={`text-sm ${item.completed ? 'text-zinc-100' : 'text-zinc-400'}`}>
                  {getItemIcon(item.type)} {item.title}
                </div>
                {item.instructions && (
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {item.instructions}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="w-full mt-6 text-sm font-medium text-emerald-400 hover:text-emerald-300 
              transition-colors text-center"
          >
            View Full Routine Details →
          </button>
        )}
      </div>
    </div>
  );
}

function getItemIcon(type: string): string {
  const icons: Record<string, string> = {
    hydration: '💧',
    mobility: '�',
    exercise: '🏋️'
  };
  return icons[type] || '📋';
}
