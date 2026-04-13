import React from 'react';
import { AcquisitionSource } from '@/types/routines';

interface SourceBadgeProps {
  source: AcquisitionSource;
  className?: string;
}

const sourceConfig = {
  organic_search: {
    label: '🔍 Organic Search',
    bgColor: 'bg-zinc-500/20',
    textColor: 'text-zinc-300',
    borderColor: 'border-zinc-500/30'
  },
  expert_invite: {
    label: '🔗 Expert Invited',
    bgColor: 'bg-emerald-400/20',
    textColor: 'text-emerald-300',
    borderColor: 'border-emerald-500/30'
  },
  corporate_event: {
    label: '🏢 Corporate Event',
    bgColor: 'bg-sky-400/20',
    textColor: 'text-sky-300',
    borderColor: 'border-sky-500/30'
  },
  wolistic_recommendation: {
    label: '⭐ Wolistic Recommended',
    bgColor: 'bg-teal-400/20',
    textColor: 'text-teal-300',
    borderColor: 'border-teal-500/30'
  },
  wolistic_lead: {
    label: '📝 Lead',
    bgColor: 'bg-violet-400/20',
    textColor: 'text-violet-300',
    borderColor: 'border-violet-500/30'
  }
};

export function SourceBadge({ source, className = '' }: SourceBadgeProps) {
  const config = sourceConfig[source];
  
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
    >
      {config.label}
    </span>
  );
}
