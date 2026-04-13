import React, { useState } from 'react';
import { Client, Routine } from '@/types/routines';

interface BulkAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Routine | null;
  clients: Client[];
  onAssign: (templateId: number, clientIds: number[]) => void;
}

export function BulkAssignModal({ isOpen, onClose, template, clients, onAssign }: BulkAssignModalProps) {
  const [selectedClientIds, setSelectedClientIds] = useState<Set<number>>(new Set());
  const [isAssigning, setIsAssigning] = useState(false);

  if (!isOpen || !template) return null;

  const activeClients = clients.filter(c => c.status === 'active');

  const toggleClient = (clientId: number) => {
    const newSelected = new Set(selectedClientIds);
    if (newSelected.has(clientId)) {
      newSelected.delete(clientId);
    } else {
      newSelected.add(clientId);
    }
    setSelectedClientIds(newSelected);
  };

  const selectAll = () => {
    setSelectedClientIds(new Set(activeClients.map(c => c.id)));
  };

  const clearAll = () => {
    setSelectedClientIds(new Set());
  };

  const handleAssign = async () => {
    if (selectedClientIds.size === 0) return;
    
    setIsAssigning(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    onAssign(template.id, Array.from(selectedClientIds));
    setIsAssigning(false);
    setSelectedClientIds(new Set());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0a0f1e] border border-white/10 rounded-2xl 
        shadow-2xl flex flex-col animate-[slideUp_0.3s_ease-out]">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-zinc-100 mb-2">
              Assign Template to Clients
            </h2>
            <p className="text-sm text-zinc-400">
              Template: <span className="text-emerald-400 font-medium">{template.title}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Bulk Actions */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-zinc-400">
              {selectedClientIds.size} of {activeClients.length} clients selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={selectAll}
                className="px-3 py-1.5 bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium 
                  rounded-lg hover:bg-white/10 transition-colors"
              >
                Select All
              </button>
              <button
                onClick={clearAll}
                className="px-3 py-1.5 bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium 
                  rounded-lg hover:bg-white/10 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Client List */}
          <div className="space-y-2">
            {activeClients.map(client => {
              const isSelected = selectedClientIds.has(client.id);
              return (
                <label
                  key={client.id}
                  className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all
                    ${isSelected 
                      ? 'bg-emerald-500/10 border-emerald-500/30' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleClient(client.id)}
                    className="w-5 h-5 rounded border-white/20 bg-white/5 text-emerald-500 
                      focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                  />
                  
                  {/* Client Avatar */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 
                    border border-emerald-400/30 flex items-center justify-center text-sm font-semibold text-emerald-300">
                    {client.initials}
                  </div>

                  {/* Client Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-100 truncate">{client.name}</p>
                    <p className="text-xs text-zinc-400 truncate">{client.email}</p>
                  </div>

                  {/* Sessions Count */}
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Sessions</p>
                    <p className="text-sm font-medium text-zinc-300">
                      {client.completed_sessions}/{client.total_sessions}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {activeClients.length === 0 && (
            <div className="text-center py-12">
              <p className="text-zinc-400">No active clients available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0a0f1e]/95 backdrop-blur-lg border-t border-white/10 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              disabled={isAssigning}
              className="px-6 py-3 bg-white/5 border border-white/10 text-zinc-300 font-medium 
                rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            
            <button
              onClick={handleAssign}
              disabled={selectedClientIds.size === 0 || isAssigning}
              className="px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg 
                hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAssigning 
                ? 'Assigning...' 
                : `Assign to ${selectedClientIds.size} Client${selectedClientIds.size !== 1 ? 's' : ''}`
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
