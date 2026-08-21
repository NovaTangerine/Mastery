import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, X, Trash2, Check, Minus, ChevronDown, ChevronRight, MoreVertical, Edit2 } from 'lucide-react';
import { SessionTracker, TrackerItem, QuantifierType } from '../types';
import { TagAutocompleteInput } from './TagAutocompleteInput';
import { useFloating, offset, flip, shift, autoUpdate, FloatingPortal } from '@floating-ui/react';

interface TrackerCardProps {
  tracker: SessionTracker;
  onAddItem: (trackerId: string, item: TrackerItem | string) => void;
  onUpdateItem: (trackerId: string, itemId: string, updates: Partial<TrackerItem>) => void;
  onRemoveItem: (trackerId: string, itemId: string | number) => void;
  onUpdateTracker: (trackerId: string, title: string) => void;
  onDeleteTracker: (trackerId: string) => void;
  onViewItem?: (trackerId: string, item: TrackerItem | string) => void;
  itemSuggestions?: string[];
}

const TrackerItemRow = ({ 
  item, 
  index, 
  trackerId, 
  onUpdateItem, 
  onRemoveItem,
  onViewItem
}: { 
  item: TrackerItem | string, 
  index: number, 
  trackerId: string, 
  onUpdateItem: (trackerId: string, itemId: string, updates: Partial<TrackerItem>) => void,
  onRemoveItem: (trackerId: string, itemId: string | number) => void,
  onViewItem: (trackerId: string, item: TrackerItem | string) => void
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const itemIdString = typeof item === 'string' ? `${trackerId}-item-${index}` : item.id;

  // Handle legacy string items
  if (typeof item === 'string') {
    return (
      <div 
        className="group flex items-start justify-between bg-zinc-950/50 rounded-lg p-2 text-sm cursor-pointer hover:bg-zinc-900/50 transition-colors"
        onClick={() => onViewItem(trackerId, item)}
      >
        <span className="text-zinc-300 break-words pr-2">{item}</span>
        <button 
          onClick={(e) => { e.stopPropagation(); onRemoveItem(trackerId, index); }}
          className="text-zinc-600 hover:text-red-400 transition-colors shrink-0 mt-0.5 opacity-0 lg:group-hover:opacity-100"
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
    <div 
      className="group flex flex-col bg-zinc-950/50 rounded-lg p-2 text-sm transition-all cursor-pointer hover:bg-zinc-900/50"
      onClick={() => onViewItem(trackerId, item)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          {item.description && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="mt-0.5 text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          )}
          
          {item.quantifierType === 'checkbox' && (
            <button 
              onClick={(e) => { e.stopPropagation(); toggleCheckbox(); }} 
              className={`mt-0.5 w-[14px] h-[14px] rounded-[3px] flex items-center justify-center transition-all border shrink-0 ${
                item.completed 
                  ? 'bg-gradient-to-br from-white to-zinc-400 border-zinc-300 text-zinc-950 shadow-[0_0_12px_rgba(255,255,255,0.15)]' 
                  : 'bg-zinc-950 border-zinc-800 text-zinc-700 hover:border-zinc-600'
              }`}
            >
              {item.completed ? (
                <Check className="w-[10px] h-[10px] stroke-[3px]" />
              ) : (
                <div className="w-[10px] h-[10px] rounded-[2px]" />
              )}
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
                    className="h-full bg-gradient-to-r from-zinc-200 to-zinc-400 transition-all duration-300"
                    style={{ width: `${((item.currentValue || 0) / (item.maxValue || 100)) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); handleDecrement(); }} className="p-0.5 bg-zinc-800 rounded hover:bg-zinc-700 text-zinc-400">
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs text-zinc-500 w-8 text-center">{item.currentValue || 0}/{item.maxValue || 100}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleIncrement(); }} className="p-0.5 bg-zinc-800 rounded hover:bg-zinc-700 text-zinc-400">
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
                    className={`w-2 h-2 rounded-full transition-colors ${i < (item.currentValue || 0) ? 'bg-gradient-to-br from-white to-zinc-400 shadow-[0_0_8px_rgba(255,255,255,0.15)]' : 'bg-zinc-800'}`}
                  />
                ))}
                <div className="flex items-center gap-1 ml-auto shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); handleDecrement(); }} className="p-0.5 bg-zinc-800 rounded hover:bg-zinc-700 text-zinc-400">
                    <Minus className="w-3 h-3" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleIncrement(); }} className="p-0.5 bg-zinc-800 rounded hover:bg-zinc-700 text-zinc-400">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onRemoveItem(trackerId, item.id); }}
          className="text-zinc-600 hover:text-red-400 transition-colors shrink-0 mt-0.5 ml-2 opacity-0 lg:group-hover:opacity-100"
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

export const TrackerCard = React.memo(({ tracker, onAddItem, onUpdateItem, onRemoveItem, onUpdateTracker, onDeleteTracker, onViewItem, itemSuggestions = [] }: TrackerCardProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [quantifierType, setQuantifierType] = useState<QuantifierType>('checkbox');
  const [maxValue, setMaxValue] = useState(10);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(tracker.title);

  const { refs, floatingStyles } = useFloating({
    open: isMenuOpen,
    placement: 'bottom-end',
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (refs.reference.current && (refs.reference.current as HTMLElement).contains(target)) {
        return;
      }
      if (refs.floating.current && (refs.floating.current as HTMLElement).contains(target)) {
        return;
      }
      setIsMenuOpen(false);
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen, refs]);

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedTitle.trim() && editedTitle.trim() !== tracker.title) {
      onUpdateTracker(tracker.id, editedTitle.trim());
    }
    setIsEditingTitle(false);
  };
  
  const [isBouncing, setIsBouncing] = useState(false);

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
    setQuantifierType('checkbox');
    setMaxValue(10);
    setIsAdding(false);
  };

  return (
    <motion.div 
      className={`relative border rounded-2xl p-4 w-full flex-shrink-0 flex flex-col max-h-[500px] transition-colors ${isMenuOpen ? 'z-50 bg-zinc-900 border-zinc-700' : 'z-auto bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/80'}`}
      onHoverStart={() => {
        if (!isBouncing) setIsBouncing(true);
      }}
      initial={{ y: 0 }}
      animate={isBouncing ? { y: [0, -5, 0] } : { y: 0 }}
      transition={isBouncing ? { duration: 0.25, times: [0, 0.4, 1], ease: ["easeOut", "easeIn"] } : { duration: 0 }}
      onAnimationComplete={() => setIsBouncing(false)}
      style={{ transformOrigin: "center" }}
    >
      <div 
        className="flex justify-between items-center mb-3 group cursor-default relative"
      >
        {isEditingTitle ? (
          <form onSubmit={handleTitleSubmit} className="flex-1 mr-2" onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={() => handleTitleSubmit({ preventDefault: () => {} } as React.FormEvent)}
              autoFocus
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-2 py-1 text-sm font-bold text-zinc-300 uppercase tracking-wider focus:outline-none focus:border-zinc-500"
            />
          </form>
        ) : (
          <h4 className="font-bold text-sm text-zinc-300 uppercase tracking-wider truncate pr-2 flex-1">{tracker.title}</h4>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {!isAdding && !isEditingTitle && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsAdding(true); }}
              className="p-1 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-md transition-all"
              title="Add Item"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          
          <div className="relative">
            <button 
              ref={refs.setReference}
              onClick={(e) => { 
                e.stopPropagation(); 
                setIsMenuOpen(!isMenuOpen);
              }}
              className={`p-1 rounded-md transition-all ${isMenuOpen ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800'} ${isMenuOpen ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'}`}
              title="More Options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            <FloatingPortal>
              {isMenuOpen && (
                <div 
                  ref={refs.setFloating}
                  style={floatingStyles}
                  className="min-w-[140px] w-auto bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-[9999] py-1 whitespace-nowrap"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditingTitle(true);
                      setEditedTitle(tracker.title);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 flex items-center transition-colors gap-2 whitespace-nowrap"
                  >
                    <Edit2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Edit Name</span>
                  </button>
                  <div className="h-px bg-zinc-800 my-1" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTracker(tracker.id);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs text-red-400 font-medium hover:text-red-300 hover:bg-red-500/10 flex items-center transition-colors gap-2 whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Delete Tracker</span>
                  </button>
                </div>
              )}
            </FloatingPortal>
          </div>
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
            onViewItem={onViewItem || (() => {})}
          />
        ))}
        {tracker.items.length === 0 && (
          <p className="text-zinc-600 text-xs italic py-2 text-center">No items yet</p>
        )}
      </div>

      {isAdding && (
        <form onSubmit={handleAddItem} className="mt-auto bg-zinc-950/50 p-3 rounded-xl border border-zinc-800 space-y-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="w-full">
            <TagAutocompleteInput
              gameId={null}
              value={newItemTitle}
              onChange={setNewItemTitle}
              onAddTag={(tag) => {
                setNewItemTitle(tag);
              }}
              existingTags={tracker.items.map(item => typeof item === 'string' ? item : item.title)}
              additionalSuggestions={itemSuggestions}
              mode="generic"
              triggerOnEnterOnly={true}
              placeholder="Item title..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
              autoFocus
            />
          </div>
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
    </motion.div>
  );
});

TrackerCard.displayName = 'TrackerCard';
