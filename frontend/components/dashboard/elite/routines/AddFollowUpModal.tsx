import React, { useState } from 'react';
import { Client } from '@/types/routines';

interface AddFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: Client[];
  preselectedClientId?: number;
  onSave: (followUp: {
    client_id: number;
    note: string;
    due_date: string;
  }) => void;
}

export function AddFollowUpModal({ 
  isOpen, 
  onClose, 
  clients, 
  preselectedClientId,
  onSave 
}: AddFollowUpModalProps) {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(preselectedClientId || null);
  const [note, setNote] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  // Only show active clients
  const activeClients = clients.filter(c => c.status === 'active');

  const selectedClient = activeClients.find(c => c.id === selectedClientId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClientId || !note.trim() || !dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    onSave({
      client_id: selectedClientId,
      note: note.trim(),
      due_date: dueDate
    });

    // Reset form
    setNote('');
    setDueDate('');
    if (!preselectedClientId) {
      setSelectedClientId(null);
    }
    setIsSaving(false);
    onClose();
  };

  const handleClose = () => {
    setNote('');
    setDueDate('');
    if (!preselectedClientId) {
      setSelectedClientId(null);
    }
    onClose();
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#0a0f1e] border border-white/10 rounded-2xl 
        shadow-2xl animate-[slideUp_0.3s_ease-out]">
        
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-white/10">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-zinc-100 mb-2">
              Add Follow-Up
            </h2>
            <p className="text-sm text-zinc-400">
              Schedule a reminder to check in with a client
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Client Selector */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Client <span className="text-red-400">*</span>
            </label>
            {preselectedClientId ? (
              <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400/20 to-cyan-500/20 
                    border border-emerald-400/30 flex items-center justify-center text-sm font-semibold text-emerald-300">
                    {selectedClient?.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{selectedClient?.name}</p>
                    <p className="text-xs text-zinc-400">{selectedClient?.email}</p>
                  </div>
                </div>
              </div>
            ) : (
              <select
                value={selectedClientId || ''}
                onChange={(e) => setSelectedClientId(parseInt(e.target.value))}
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-zinc-100 
                  focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 
                  transition-all appearance-none cursor-pointer"
              >
                <option value="" className="bg-[#0a0f1e]">Select a client...</option>
                {activeClients.map(client => (
                  <option key={client.id} value={client.id} className="bg-[#0a0f1e]">
                    {client.name} ({client.email})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Note */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Follow-Up Note <span className="text-red-400">*</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              required
              rows={4}
              placeholder="e.g., Check progress on nutrition plan, review workout form video, discuss next program..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-zinc-100 
                placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 
                focus:border-emerald-500/50 transition-all resize-none"
            />
            <p className="text-xs text-zinc-500 mt-2">
              What do you want to remember to do or discuss?
            </p>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Due Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={today}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-zinc-100 
                focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 
                transition-all cursor-pointer"
            />
            <p className="text-xs text-zinc-500 mt-2">
              When should you complete this follow-up?
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-zinc-300 font-medium 
                rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !selectedClientId || !note.trim() || !dueDate}
              className="flex-1 px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg 
                hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Add Follow-Up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
