import React, { useState } from 'react';
import { AcquisitionSource, ClientStatus } from '@/types/routines';

interface FiltersBarProps {
  onSearchChange: (search: string) => void;
  onSourceFilter: (source: AcquisitionSource | 'all') => void;
  onStatusFilter: (status: ClientStatus | 'all') => void;
  onSortChange: (sort: 'recent' | 'name' | 'sessions') => void;
}

export function FiltersBar({ 
  onSearchChange, 
  onSourceFilter, 
  onStatusFilter,
  onSortChange 
}: FiltersBarProps) {
  const [search, setSearch] = useState('');

  const handleSearchChange = (value: string) => {
    setSearch(value);
    onSearchChange(value);
  };

  return (
    <div className="sticky top-0 z-10 bg-[#0a0f1e]/95 backdrop-blur-lg pb-4">
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="🔍 Search clients..."
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
              text-zinc-100 placeholder:text-zinc-500 
              focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20
              transition-all"
          />
        </div>
      </div>

      {/* Filter Dropdowns */}
      <div className="flex gap-3 flex-wrap">
        {/* Source Filter */}
        <select
          onChange={(e) => onSourceFilter(e.target.value as AcquisitionSource | 'all')}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-300
            focus:outline-none focus:border-emerald-500/50 cursor-pointer
            hover:bg-white/10 transition-colors"
        >
          <option value="all">Source: All</option>
          <option value="organic_search">Organic Search</option>
          <option value="expert_invite">Expert Invited</option>
          <option value="corporate_event">Corporate Event</option>
          <option value="wolistic_recommendation">Wolistic Recommended</option>
          <option value="wolistic_lead">Lead</option>
        </select>

        {/* Status Filter */}
        <select
          onChange={(e) => onStatusFilter(e.target.value as ClientStatus | 'all')}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-300
            focus:outline-none focus:border-emerald-500/50 cursor-pointer
            hover:bg-white/10 transition-colors"
        >
          <option value="all">Status: All</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="archived">Archived</option>
        </select>

        {/* Sort */}
        <select
          onChange={(e) => onSortChange(e.target.value as 'recent' | 'name' | 'sessions')}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-300
            focus:outline-none focus:border-emerald-500/50 cursor-pointer
            hover:bg-white/10 transition-colors"
        >
          <option value="recent">Sort: Most Recent</option>
          <option value="name">Sort: Name (A-Z)</option>
          <option value="sessions">Sort: Sessions</option>
        </select>
      </div>
    </div>
  );
}
