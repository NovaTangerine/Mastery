import React from 'react';
import { SessionMetric } from '../types';
import { Check, Edit2, Minus, Plus, Trash2, Hash, Target, CheckSquare } from 'lucide-react';

interface MetricCardProps {
  metric: SessionMetric;
  onUpdate: (metricId: string, updates: Partial<SessionMetric>) => void;
  onDelete: (metricId: string) => void;
  onEdit: (metricId: string) => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric, onUpdate, onDelete, onEdit }) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 group/metric relative overflow-hidden transition-colors hover:border-zinc-700">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 pr-14">
          <h4 className="font-bold text-sm text-zinc-100 truncate">{metric.title}</h4>
          {metric.description && (
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{metric.description}</p>
          )}
        </div>
        
        <div className="absolute right-3 top-3 opacity-0 group-hover/metric:opacity-100 flex items-center gap-1 transition-opacity">
          <button 
            onClick={() => onEdit(metric.id)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-indigo-400 hover:bg-zinc-800 transition-all"
            title="Edit Tracker"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => onDelete(metric.id)}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-all"
            title="Delete Tracker"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {metric.measurementType !== 'none' && (
        <div className="pt-2 border-t border-zinc-800/50 flex items-center justify-between">
          
          {metric.measurementType === 'counter' && (
            <div className="flex flex-col gap-3 w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 text-zinc-400 bg-zinc-950 px-2 py-1 rounded-md">
                  <Hash className="w-3.5 h-3.5" />
                  <span className="text-xs font-mono font-medium">
                    {metric.currentCount ?? 0}
                    {metric.targetCount ? ` / ${metric.targetCount}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg">
                  <button
                    onClick={() => onUpdate(metric.id, { currentCount: Math.max(0, (metric.currentCount ?? 0) - 1) })}
                    className="w-7 h-7 rounded bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <div className="w-8 text-center text-sm font-bold text-zinc-300">
                    {metric.currentCount ?? 0}
                  </div>
                  <button
                    onClick={() => onUpdate(metric.id, { currentCount: (metric.currentCount ?? 0) + 1 })}
                    className="w-7 h-7 rounded bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Array.from({ length: metric.targetCount || Math.max(5, metric.currentCount ?? 0) }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-2 h-2 rounded-full transition-colors ${i < (metric.currentCount ?? 0) ? 'bg-indigo-500' : 'bg-zinc-800'}`}
                  />
                ))}
              </div>
            </div>
          )}

          {metric.measurementType === 'checkbox' && (
            <button
              onClick={() => onUpdate(metric.id, { completed: !metric.completed })}
              className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-xl transition-all border ${metric.completed ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900'}`}
            >
              {metric.completed ? <Check className="w-4 h-4" /> : <div className="w-4 h-4 rounded-sm border-2 border-zinc-600" />}
              <span className="text-xs font-bold uppercase tracking-wider">{metric.completed ? 'Completed' : 'Mark Complete'}</span>
            </button>
          )}

          {metric.measurementType === 'progress' && (
            <div className="w-full flex items-center gap-3">
              <button 
                onClick={() => onUpdate(metric.id, { currentValue: Math.min(100, (metric.currentValue ?? 0) + 10) })}
                className="w-full relative h-6 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800"
              >
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-indigo-500/50 transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, metric.currentValue ?? 0))}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-300 z-10 w-full mix-blend-screen mix-blend-plus-lighter">
                  {metric.currentValue ?? 0}%
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
