import React from 'react';

export type TabType = 'clients' | 'followups' | 'leads' | 'routines' | 'templates';

interface TabsNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs: { id: TabType; label: string }[] = [
  { id: 'clients', label: 'Clients' },
  { id: 'followups', label: 'Follow-ups' },
  { id: 'leads', label: 'Leads' },
  { id: 'routines', label: 'Routines' },
  { id: 'templates', label: 'Templates' }
];

export function TabsNavigation({ activeTab, onTabChange }: TabsNavigationProps) {
  return (
    <div className="border-b border-white/10 mb-6">
      <div className="flex gap-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative pb-3 text-sm font-medium transition-colors
              ${activeTab === tab.id 
                ? 'text-emerald-400' 
                : 'text-zinc-400 hover:text-zinc-300'
              }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 
                animate-[slideIn_0.3s_ease-out]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
