'use client';

import React, { useState } from 'react';
import { Routine, RoutineItem, RoutineItemType, Client } from '@/types/routines';
import { RoutineItemCard } from './RoutineItemCard';

interface RoutineEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: number; // Optional - if provided, pre-selects client
  routine?: Routine;
  clients?: Client[]; // Available clients for selection
  onSave: (routine: Partial<Routine> & { clientId?: number; isTemplate: boolean }) => void;
}

export function RoutineEditorModal({ 
  isOpen, 
  onClose, 
  clientId,
  routine,
  clients = [],
  onSave 
}: RoutineEditorModalProps) {
  const [title, setTitle] = useState(routine?.title || '');
  const [description, setDescription] = useState(routine?.description || '');
  const [items, setItems] = useState<RoutineItem[]>(routine?.items || []);
  const [selectedClientId, setSelectedClientId] = useState<number | undefined>(clientId || routine?.client_id);
  const [isTemplate, setIsTemplate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null;

  const addItem = (type: RoutineItemType) => {
    const newItem: RoutineItem = {
      id: `item-${Date.now()}`,
      type,
      order: items.length + 1,
      title: '',
      completed: false
    };
    setItems([...items, newItem]);
  };

  const updateItem = (index: number, updatedItem: RoutineItem) => {
    const newItems = [...items];
    newItems[index] = updatedItem;
    setItems(newItems);
  };

  const deleteItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    // Reorder remaining items
    const reorderedItems = newItems.map((item, i) => ({ ...item, order: i + 1 }));
    setItems(reorderedItems);
  };

  const handleSaveDraft = () => {
    setIsSaving(true);
    onSave({
      title,
      description,
      items,
      status: 'draft',
      clientId: selectedClientId,
      isTemplate
    });
    setTimeout(() => {
      setIsSaving(false);
      alert(isTemplate ? 'Template saved!' : 'Draft saved!');
    }, 500);
  };

  const handlePublish = () => {
    if (!title.trim()) {
      alert('Please add a routine title');
      return;
    }
    if (items.length === 0) {
      alert('Please add at least one routine item');
      return;
    }
    if (!isTemplate && !selectedClientId) {
      alert('Please select a client or save as template');
      return;
    }
    
    const confirmMsg = isTemplate 
      ? 'Save this as a template routine? You can assign it to clients later.' 
      : `Publish this routine to ${selectedClient?.name}? They will see it immediately in their app.`;
    
    if (confirm(confirmMsg)) {
      setIsSaving(true);
      onSave({
        title,
        description,
        items,
        status: isTemplate ? 'draft' : 'published',
        published_at: isTemplate ? undefined : new Date().toISOString(),
        approved_at: isTemplate ? undefined : new Date().toISOString(),
        clientId: selectedClientId,
        isTemplate
      });
      setTimeout(() => {
        setIsSaving(false);
        onClose();
        alert(isTemplate ? 'Template created successfully!' : 'Routine published successfully!');
      }, 500);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-end"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal Sheet */}
      <div 
        className="relative w-full sm:max-w-2xl lg:max-w-4xl h-full bg-[#0a0f1e] shadow-2xl overflow-hidden
          animate-[slideIn_0.3s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-[#0a0f1e]/95 backdrop-blur-lg border-b border-white/10 px-4 md:px-8 py-4 md:py-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg md:text-2xl font-bold text-zinc-100 pr-4">
              {routine ? 'Edit Routine' : isTemplate ? 'Create Template' : selectedClient ? `Routine for ${selectedClient.name}` : 'New Routine'}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-100 transition-colors text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Form Area */}
        <div className="h-[calc(100vh-200px)] overflow-y-auto px-4 md:px-8 py-4 md:py-6">
          {/* Client Selector & Template Toggle */}
          <div className="mb-4 md:mb-6 p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Assign to Client
                </label>
                <select
                  value={selectedClientId || ''}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value ? parseInt(e.target.value) : undefined);
                    if (e.target.value) setIsTemplate(false);
                  }}
                  disabled={isTemplate}
                  className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base bg-black/20 border border-white/10 rounded-lg 
                    text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed
                    focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20
                    transition-all"
                >
                  <option value="">Select a client...</option>
                  {clients.filter(c => c.status === 'active').map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.acquisition_source})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isTemplate}
                    onChange={(e) => {
                      setIsTemplate(e.target.checked);
                      if (e.target.checked) setSelectedClientId(undefined);
                    }}
                    className="w-5 h-5 rounded border-white/20 bg-black/20 text-emerald-500
                      focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="text-sm text-zinc-300">
                    💾 Save as template (no client assigned)
                  </span>
                </label>
              </div>
            </div>
            {isTemplate && (
              <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-xs text-emerald-400">
                  ✨ Template routines can be assigned to multiple clients and customized for each.
                </p>
              </div>
            )}
          </div>

          {/* Routine Title */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Routine Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 4-Week Hypertrophy Program"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                text-zinc-100 placeholder:text-zinc-500
                focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20
                transition-all"
            />
          </div>

          {/* Description */}
          <div className="mb-4 md:mb-6">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the routine's purpose, structure, and goals..."
              rows={3}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl 
                text-zinc-100 placeholder:text-zinc-500
                focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20
                resize-none transition-all"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 mb-6 pt-6">
            <h3 className="text-lg font-semibold text-zinc-100 mb-4">
              Routine Items {items.length > 0 && `(${items.length})`}
            </h3>
            {items.length > 0 && (
              <p className="text-xs text-zinc-500 mb-4">
                Drag items to reorder
              </p>
            )}
          </div>

          {/* Routine Items */}
          <div className="space-y-4 mb-6">
            {items.map((item, index) => (
              <RoutineItemCard
                key={item.id}
                item={item}
                onUpdate={(updatedItem) => updateItem(index, updatedItem)}
                onDelete={() => deleteItem(index)}
              />
            ))}
          </div>

          {/* Add Item Buttons - Body Expert Specific */}
          <div className="flex flex-wrap gap-2 md:gap-3 mb-6 md:mb-8">
            <button
              onClick={() => addItem('exercise')}
              className="px-4 py-2 bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium 
                rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              🏋️ Add Exercise
            </button>
            <button
              onClick={() => addItem('hydration')}
              className="px-4 py-2 bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium 
                rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              💧 Add Hydration Goal
            </button>
            <button
              onClick={() => addItem('mobility')}
              className="px-4 py-2 bg-white/5 border border-white/10 text-zinc-300 text-sm font-medium 
                rounded-lg hover:bg-white/10 transition-colors flex items-center gap-2"
            >
              🤸 <span className="hidden sm:inline">Add </span>Mobility
            </button>
          </div>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 z-10 bg-[#0a0f1e]/95 backdrop-blur-lg border-t border-white/10 px-4 md:px-8 py-4 md:py-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-4">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 md:px-6 py-2.5 md:py-3 bg-white/5 border border-white/10 text-zinc-300 text-sm md:text-base font-medium 
                rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 order-3 sm:order-1"
            >
              Cancel
            </button>
            
            <div className="flex gap-2 md:gap-3 order-1 sm:order-2 flex-1">
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="flex-1 sm:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-white/5 border border-emerald-500/30 text-emerald-400 text-sm md:text-base font-medium 
                  rounded-lg hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : <><span className="hidden sm:inline">Save as </span>Draft</>}
              </button>
              <button
                onClick={handlePublish}
                disabled={isSaving}
                className="flex-1 sm:flex-none px-4 md:px-6 py-2.5 md:py-3 bg-emerald-500 text-white text-sm md:text-base font-medium 
                  rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {isSaving 
                  ? (isTemplate ? 'Saving...' : 'Publishing...') 
                  : (isTemplate ? 'Save Template' : 'Publish to Client →')
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
