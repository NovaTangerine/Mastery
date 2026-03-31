import React, { useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { SessionTracker } from '../types';

interface TrackerCardProps {
  tracker: SessionTracker;
  onAddItem: (trackerId: string, item: string) => void;
  onRemoveItem: (trackerId: string, itemIndex: number) => void;
  onDeleteTracker: (trackerId: string) => void;
}

export const TrackerCard = React.memo(({ tracker, onAddItem, onRemoveItem, onDeleteTracker }: TrackerCardProps) => {
  const [newItemText, setNewItemText] = useState('');

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemText.trim()) return;
    onAddItem(tracker.id, newItemText.trim());
    setNewItemText('');
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-full flex-shrink-0 flex flex-col max-h-[400px]">
      <div className="flex justify-between items-center mb-3 group">
        <h4 className="font-bold text-sm text-zinc-300 uppercase tracking-wider truncate pr-2">{tracker.title}</h4>
        <button 
          onClick={() => onDeleteTracker(tracker.id)}
          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all"
          title="Delete Tracker"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 mb-3 pr-1">
        {tracker.items.map((item, index) => (
          <div key={`${index}-${item}`} className="group flex items-start justify-between bg-zinc-950/50 rounded-lg p-2 text-sm">
            <span className="text-zinc-300 break-words pr-2">{item}</span>
            <button 
              onClick={() => onRemoveItem(tracker.id, index)}
              className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-colors shrink-0 mt-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {tracker.items.length === 0 && (
          <p className="text-zinc-600 text-xs italic py-2 text-center">No items yet</p>
        )}
      </div>

      <form onSubmit={handleAddItem} className="relative mt-auto">
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="Add item..."
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-8 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
        />
        <button 
          type="submit"
          disabled={!newItemText.trim()}
          className="absolute right-1.5 top-1.5 p-1 text-zinc-400 hover:text-zinc-100 disabled:opacity-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
});

TrackerCard.displayName = 'TrackerCard';
