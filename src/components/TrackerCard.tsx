import React, { useState } from 'react';
import { Plus, X, Trash2, CheckSquare, Square, Minus, ChevronDown, ChevronRight } from 'lucide-react';
import { SessionTracker, TrackerItem, QuantifierType } from '../types';

interface TrackerCardProps {
  tracker: SessionTracker;
  onAddItem: (trackerId: string, item: TrackerItem | string) => void;
  onUpdateItem: (trackerId: string, itemId: string, updates: Partial<TrackerItem>) => void;
  onRemoveItem: (trackerId: string, itemId: string | number) => void;
  onDeleteTracker: (trackerId: string) => void;
}

const TrackerItemRow = ({ 
  item, 
  index, 
  trackerId, 
  onUpdateItem, 
  onRemoveItem 
}: { 
  item: TrackerItem | string, 
  index: number, 
  trackerId: string, 
  onUpdateItem: (trackerId: string, itemId: string, updates: Partial<TrackerItem>) => void,
  onRemoveItem: (trackerId: string, itemId: string | number) => void
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Handle legacy string items
  if (typeof item === 'string') {
    return (
      <div className="group flex items-start justify-between bg-zinc-950/50 rounded-lg p-2 text-sm">
        <span className="text-zinc-300 break-words pr-2">{item}</span>
        <button 
          onClick={() => onRemoveItem(trackerId, index)}
          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-colors shrink-0 mt-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const handleIncrement = () => {
    if (item.quantifierType === 'progress' || item.quantifierType === 'stepper') {
      const current = item.currentValue || 0;
      const max = item.maxValue || 100;
      if (current < max) {
        onUpdateItem(trackerId, item.id, { currentValue: current + 1 });
      }
    }
  };

  const handleDecrement = () => {
    if (item.quantifierType === 'progress' || item.quantifierType === 'stepper') {
      const current = item.currentValue || 0;
      if (current > 0) {
        onUpdateItem(trackerId, item.id, { currentValue: current - 1 });
      }
    }
  };

  const toggleCheckbox = () => {
    if (item.quantifierType === 'checkbox') {
      onUpdateItem(trackerId, item.id, { completed: !item.completed });
    }
  };

  return (
    <div className="group flex flex-col bg-zinc-950/50 rounded-lg p-2 text-sm transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {item.description && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-0.5 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
          
          {item.quantifierType === 'checkbox' && (
            <button onClick={toggleCheckbox} className="mt-0.5 text-zinc-400 hover:text-zinc-100 shrink-0">
              {item.completed ? <CheckSquare className="w-4 h-4 text-emerald-500" /> : <Square className="w-4 h-4" />}
            </button>
          )}

          <div className="flex flex-col flex-1 min-w-0">
            <span className={`text-zinc-300 break-words pr-2 ${item.quantifierType === 'checkbox' && item.completed ? 'line-through opacity-50' : ''}`}>
              {item.title}
            </span>
            
            {/* Progress Bar */}
            {item.quantifierType === 'progress' && (
              <div className="flex items-center gap-2 mt-2 pr-2">
                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${((item.currentValue || 0) / (item.maxValue || 100)) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={handleDecrement} className="p-0.5 bg-zinc-800 rounded hover:bg-zinc-700 text-zinc-400">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs text-zinc-500 w-8 text-center">{item.currentValue || 0}/{item.maxValue || 100}</span>
                  <button onClick={handleIncrement} className="p-0.5 bg-zinc-800 rounded hover:bg-zinc-700 text-zinc-400">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Stepper */}
            {item.quantifierType === 'stepper' && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap pr-2">
                {Array.from({ length: item.maxValue || 5 }).map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-2 h-2 rounded-full transition-colors ${i < (item.currentValue || 0) ? 'bg-emerald-500' : 'bg-zinc-800'}`}
                  />
                ))}
                <div className="flex items-center gap-1 ml-auto shrink-0">
                  <button onClick={handleDecrement} className="p-0.5 bg-zinc-800 rounded hover:bg-zinc-700 text-zinc-400">
                    <Minus className="w-3 h-3" />
                  </button>
                  <button onClick={handleIncrement} className="p-0.5 bg-zinc-800 rounded hover:bg-zinc-700 text-zinc-400">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={() => onRemoveItem(trackerId, item.id)}
          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-colors shrink-0 mt-0.5 ml-2"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Expandable Description */}
      {item.description && (
        <div className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-40 mt-2 opacity-100' : 'max-h-0 opacity-0'}`}>
          <p className="text-xs text-zinc-500 pl-6 pr-2 italic">{item.description}</p>
        </div>
      )}
    </div>
  );
};

export const TrackerCard = React.memo(({ tracker, onAddItem, onUpdateItem, onRemoveItem, onDeleteTracker }: TrackerCardProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [quantifierType, setQuantifierType] = useState<QuantifierType>('none');
  const [maxValue, setMaxValue] = useState(10);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;
    
    const newItem: TrackerItem = {
      id: crypto.randomUUID(),
      title: newItemTitle.trim(),
      quantifierType,
      ...(newItemDesc.trim() ? { description: newItemDesc.trim() } : {}),
      ...(quantifierType === 'progress' || quantifierType === 'stepper' ? { currentValue: 0, maxValue } : {}),
      ...(quantifierType === 'checkbox' ? { completed: false } : {})
    };

    onAddItem(tracker.id, newItem);
    
    // Reset form
    setNewItemTitle('');
    setNewItemDesc('');
    setQuantifierType('none');
    setMaxValue(10);
    setIsAdding(false);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 w-full flex-shrink-0 flex flex-col max-h-[500px]">
      <div className="flex justify-between items-center mb-3 group">
        <h4 className="font-bold text-sm text-zinc-300 uppercase tracking-wider truncate pr-2">{tracker.title}</h4>
        <div className="flex items-center gap-1">
          {!isAdding && (
            <button 
              onClick={() => setIsAdding(true)}
              className="p-1 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-all"
              title="Add Item"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => onDeleteTracker(tracker.id)}
            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all"
            title="Delete Tracker"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 mb-3 pr-1">
        {tracker.items.map((item, index) => (
          <TrackerItemRow 
            key={typeof item === 'string' ? `${index}-${item}` : item.id}
            item={item}
            index={index}
            trackerId={tracker.id}
            onUpdateItem={onUpdateItem}
            onRemoveItem={onRemoveItem}
          />
        ))}
        {tracker.items.length === 0 && (
          <p className="text-zinc-600 text-xs italic py-2 text-center">No items yet</p>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddItem} className="mt-auto bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Item title..."
            autoFocus
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
          />
          <input
            type="text"
            value={newItemDesc}
            onChange={(e) => setNewItemDesc(e.target.value)}
            placeholder="Description (optional)..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-zinc-500 transition-colors text-zinc-400"
          />
          
          <div className="flex items-center gap-2">
            <select 
              value={quantifierType}
              onChange={(e) => setQuantifierType(e.target.value as QuantifierType)}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-zinc-500 flex-1"
            >
              <option value="none">Simple List</option>
              <option value="checkbox">Checkbox</option>
              <option value="progress">Progress Bar</option>
              <option value="stepper">Stepper Dots</option>
            </select>

            {(quantifierType === 'progress' || quantifierType === 'stepper') && (
              <input
                type="number"
                min="1"
                value={maxValue}
                onChange={(e) => setMaxValue(parseInt(e.target.value) || 1)}
                className="w-16 bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-zinc-500 text-center"
                title="Max Value"
              />
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button 
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!newItemTitle.trim()}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              Add Item
            </button>
          </div>
        </form>
      )}
    </div>
  );
});

TrackerCard.displayName = 'TrackerCard';
