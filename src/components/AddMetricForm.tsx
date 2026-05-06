import React, { useState } from 'react';
import { CheckSquare, Hash, Target, ChevronDown, Check, X, Plus } from 'lucide-react';
import { SessionMetric, MeasurementType } from '../types';

interface AddMetricFormProps {
  onAddMetric: (metric: Omit<SessionMetric, 'id'>) => Promise<string | undefined>;
  onCancel: () => void;
  onSuccess: (metricId: string) => void;
}

export const AddMetricForm: React.FC<AddMetricFormProps> = ({ onAddMetric, onCancel, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const newMetric: Omit<SessionMetric, 'id'> = {
        title: title.trim(),
        measurementType: 'none',
      };
      
      const newId = await onAddMetric(newMetric);
      if (newId) {
        onSuccess(newId);
      } else {
        onCancel();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2 flex flex-col animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden focus-within:border-indigo-500/50 transition-colors">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tracker Name (e.g., Hidden Packages)"
          className="flex-1 bg-transparent px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
          autoFocus
        />
        <button
          type="button"
          onClick={onCancel}
          className="px-3 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="px-3 bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 transition-colors flex items-center justify-center font-bold text-xs"
          title="Create Tracker"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
};
