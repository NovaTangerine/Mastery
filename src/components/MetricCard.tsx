import React, { useState, useRef, useEffect } from 'react';
import { SessionMetric } from '../types';
import { Check, Edit2, Minus, Plus, Trash2, Hash, Target, CheckSquare, MoreVertical } from 'lucide-react';

interface MetricCardProps {
  metric: SessionMetric;
  onUpdate: (metricId: string, updates: Partial<SessionMetric>) => void;
  onDelete: (metricId: string) => void;
  onEdit: (metricId: string) => void;
  activeTappedId?: string | null;
  onTap?: (id: string) => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({ metric, onUpdate, onDelete, onEdit, activeTappedId, onTap }) => {
  const isTapped = activeTappedId === metric.id;
  const handleTap = () => onTap?.(metric.id);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  if (metric.measurementType === 'checkbox') {
    return (
      <div 
        className={`relative bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex items-center justify-between gap-4 group/metric transition-colors hover:border-zinc-700 cursor-default ${isMenuOpen ? 'z-50' : 'z-auto'}`}
        onClick={handleTap}
      >
        <div className="flex-1 min-w-0">
          <h4 className={`font-bold text-sm transition-colors ${metric.completed ? 'text-zinc-500 line-through decoration-zinc-700' : 'text-zinc-100'}`}>
            {metric.title}
          </h4>
          {metric.description && !metric.completed && (
            <p className="text-[10px] text-zinc-600 truncate mt-0.5">{metric.description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={menuRef}>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setIsMenuOpen(!isMenuOpen);
              }}
              className={`p-1 rounded-md transition-all ${isMenuOpen ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800'} ${isTapped || isMenuOpen ? 'opacity-100' : 'opacity-0 lg:group-hover/metric:opacity-100'}`}
              title="More Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50 py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(metric.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800 flex items-center transition-colors gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Tracker
                </button>
                <div className="h-px bg-zinc-800 my-1 font-bold" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(metric.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-red-500 font-medium hover:bg-zinc-800 flex items-center transition-colors gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Tracker
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate(metric.id, { completed: !metric.completed }); }}
            className={`w-5 h-5 rounded flex items-center justify-center transition-all border shrink-0 ${
              metric.completed 
                ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_8px_rgba(59,130,246,0.25)]' 
                : 'bg-zinc-950 border-zinc-800 text-zinc-700 hover:border-zinc-600'
            }`}
          >
            {metric.completed ? (
              <Check className="w-3.5 h-3.5 stroke-[3px]" />
            ) : (
              <div className="w-3.5 h-3.5 rounded-sm" />
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 group/metric transition-colors hover:border-zinc-700 cursor-default ${isMenuOpen ? 'z-50' : 'z-auto'}`}
      onClick={handleTap}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 pr-14">
          <h4 className="font-bold text-sm text-zinc-100 truncate">{metric.title}</h4>
          {metric.description && (
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{metric.description}</p>
          )}
        </div>
        
        <div className={`absolute right-3 top-3 flex items-center gap-1 transition-opacity ${isTapped || isMenuOpen ? 'opacity-100' : 'opacity-0 lg:group-hover/metric:opacity-100'}`}>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={(e) => { 
                e.stopPropagation(); 
                setIsMenuOpen(!isMenuOpen);
              }}
              className={`p-1.5 rounded-lg transition-all ${isMenuOpen ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800'}`}
              title="More Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50 py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(metric.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-zinc-300 hover:bg-zinc-800 flex items-center transition-colors gap-2"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Tracker
                </button>
                <div className="h-px bg-zinc-800 my-1 font-bold" />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(metric.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs text-red-500 font-medium hover:bg-zinc-800 flex items-center transition-colors gap-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Tracker
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {metric.measurementType !== 'none' && (
        <div className="pt-2 border-t border-zinc-800/50 flex items-center justify-between">
          
          {metric.measurementType === 'visual_counter' && (
            <div className="flex items-center gap-1.5 w-full flex-wrap">
              {Array.from({ length: metric.targetCount || Math.max(5, metric.currentCount ?? 0) }).map((_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full transition-colors ${i < (metric.currentCount ?? 0) ? 'bg-blue-500' : 'bg-zinc-800'}`}
                />
              ))}
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg ml-auto shrink-0">
                <button
                  onClick={() => onUpdate(metric.id, { currentCount: Math.max(0, (metric.currentCount ?? 0) - 1) })}
                  className="w-7 h-7 rounded bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="min-w-[2rem] px-2 text-center text-sm font-bold text-zinc-300">
                  {metric.currentCount ?? 0}
                  {metric.targetCount ? ` / ${metric.targetCount}` : ''}
                </div>
                <button
                  onClick={() => onUpdate(metric.id, { currentCount: (metric.currentCount ?? 0) + 1 })}
                  className="w-7 h-7 rounded bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {metric.measurementType === 'numeric_counter' && (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg ml-auto">
                <button
                  onClick={() => onUpdate(metric.id, { currentCount: Math.max(0, (metric.currentCount ?? 0) - 1) })}
                  className="w-7 h-7 rounded bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="min-w-[2rem] px-2 text-center text-sm font-bold text-zinc-300">
                  {metric.currentCount ?? 0}
                  {metric.targetCount ? ` / ${metric.targetCount}` : ''}
                </div>
                <button
                  onClick={() => onUpdate(metric.id, { currentCount: (metric.currentCount ?? 0) + 1 })}
                  className="w-7 h-7 rounded bg-zinc-900 hover:bg-zinc-800 flex items-center justify-center text-zinc-400 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {metric.measurementType === 'progress' && (
            <div className="w-full flex items-center gap-3">
              <button 
                onClick={() => onUpdate(metric.id, { currentValue: Math.min(100, (metric.currentValue ?? 0) + 10) })}
                className="w-full relative h-6 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800"
              >
                <div 
                  className="absolute left-0 top-0 bottom-0 bg-blue-500/50 transition-all duration-300"
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
