import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export function ProgressBar({ 
  current, 
  total, 
  label, 
  showPercentage = true,
  className = '' 
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-zinc-400">{label}</span>
          {showPercentage && (
            <span className="text-sm text-zinc-400">{percentage}%</span>
          )}
        </div>
      )}
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-600 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
