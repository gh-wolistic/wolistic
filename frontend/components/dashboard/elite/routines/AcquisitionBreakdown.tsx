import React from 'react';
import { AcquisitionSource } from '@/types/routines';

interface AcquisitionBreakdownProps {
  channels: {
    source: AcquisitionSource;
    count: number;
    label: string;
    icon: string;
    color: string;
  }[];
  totalClients: number;
}

export function AcquisitionBreakdown({ channels, totalClients }: AcquisitionBreakdownProps) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 md:p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-2">
        <div>
          <h3 className="text-xs md:text-sm font-semibold text-zinc-100 uppercase tracking-wider">
            Client Acquisition Channels
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Where your {totalClients} clients are coming from
          </p>
        </div>
        <div className="text-xs text-zinc-500">
          Last 12 months
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {channels.map((channel) => {
          const percentage = totalClients > 0 ? (channel.count / totalClients) * 100 : 0;
          
          return (
            <div
              key={channel.source}
              className="relative group cursor-pointer"
            >
              {/* Progress Bar Background */}
              <div className="h-1.5 md:h-2 bg-white/5 rounded-full overflow-hidden mb-2 md:mb-3">
                <div
                  className={`h-full ${channel.color} rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              {/* Content */}
              <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                <span className="text-base md:text-lg">{channel.icon}</span>
                <span className="text-xl md:text-2xl font-bold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                  {channel.count}
                </span>
              </div>

              <div className="space-y-0.5 md:space-y-1">
                <p className="text-xs font-medium text-zinc-300 truncate">
                  {channel.label}
                </p>
                <p className="text-xs text-zinc-500">
                  {percentage.toFixed(1)}%
                </p>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 -z-10 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 
                transition-opacity -m-2" />
            </div>
          );
        })}
      </div>

      {/* Insights (Optional) */}
      {channels.length > 0 && (
        <div className="mt-4 md:mt-5 pt-4 md:pt-5 border-t border-white/10">
          <div className="flex items-start sm:items-center gap-2 text-xs text-zinc-400">
            <svg className="w-4 h-4 flex-shrink-0 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span>
              <strong className="text-zinc-300">
                {channels.sort((a, b) => b.count - a.count)[0]?.label}
              </strong> is your top acquisition channel with {channels.sort((a, b) => b.count - a.count)[0]?.count} clients
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
