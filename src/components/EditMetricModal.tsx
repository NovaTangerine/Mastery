import React, { useState } from 'react';
import { SessionMetric, MeasurementType } from '../types';
import { CheckSquare, Hash, Target, X } from 'lucide-react';

interface EditMetricModalProps {
  metric: SessionMetric;
  existingGroups?: string[];
  onUpdate: (metricId: string, updates: Partial<SessionMetric>) => void;
  onClose: () => void;
}

export const EditMetricModal: React.FC<EditMetricModalProps> = ({ metric, existingGroups = [], onUpdate, onClose }) => {
  const [title, setTitle] = useState(metric.title);
  const [description, setDescription] = useState(metric.description || '');
  const [group, setGroup] = useState(metric.group || '');
  const [showGroupSuggestions, setShowGroupSuggestions] = useState(false);
  const [isMeasured, setIsMeasured] = useState(metric.measurementType !== 'none');
  const [measurementType, setMeasurementType] = useState<MeasurementType>(
    metric.measurementType !== 'none' ? metric.measurementType : 'counter'
  );
  const [targetCount, setTargetCount] = useState<number | ''>(metric.targetCount ?? '');

  const filteredGroups = existingGroups.filter(
    g => g.toLowerCase().includes(group.toLowerCase()) && g.toLowerCase() !== group.toLowerCase()
  );

  const handleSave = () => {
    if (!title.trim()) return;

    const updates: Partial<SessionMetric> = {
      title: title.trim(),
      description: description.trim() || undefined,
      group: group.trim() || undefined,
      measurementType: isMeasured ? measurementType : 'none',
    };

    if (isMeasured) {
      if (measurementType === 'counter') {
        updates.currentCount = metric.currentCount ?? 0;
        updates.targetCount = targetCount !== '' ? Number(targetCount) : undefined;
      } else if (measurementType === 'progress') {
        updates.currentValue = metric.currentValue ?? 0;
      } else if (measurementType === 'checkbox') {
        updates.completed = metric.completed ?? false;
      }
    }

    onUpdate(metric.id, updates);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-bold text-zinc-100 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 rounded-lg px-2 py-1 -ml-2 w-full"
            placeholder="Tracker Name"
          />
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Group Tag</label>
            <div className="relative">
              <input
                type="text"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                onFocus={() => setShowGroupSuggestions(true)}
                onBlur={() => setTimeout(() => setShowGroupSuggestions(false), 200)}
                placeholder="e.g., Hidden Packages"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50"
              />
              {showGroupSuggestions && filteredGroups.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden shadow-xl max-h-40 overflow-y-auto">
                  {filteredGroups.map(g => (
                    <button
                      key={g}
                      type="button"
                      className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 transition-colors border-b border-zinc-700/50 last:border-0"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setGroup(g);
                        setShowGroupSuggestions(false);
                      }}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional notes..."
              rows={3}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50 resize-none"
            />
          </div>

          <div className="border-t border-zinc-800/50 pt-4">
            <label className="flex items-center gap-3 cursor-pointer mb-4">
              <input 
                type="checkbox"
                checked={isMeasured}
                onChange={(e) => setIsMeasured(e.target.checked)}
                className="w-5 h-5 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500/50 focus:ring-offset-zinc-900" 
              />
              <span className="text-sm font-medium text-zinc-300 select-none">Measure this tracker</span>
            </label>

            {isMeasured && (
              <div className="space-y-4 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMeasurementType('counter')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${measurementType === 'counter' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'}`}
                  >
                    <Hash className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Counter</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setMeasurementType('checkbox')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${measurementType === 'checkbox' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'}`}
                  >
                    <CheckSquare className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Checkbox</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMeasurementType('progress')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${measurementType === 'progress' ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'}`}
                  >
                    <Target className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Progress</span>
                  </button>
                </div>
                
                {measurementType === 'counter' && (
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Target Goal (Optional)</label>
                    <input
                      type="number"
                      min="1"
                      value={targetCount}
                      onChange={(e) => setTargetCount(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      placeholder="e.g., 3"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/50"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800/50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 text-sm font-bold bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl transition-colors shadow-lg"
          >
            Save Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
