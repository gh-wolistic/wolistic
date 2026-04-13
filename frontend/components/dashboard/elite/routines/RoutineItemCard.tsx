'use client';

import React, { useState } from 'react';
import { RoutineItem, RoutineItemType } from '@/types/routines';

interface RoutineItemCardProps {
  item: RoutineItem;
  onUpdate: (item: RoutineItem) => void;
  onDelete: () => void;
}

// Body Expert specific item types only (holistic approach handled separately)
const itemTypeConfig: Record<RoutineItemType, { icon: string; color: string; label: string }> = {
  exercise: { icon: '🏋️', color: 'text-emerald-400', label: 'Exercise' },
  hydration: { icon: '💧', color: 'text-sky-400', label: 'Hydration' },
  mobility: { icon: '🤸', color: 'text-teal-400', label: 'Mobility / Stretching' }
};

export function RoutineItemCard({ item, onUpdate, onDelete }: RoutineItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const config = itemTypeConfig[item.type];

  const handleFieldChange = (field: keyof RoutineItem, value: any) => {
    onUpdate({ ...item, [field]: value });
  };

  if (!isExpanded) {
    // Collapsed state
    const summary = item.type === 'exercise' && item.sets && item.reps
      ? `(${item.sets}×${item.reps}${item.rest_seconds ? `, ${item.rest_seconds}s rest` : ''})`
      : '';

    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="cursor-grab text-zinc-600">⋮⋮</div>
            <span className={`text-lg ${config.color}`}>{config.icon}</span>
            <span className="text-sm font-medium text-zinc-200">
              {item.title || `New ${config.label}`} {summary}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(true)}
              className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Expand ▼
            </button>
            <button
              onClick={onDelete}
              className="px-2 py-1 text-xs text-rose-400 hover:text-rose-300 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Expanded state
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="cursor-grab text-zinc-600">⋮⋮</div>
          <span className={`text-xl ${config.color}`}>{config.icon}</span>
          <span className="text-sm font-semibold text-zinc-200">{config.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(false)}
            className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Collapse ▲
          </button>
          <button
            onClick={onDelete}
            className="px-2 py-1 text-xs text-rose-400 hover:text-rose-300 transition-colors"
          >
            ✕ Delete
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="mb-4">
        <label className="block text-xs text-zinc-400 uppercase tracking-wide mb-2">
          {config.label} Name *
        </label>
        <input
          type="text"
          value={item.title}
          onChange={(e) => handleFieldChange('title', e.target.value)}
          placeholder={`e.g., ${item.type === 'exercise' ? 'Barbell Back Squat' : item.type === 'mobility' ? 'Hip Flexor Stretch' : 'Drink 3L water throughout day'}`}
          className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg 
            text-sm text-zinc-100 placeholder:text-zinc-500
            focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* Instructions */}
      <div className="mb-4">
        <label className="block text-xs text-zinc-400 uppercase tracking-wide mb-2">
          Instructions / Form Cues
        </label>
        <textarea
          value={item.instructions || ''}
          onChange={(e) => handleFieldChange('instructions', e.target.value)}
          placeholder="Detailed instructions, form cues, or notes..."
          rows={3}
          className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg 
            text-sm text-zinc-100 placeholder:text-zinc-500
            focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20
            resize-none"
        />
      </div>

      {/* Exercise-specific fields */}
      {item.type === 'exercise' && (
        <div className="grid grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-zinc-400 uppercase tracking-wide mb-2">
              Sets
            </label>
            <input
              type="number"
              value={item.sets || ''}
              onChange={(e) => handleFieldChange('sets', parseInt(e.target.value) || 0)}
              placeholder="4"
              min="0"
              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg 
                text-sm text-zinc-100 placeholder:text-zinc-500
                focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 uppercase tracking-wide mb-2">
              Reps
            </label>
            <input
              type="number"
              value={item.reps || ''}
              onChange={(e) => handleFieldChange('reps', parseInt(e.target.value) || 0)}
              placeholder="8"
              min="0"
              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg 
                text-sm text-zinc-100 placeholder:text-zinc-500
                focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 uppercase tracking-wide mb-2">
              Rest (sec)
            </label>
            <input
              type="number"
              value={item.rest_seconds || ''}
              onChange={(e) => handleFieldChange('rest_seconds', parseInt(e.target.value) || 0)}
              placeholder="90"
              min="0"
              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg 
                text-sm text-zinc-100 placeholder:text-zinc-500
                focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 uppercase tracking-wide mb-2">
              Intensity
            </label>
            <select
              value={item.intensity || 'moderate'}
              onChange={(e) => handleFieldChange('intensity', e.target.value)}
              className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg 
                text-sm text-zinc-100
                focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="light">Light</option>
              <option value="moderate">Moderate</option>
              <option value="intense">Intense</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
