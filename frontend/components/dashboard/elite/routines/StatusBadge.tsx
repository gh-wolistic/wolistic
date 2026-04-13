import React from 'react';
import { ClientStatus } from '@/types/routines';

interface StatusBadgeProps {
  status: ClientStatus;
  className?: string;
}

const statusConfig = {
  active: {
    label: 'Active',
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30'
  },
  paused: {
    label: 'Paused',
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30'
  },
  archived: {
    label: 'Archived',
    bgColor: 'bg-zinc-600/20',
    textColor: 'text-zinc-400',
    borderColor: 'border-zinc-600/30'
  }
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      {config.label}
    </span>
  );
}
