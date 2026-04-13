import React, { useState, useEffect, useMemo } from 'react';

interface ClientDetailsFormData {
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  goals?: string;
}

interface ClientDetailsFormProps {
  clientId: number;
  clientName: string;
  initialData?: ClientDetailsFormData;
  onSave: (data: ClientDetailsFormData) => void;
  onCancel: () => void;
}

export function ClientDetailsForm({ 
  clientId, 
  clientName, 
  initialData, 
  onSave, 
  onCancel 
}: ClientDetailsFormProps) {
  const [age, setAge] = useState<string>(initialData?.age?.toString() || '');
  const [heightCm, setHeightCm] = useState<string>(initialData?.height_cm?.toString() || '');
  const [weightKg, setWeightKg] = useState<string>(initialData?.weight_kg?.toString() || '');
  const [goals, setGoals] = useState<string>(initialData?.goals || '');
  const [isSaving, setIsSaving] = useState(false);

  // Calculate BMI
  const bmi = useMemo(() => {
    const height = parseFloat(heightCm);
    const weight = parseFloat(weightKg);
    
    if (height > 0 && weight > 0) {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  }, [heightCm, weightKg]);

  const getBMICategory = (bmiValue: string | null) => {
    if (!bmiValue) return null;
    const bmiNum = parseFloat(bmiValue);
    if (bmiNum < 18.5) return { label: 'Underweight', color: 'text-blue-400' };
    if (bmiNum < 25) return { label: 'Normal', color: 'text-emerald-400' };
    if (bmiNum < 30) return { label: 'Overweight', color: 'text-amber-400' };
    return { label: 'Obese', color: 'text-red-400' };
  };

  const bmiCategory = getBMICategory(bmi);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    onSave({
      age: age ? parseInt(age) : undefined,
      height_cm: heightCm ? parseFloat(heightCm) : undefined,
      weight_kg: weightKg ? parseFloat(weightKg) : undefined,
      goals: goals || undefined
    });
    setIsSaving(false);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-zinc-100 mb-2">
          Client Details
        </h3>
        <p className="text-sm text-zinc-400">
          Physical metrics and goals for {clientName}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Age (years)
          </label>
          <input
            type="number"
            min="10"
            max="100"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="e.g., 28"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-zinc-100 
              placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 
              focus:border-emerald-500/50 transition-all"
          />
        </div>

        {/* Height */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Height (cm)
          </label>
          <input
            type="number"
            min="100"
            max="250"
            step="0.1"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            placeholder="e.g., 175"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-zinc-100 
              placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 
              focus:border-emerald-500/50 transition-all"
          />
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Weight (kg)
          </label>
          <input
            type="number"
            min="30"
            max="300"
            step="0.1"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="e.g., 70"
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-zinc-100 
              placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 
              focus:border-emerald-500/50 transition-all"
          />
        </div>

        {/* BMI Display (auto-calculated) */}
        {bmi && (
          <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">
                  BMI (Auto-calculated)
                </p>
                <p className="text-2xl font-bold text-zinc-100">{bmi}</p>
              </div>
              {bmiCategory && (
                <div className="text-right">
                  <p className="text-xs text-zinc-400 uppercase tracking-wider mb-1">Category</p>
                  <p className={`text-sm font-semibold ${bmiCategory.color}`}>
                    {bmiCategory.label}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Goals */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Goals & Notes
          </label>
          <textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="e.g., Build muscle mass, improve endurance, lose 5kg in 3 months..."
            rows={4}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-zinc-100 
              placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 
              focus:border-emerald-500/50 transition-all resize-none"
          />
          <p className="text-xs text-zinc-500 mt-2">
            Optional: Track client's fitness objectives and preferences
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-zinc-300 font-medium 
              rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 px-6 py-3 bg-emerald-500 text-white font-medium rounded-lg 
              hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Details'}
          </button>
        </div>
      </form>
    </div>
  );
}
