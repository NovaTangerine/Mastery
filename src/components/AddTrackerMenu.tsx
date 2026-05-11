import React, { useState, useRef, useEffect } from 'react';
import { Plus, Check, X } from 'lucide-react';
import { TagAutocompleteInput } from './TagAutocompleteInput';

interface AddTrackerMenuProps {
  onAddTracker: (title: string) => void;
  existingTrackers?: string[];
}

const PRESETS = ['Objectives', 'Key Characters', 'Locations', 'Loot', 'Lore'];

export const AddTrackerMenu: React.FC<AddTrackerMenuProps> = ({ onAddTracker, existingTrackers = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Combine standard presets and dynamically generated trackers from history
  const allPresets = React.useMemo(() => {
    const combined = new Set([...PRESETS, ...existingTrackers]);
    return Array.from(combined);
  }, [existingTrackers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsCustom(false);
        setCustomTitle('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectPreset = (preset: string) => {
    onAddTracker(preset);
    setIsOpen(false);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;
    onAddTracker(customTitle.trim());
    setIsOpen(false);
    setIsCustom(false);
    setCustomTitle('');
  };

  return (
    <div className="relative shrink-0 w-full" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[100px] border-2 border-dashed border-zinc-800 hover:border-zinc-600 rounded-2xl p-4 flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors gap-2"
      >
        <Plus className="w-6 h-6" />
        <span className="text-sm font-bold uppercase tracking-wider">Add Tracker</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] md:hidden animate-in fade-in duration-200"
            onClick={() => {
              setIsOpen(false);
              setIsCustom(false);
              setCustomTitle('');
            }}
          />
          <div className="fixed bottom-0 left-0 w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl pb-safe shadow-2xl z-[70] animate-in slide-in-from-bottom-full duration-300 pointer-events-auto md:absolute md:top-full md:bottom-auto md:left-0 md:w-56 md:border md:rounded-2xl md:z-50 md:shadow-xl md:slide-in-from-top-2 md:duration-200 overflow-hidden">
            {!isCustom ? (
              <div className="flex flex-col py-2 pb-6 md:pb-2">
                <div className="px-5 md:px-4 py-3 md:py-2 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50 mb-1 flex justify-between items-center">
                  Presets
                  <button className="md:hidden" onClick={() => setIsOpen(false)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {allPresets.map(preset => (
                    <button
                      key={preset}
                      onClick={() => handleSelectPreset(preset)}
                      className="w-full px-5 md:px-4 py-4 md:py-2 text-base md:text-sm text-left text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <div className="h-px bg-zinc-800/50 my-1 md:my-1" />
                <button
                  onClick={() => setIsCustom(true)}
                  className="px-5 md:px-4 py-4 md:py-2 text-base md:text-sm text-left text-zinc-400 font-medium hover:bg-zinc-800 hover:text-zinc-100 transition-colors flex items-center justify-between group"
                >
                  Custom...
                  <Plus className="w-5 h-5 md:w-4 md:h-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 md:text-inherit" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomSubmit} className="p-4 md:p-3 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-2 pb-8 md:pb-3">
                <div className="flex items-center justify-between md:hidden mb-1">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Custom Tracker</span>
                </div>
                <div className="w-full md:flex-1">
                  <TagAutocompleteInput
                    gameId={null}
                    value={customTitle}
                    onChange={setCustomTitle}
                    onAddTag={(tag) => {
                      onAddTracker(tag);
                      setIsOpen(false);
                      setIsCustom(false);
                      setCustomTitle('');
                    }}
                    existingTags={[]}
                    additionalSuggestions={allPresets}
                    mode="generic"
                    triggerOnEnterOnly={true}
                    placeholder="Tracker name..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 md:px-3 md:py-2 text-base md:text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustom(false);
                      setCustomTitle('');
                    }}
                    className="flex-1 md:flex-none p-3 md:p-2 bg-zinc-800 md:bg-transparent text-zinc-300 md:text-zinc-500 rounded-xl hover:text-zinc-100 hover:bg-zinc-700 md:hover:bg-transparent transition-colors flex items-center justify-center font-bold text-sm md:font-normal"
                  >
                    <span className="md:hidden">Cancel</span>
                    <X className="w-4 h-4 hidden md:block" />
                  </button>
                  <button
                    type="submit"
                    disabled={!customTitle.trim()}
                    className="flex-1 md:flex-none p-3 md:p-2 bg-zinc-100 text-zinc-950 rounded-xl disabled:opacity-50 hover:bg-white transition-colors flex items-center justify-center font-bold text-sm md:font-normal"
                  >
                    <span className="md:hidden">Create</span>
                    <Check className="w-4 h-4 hidden md:block" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
};
