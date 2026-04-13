import React from 'react';

interface MetricCardProps {
  label: string;
  value: number;
  icon?: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'violet' | 'zinc';
  className?: string;
}

const variantColors = {
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  violet: 'text-violet-400',
  zinc: 'text-zinc-400'
};

export function MetricCard({ 
  label, 
  value, 
  icon, 
  variant = 'emerald',
  className = '' 
}: MetricCardProps) {
  const colorClass = variantColors[variant];
  
  return (
    <div
      className={`relative bg-white/5 backdrop-blur-md border border-white/10 rounded-xl md:rounded-2xl p-3 md:p-5 
        transition-all duration-300 hover:translate-y-[-2px] hover:shadow-[0_8px_32px_rgba(16,185,129,0.15)] 
        ${className}`}
    >
      {icon && (
        <div className="mb-1.5 md:mb-2 text-zinc-400 text-sm md:text-base">
          {icon}
        </div>
      )}
      <div className="text-[10px] md:text-xs text-zinc-400 uppercase tracking-wide mb-1.5 md:mb-2">
        {label}
      </div>
      <div className={`text-2xl md:text-4xl font-bold ${colorClass}`}>
        {value}
      </div>
    </div>
  );
}
