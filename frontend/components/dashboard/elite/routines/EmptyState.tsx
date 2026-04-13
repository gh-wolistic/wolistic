import React from 'react';

interface EmptyStateProps {
  variant: 'no-clients' | 'no-routines' | 'no-followups' | 'no-sessions';
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

const emptyStateConfig = {
  'no-clients': {
    icon: '🙌',
    title: 'Invite your first client!',
    description: 'Send an email invitation to clients to join your wellness program. They will create a profile on Wolistic.',
    defaultActionLabel: 'Invite Client'
  },
  'no-routines': {
    icon: '🎯',
    title: 'Create their first personalized routine',
    description: 'Help them reach their goals with a custom workout, meal, or wellness plan.',
    defaultActionLabel: 'Create Routine'
  },
  'no-followups': {
    icon: '✨',
    title: 'All caught up!',
    description: 'Great work staying on top of follow-ups. Check in with clients when ready.',
    defaultActionLabel: 'Add Follow-up'
  },
  'no-sessions': {
    icon: '📅',
    title: 'No sessions scheduled',
    description: 'Schedule a session to help your client stay on track with their goals.',
    defaultActionLabel: 'Schedule Session'
  }
};

export function EmptyState({ 
  variant, 
  onAction, 
  actionLabel,
  className = '' 
}: EmptyStateProps) {
  const config = emptyStateConfig[variant];
  const buttonLabel = actionLabel || config.defaultActionLabel;
  
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <div className="text-6xl mb-6 opacity-30">
        {config.icon}
      </div>
      <h3 className="text-xl font-semibold text-zinc-100 mb-3 text-center">
        {config.title}
      </h3>
      <p className="text-sm text-zinc-400 mb-8 text-center max-w-md">
        {config.description}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          className="px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg 
            hover:bg-emerald-600 transition-colors duration-200"
        >
          + {buttonLabel}
        </button>
      )}
    </div>
  );
}
