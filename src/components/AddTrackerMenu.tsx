import React, { useState, useRef, useEffect } from 'react';
import { Plus, Check, X } from 'lucide-react';

interface AddTrackerMenuProps {
  onAddTracker: (title: string) => void;
}

const PRESETS = ['Objectives', 'Key Characters', 'Locations', 'Loot', 'Lore'];

export const AddTrackerMenu: React.FC<AddTrackerMenuProps> = ({ onAddTracker }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustom, setIsCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

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
        <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {!isCustom ? (
            <div className="flex flex-col py-2">
              <div className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800/50 mb-1">
                Presets
              </div>
              {PRESETS.map(preset => (
                <button
                  key={preset}
                  onClick={() => handleSelectPreset(preset)}
                  className="px-4 py-2 text-sm text-left text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
                >
                  {preset}
                </button>
              ))}
              <div className="h-px bg-zinc-800/50 my-1" />
              <button
                onClick={() => setIsCustom(true)}
                className="px-4 py-2 text-sm text-left text-zinc-400 font-medium hover:bg-zinc-800 hover:text-zinc-100 transition-colors flex items-center justify-between group"
              >
                Custom...
                <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="p-3 flex items-center gap-2">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Tracker name..."
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                autoFocus
              />
              <button
                type="submit"
                disabled={!customTitle.trim()}
                className="p-2 bg-zinc-100 text-zinc-950 rounded-xl disabled:opacity-50 hover:bg-white transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCustom(false);
                  setCustomTitle('');
                }}
                className="p-2 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
