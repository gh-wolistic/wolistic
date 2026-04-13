import React, { useState } from 'react';
import { Client } from '@/types/routines';
import { StatusBadge } from './StatusBadge';
import { ClientDetailsForm } from './ClientDetailsForm';

interface ClientProfileSidebarProps {
  client: Client;
}

export function ClientProfileSidebar({ client }: ClientProfileSidebarProps) {
  const [medicalExpanded, setMedicalExpanded] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);

  const hasClientDetails = client.client_details && (
    client.client_details.age || 
    client.client_details.height_cm || 
    client.client_details.weight_kg
  );

  const handleSaveClientDetails = (data: any) => {
    console.log('Saving client details:', data);
    // TODO: API call to save client details
    setIsEditingDetails(false);
  };

  return (
    <div className="space-y-4">
      {/* Client Profile Card */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col items-center mb-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 
            flex items-center justify-center text-white font-bold text-2xl ring-4 ring-emerald-500/30 mb-3">
            {client.initials}
          </div>
          <h3 className="text-lg font-semibold text-zinc-100 mb-2">
            {client.name}
          </h3>
          <StatusBadge status={client.status} />
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-start gap-2">
            <span className="text-zinc-400 text-sm">📧</span>
            <a href={`mailto:${client.email}`} className="text-sm text-zinc-300 hover:text-emerald-400 transition-colors">
              {client.email}
            </a>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-zinc-400 text-sm">📱</span>
            <a href={`tel:${client.phone}`} className="text-sm text-zinc-300 hover:text-emerald-400 transition-colors">
              {client.phone}
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 
            text-sm font-medium rounded-lg hover:bg-emerald-500/20 transition-colors">
            View Messages
          </button>
          <button className="px-4 py-2 bg-white/5 border border-white/10 text-zinc-300 
            text-sm font-medium rounded-lg hover:bg-white/10 transition-colors">
            Send Email
          </button>
        </div>
      </div>

      {/* Goals & Preferences */}
      {(client.goals || client.preferences) && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <h4 className="text-sm font-semibold text-zinc-100 mb-3">🎯 Client Goals</h4>
          
          {client.goals && (
            <div className="mb-4">
              <p className="text-base text-zinc-100 mb-2">{client.goals}</p>
            </div>
          )}

          {client.preferences && (
            <div>
              <div className="text-xs text-zinc-400 uppercase tracking-wide mb-2">Preferences:</div>
              <p className="text-sm text-zinc-300">{client.preferences}</p>
            </div>
          )}
        </div>
      )}

      {/* Client Details (Physical Metrics) */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        {!isEditingDetails ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-zinc-100">📊 Physical Metrics</h4>
              <button
                onClick={() => setIsEditingDetails(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                {hasClientDetails ? 'Edit' : '+ Add Details'}
              </button>
            </div>

            {hasClientDetails ? (
              <div className="space-y-3">
                {client.client_details?.age && (
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-sm text-zinc-400">Age</span>
                    <span className="text-sm font-medium text-zinc-100">
                      {client.client_details.age} years
                    </span>
                  </div>
                )}
                {client.client_details?.height_cm && (
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-sm text-zinc-400">Height</span>
                    <span className="text-sm font-medium text-zinc-100">
                      {client.client_details.height_cm} cm
                    </span>
                  </div>
                )}
                {client.client_details?.weight_kg && (
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="text-sm text-zinc-400">Weight</span>
                    <span className="text-sm font-medium text-zinc-100">
                      {client.client_details.weight_kg} kg
                    </span>
                  </div>
                )}
                {client.client_details?.bmi && (
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-zinc-400">BMI</span>
                    <span className="text-sm font-medium text-emerald-400">
                      {client.client_details.bmi}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="text-4xl mb-3 opacity-30">📏</div>
                <p className="text-sm text-zinc-400 mb-3">
                  No physical metrics added yet
                </p>
                <button
                  onClick={() => setIsEditingDetails(true)}
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Add age, height, weight →
                </button>
              </div>
            )}
          </>
        ) : (
          <ClientDetailsForm
            clientId={client.id}
            clientName={client.name}
            initialData={client.client_details}
            onSave={handleSaveClientDetails}
            onCancel={() => setIsEditingDetails(false)}
          />
        )}
      </div>

      {/* Medical & Requirements (collapsible) */}
      {(client.medical_history || client.dietary_requirements) && (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <button
            onClick={() => setMedicalExpanded(!medicalExpanded)}
            className="w-full flex items-center justify-between text-sm font-semibold text-zinc-100 mb-3"
          >
            <span>🏥 Health Considerations</span>
            <span className="text-zinc-400">{medicalExpanded ? '▲' : '▼'}</span>
          </button>
          
          {medicalExpanded && (
            <div className="space-y-4 mt-4">
              {client.medical_history && (
                <div>
                  <div className="text-xs text-zinc-400 uppercase tracking-wide mb-2">
                    Medical History:
                  </div>
                  <p className="text-sm text-zinc-300">{client.medical_history}</p>
                </div>
              )}

              {client.dietary_requirements && (
                <div>
                  <div className="text-xs text-zinc-400 uppercase tracking-wide mb-2">
                    Other Requirements:
                  </div>
                  <p className="text-sm text-zinc-300">{client.dietary_requirements}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Notes (Expert only) */}
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
        <h4 className="text-sm font-semibold text-zinc-100 mb-3">📝 Private Notes</h4>
        <textarea
          placeholder="Add notes visible only to you..."
          rows={4}
          className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg 
            text-sm text-zinc-100 placeholder:text-zinc-500
            focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20
            resize-none"
        />
      </div>
    </div>
  );
}
