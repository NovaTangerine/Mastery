import React from 'react';
import { SessionMetric } from '../types';
import { X, Edit2, Minus, Plus } from 'lucide-react';

interface ViewMetricModalProps {
  metric: SessionMetric;
  onClose: () => void;
  onEdit: (metricId: string) => void;
  onUpdate: (metricId: string, updates: Partial<SessionMetric>) => void;
}

export const ViewMetricModal: React.FC<ViewMetricModalProps> = ({ metric, onClose, onEdit, onUpdate }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">{metric.title}</h2>
            {metric.group && (
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Group: {metric.group}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 bg-zinc-950 hover:bg-zinc-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {metric.description && (
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
              <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 text-sm text-zinc-300 whitespace-pre-wrap">
                {metric.description}
              </div>
            </div>
          )}

          {metric.measurementType !== 'none' && (
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Measurement</label>
              <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 flex flex-col gap-4">
                {metric.measurementType === 'checkbox' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onUpdate(metric.id, { completed: !metric.completed }); }}
                    className="flex items-center gap-3 w-full text-left p-2 -m-2 rounded-lg hover:bg-zinc-900 transition-colors group/checkbox"
                  >
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all ${metric.completed ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_8px_rgba(59,130,246,0.25)]' : 'bg-zinc-900/50 border-zinc-700/50 text-transparent group-hover/checkbox:border-zinc-500'}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className={`text-sm font-semibold truncate transition-colors ${metric.completed ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>{metric.title}</span>
                  </button>
                )}

                {metric.measurementType === 'numeric_counter' && (
                  <div className="flex items-center justify-between gap-4 w-full">
                    <span className="text-sm font-medium text-zinc-100">{metric.title}</span>
                    <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg shrink-0 border border-zinc-800/50">
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdate(metric.id, { currentCount: Math.max(0, (metric.currentCount ?? 0) - 1) })}}
                        className="w-6 h-6 rounded bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <div className="min-w-[2rem] text-center text-sm font-bold text-zinc-300">
                        {metric.currentCount ?? 0}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdate(metric.id, { currentCount: (metric.currentCount ?? 0) + 1 })}}
                        className="w-6 h-6 rounded bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {metric.measurementType === 'visual_counter' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 w-full flex-wrap justify-center bg-zinc-900/50 p-4 rounded-xl border border-zinc-800/50">
                      {Array.from({ length: metric.targetCount || Math.max(5, metric.currentCount ?? 0) }).map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-3 h-3 rounded-full transition-colors ${i < (metric.currentCount ?? 0) ? 'bg-blue-500' : 'bg-zinc-800'}`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between gap-4 w-full">
                      <span className="text-sm font-medium text-zinc-100">{metric.title}</span>
                      <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg shrink-0 border border-zinc-800/50">
                        <button
                          onClick={(e) => { e.stopPropagation(); onUpdate(metric.id, { currentCount: Math.max(0, (metric.currentCount ?? 0) - 1) })}}
                          className="w-6 h-6 rounded bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <div className="min-w-[2.5rem] text-center text-sm font-bold text-zinc-300">
                          {metric.currentCount ?? 0}
                          {metric.targetCount ? ` / ${metric.targetCount}` : ''}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onUpdate(metric.id, { currentCount: (metric.currentCount ?? 0) + 1 })}}
                          className="w-6 h-6 rounded bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {metric.measurementType === 'progress' && (
                  <div className="w-full flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-100 shrink-0">{metric.title}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onUpdate(metric.id, { currentValue: Math.min(100, (metric.currentValue ?? 0) + 10) })}}
                      className="w-full relative h-6 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800"
                    >
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-blue-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, metric.currentValue ?? 0))}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-300 z-10 w-full mix-blend-screen mix-blend-plus-lighter pointer-events-none">
                        {metric.currentValue ?? 0}%
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-zinc-800/50">
          <button
            onClick={() => {
              onClose();
              onEdit(metric.id);
            }}
            className="px-5 py-2.5 text-sm font-bold bg-zinc-100 hover:bg-white text-zinc-950 rounded-xl transition-colors shadow-lg flex items-center gap-2"
          >
            <Edit2 className="w-4 h-4" />
            Edit Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
