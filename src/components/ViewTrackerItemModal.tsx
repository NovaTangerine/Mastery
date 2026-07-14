import React from 'react';
import { TrackerItem, QuantifierType } from '../types';
import { X, Edit2, Minus, Plus } from 'lucide-react';

interface ViewTrackerItemModalProps {
  item: TrackerItem | string;
  trackerId: string;
  trackerTitle: string;
  onUpdateItem: (trackerId: string, itemId: string, updates: Partial<TrackerItem>) => void;
  onClose: () => void;
}

export const ViewTrackerItemModal: React.FC<ViewTrackerItemModalProps> = ({ item, trackerId, trackerTitle, onUpdateItem, onClose }) => {
  const isString = typeof item === 'string';
  const title = isString ? item : item.title;
  const description = isString ? '' : item.description;
  const quantifierType: QuantifierType = isString ? 'none' : (item.quantifierType || 'none');
  const currentValue = isString ? 0 : (item.currentValue || 0);
  const maxValue = isString ? 0 : (item.maxValue || 10);
  const completed = isString ? false : (item.completed || false);
  const id = isString ? '' : item.id;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">{title}</h2>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Group: {trackerTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0 bg-zinc-950 hover:bg-zinc-800 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {description && (
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
              <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 text-sm text-zinc-300">
                {description}
              </div>
            </div>
          )}

          {!isString && quantifierType !== 'none' && (
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Measurement</label>
              <div className="bg-zinc-950 border border-zinc-800/50 rounded-xl p-4 flex flex-col gap-4">
                
                {quantifierType === 'checkbox' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); onUpdateItem(trackerId, id, { completed: !completed }); }}
                    className="flex items-center gap-3 w-full text-left p-2 -m-2 rounded-lg hover:bg-zinc-900 transition-colors group/checkbox"
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${completed ? 'bg-gradient-to-br from-white to-zinc-400 border-zinc-300 text-zinc-950 shadow-[0_0_12px_rgba(255,255,255,0.15)]' : 'bg-zinc-900 border-zinc-700 text-transparent group-hover/checkbox:border-zinc-500'}`}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <span className={`text-sm ${completed ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>{title}</span>
                  </button>
                )}

                {quantifierType === 'stepper' && (
                  <div className="flex items-center justify-between gap-4 w-full">
                    <span className="text-sm font-medium text-zinc-100">{title}</span>
                    <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-lg shrink-0 border border-zinc-800/50">
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdateItem(trackerId, id, { currentValue: Math.max(0, currentValue - 1) })}}
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <div className="min-w-[1.5rem] text-center text-xs font-bold text-zinc-300">
                        {currentValue}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdateItem(trackerId, id, { currentValue: currentValue + 1 })}}
                        className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}

                {quantifierType === 'progress' && (
                  <div className="w-full flex items-center gap-3">
                    <span className="text-sm font-medium text-zinc-100 shrink-0">{title}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onUpdateItem(trackerId, id, { currentValue: Math.min(maxValue || 100, currentValue + Math.max(1, Math.floor((maxValue || 100) / 10))) })}}
                      className="w-full relative h-6 bg-zinc-900/80 rounded-full overflow-hidden border border-zinc-800/50"
                    >
                      <div 
                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-zinc-200 to-zinc-400 transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, (currentValue / (maxValue || 100)) * 100))}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-zinc-300 z-10 w-full mix-blend-screen mix-blend-plus-lighter pointer-events-none">
                        {currentValue} {maxValue > 0 ? `/ ${maxValue}` : ''}
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
              // Non-functional for now, as requested
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
