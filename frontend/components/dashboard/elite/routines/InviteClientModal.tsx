import React, { useState } from 'react';

interface InviteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, name?: string, personalMessage?: string) => void;
}

export function InviteClientModal({ isOpen, onClose, onInvite }: InviteClientModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      alert('Please enter an email address');
      return;
    }

    setIsSending(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onInvite(email.trim(), name.trim() || undefined, personalMessage.trim() || undefined);
    
    // Reset form
    setEmail('');
    setName('');
    setPersonalMessage('');
    setIsSending(false);
    onClose();
  };

  const handleClose = () => {
    setEmail('');
    setName('');
    setPersonalMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full h-full sm:h-auto sm:max-w-xl bg-[#0a0f1e] border-0 sm:border border-white/10 rounded-none sm:rounded-2xl 
        shadow-2xl animate-[slideUp_0.3s_ease-out] overflow-y-auto sm:overflow-visible">
        
        {/* Header */}
        <div className="flex items-start justify-between p-4 md:p-6 border-b border-white/10 sticky top-0 bg-[#0a0f1e] z-10">
          <div className="flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-100 mb-2">
              Invite New Client
            </h2>
            <p className="text-xs md:text-sm text-zinc-400">
              Send an invitation to join your fitness program on Wolistic
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSending}
            className="text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-5">
          {/* Email (Required) */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="client@example.com"
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base bg-white/5 border border-white/10 rounded-lg text-zinc-100 
                placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 
                focus:border-emerald-500/50 transition-all"
            />
            <p className="text-xs text-zinc-500 mt-2">
              We'll send an invitation to this email to create a Wolistic profile
            </p>
          </div>

          {/* Name (Optional) */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Client's Name <span className="text-zinc-500">(Optional)</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Rahul Sharma"
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base bg-white/5 border border-white/10 rounded-lg text-zinc-100 
                placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 
                focus:border-emerald-500/50 transition-all"
            />
            <p className="text-xs text-zinc-500 mt-2">
              Personalize the invitation with their name
            </p>
          </div>

          {/* Personal Message (Optional) */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Personal Message <span className="text-zinc-500">(Optional)</span>
            </label>
            <textarea
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
              rows={4}
              placeholder="Hi! I'm excited to work with you on your fitness journey. Join my program on Wolistic to get started with personalized routines and tracking..."
              className="w-full px-3 md:px-4 py-2 md:py-3 text-sm md:text-base bg-white/5 border border-white/10 rounded-lg text-zinc-100 
                placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 
                focus:border-emerald-500/50 transition-all resize-none"
            />
            <p className="text-xs text-zinc-500 mt-2">
              Add a custom message to make the invitation more personal
            </p>
          </div>

          {/* What happens next */}
          <div className="px-3 md:px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-emerald-300 mb-2">What happens next?</p>
                <ol className="text-xs text-zinc-300 space-y-1.5 list-decimal list-inside">
                  <li>Client receives email invitation with your message</li>
                  <li>They create a free Wolistic profile (if they don't have one)</li>
                  <li>Once registered, they appear in your client list</li>
                  <li>You can then create routines and track their progress</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSending}
              className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-white/5 border border-white/10 text-zinc-300 text-sm md:text-base font-medium 
                rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50 order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !email.trim()}
              className="flex-1 px-4 md:px-6 py-2.5 md:py-3 bg-emerald-500 text-white text-sm md:text-base font-medium rounded-lg 
                hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {isSending ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending Invitation...
                </>
              ) : (
                <>
                  📧 Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
