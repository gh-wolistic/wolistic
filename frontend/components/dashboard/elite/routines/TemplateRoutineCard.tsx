import React from 'react';
import { Routine } from '@/types/routines';

interface TemplateRoutineCardProps {
  template: Routine;
  onAssign: (templateId: number) => void;
  onEdit: (templateId: number) => void;
}

export function TemplateRoutineCard({ template, onAssign, onEdit }: TemplateRoutineCardProps) {
  const itemCount = template.items.length;
  const exerciseCount = template.items.filter(i => i.type === 'exercise').length;
  const mobilityCount = template.items.filter(i => i.type === 'mobility').length;
  const hydrationCount = template.items.filter(i => i.type === 'hydration').length;

  return (
    <div className="group relative bg-white/5 border border-white/10 rounded-xl p-6 
      hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300 cursor-pointer">
      
      {/* Template Badge */}
      <div className="absolute top-4 right-4">
        <div className="px-3 py-1 bg-violet-500/20 border border-violet-400/30 rounded-full text-xs font-medium text-violet-300">
          Template
        </div>
      </div>

      {/* Title & Description */}
      <div className="mb-4 pr-20">
        <h3 className="text-lg font-semibold text-zinc-100 mb-2 group-hover:text-emerald-400 transition-colors">
          {template.title}
        </h3>
        <p className="text-sm text-zinc-400 line-clamp-2">
          {template.description}
        </p>
      </div>

      {/* Template Stats */}
      <div className="grid grid-cols-2 gap-4 mb-5 pb-5 border-b border-white/10">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Duration</p>
          <p className="text-sm font-medium text-zinc-200">
            {template.duration_weeks} week{template.duration_weeks > 1 ? 's' : ''}
          </p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Assigned To</p>
          <p className="text-sm font-medium text-zinc-200">
            {template.assigned_count || 0} client{(template.assigned_count || 0) !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Item Breakdown */}
      <div className="mb-5">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Items in Routine</p>
        <div className="flex flex-wrap gap-2">
          {exerciseCount > 0 && (
            <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-zinc-300">
              🏋️ {exerciseCount} Exercise{exerciseCount > 1 ? 's' : ''}
            </div>
          )}
          {hydrationCount > 0 && (
            <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-zinc-300">
              💧 {hydrationCount} Hydration
            </div>
          )}
          {mobilityCount > 0 && (
            <div className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-zinc-300">
              🤸 {mobilityCount} Mobility
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAssign(template.id);
          }}
          className="flex-1 px-4 py-2.5 bg-emerald-500 text-white text-sm font-medium rounded-lg 
            hover:bg-emerald-600 transition-colors"
        >
          Assign to Clients
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(template.id);
          }}
          className="px-4 py-2.5 bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium rounded-lg 
            hover:bg-white/10 transition-colors"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
