import React from 'react';
import { Client } from '@/types/routines';

interface PerformanceMetricsSectionProps {
  client: Client;
}

export function PerformanceMetricsSection({ client }: PerformanceMetricsSectionProps) {
  const attendancePercentage = client.attendance_total > 0 
    ? Math.round((client.attendance_count / client.attendance_total) * 100) 
    : 0;
  
  const isGoodAttendance = attendancePercentage >= 70;

  return (
    <div className="mb-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
      <h3 className="text-lg font-semibold text-zinc-100 mb-4">📊 Progress & Value</h3>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Sessions Completed */}
        <div className="bg-black/20 rounded-xl p-4">
          <div className="text-xs text-zinc-400 uppercase tracking-wide mb-2">
            Sessions Completed
          </div>
          <div className="text-2xl font-bold text-emerald-400 mb-2">
            {client.completed_sessions} of {client.total_sessions}
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-600"
              style={{ 
                width: `${Math.round((client.completed_sessions / client.total_sessions) * 100)}%` 
              }}
            />
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-black/20 rounded-xl p-4">
          <div className="text-xs text-zinc-400 uppercase tracking-wide mb-2">
            Attendance Rate
          </div>
          <div className="text-2xl font-bold text-emerald-400 mb-1">
            {client.attendance_count}/{client.attendance_total} attended
          </div>
          <div className={`text-xs ${isGoodAttendance ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isGoodAttendance ? 'Great! 👍' : 'Keep encouraging'}
          </div>
        </div>

        {/* Current Streak */}
        <div className="bg-black/20 rounded-xl p-4">
          <div className="text-xs text-zinc-400 uppercase tracking-wide mb-2">
            Current Streak
          </div>
          <div className="text-2xl font-bold text-amber-400 mb-1">
            {client.current_streak_weeks} weeks
          </div>
          <div className="text-xs text-amber-400">
            {client.current_streak_weeks > 0 ? '🔥 On fire!' : 'Let\'s build!'}
          </div>
        </div>
      </div>

      {/* Lifetime Value */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Lifetime Value</span>
          <span className="text-lg font-semibold text-zinc-200">
            ₹{client.lifetime_value.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
