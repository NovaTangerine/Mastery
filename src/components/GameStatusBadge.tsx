import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Trophy, XCircle, Archive, ChevronDown, Check } from 'lucide-react';
import { Game } from '../types';

type GameStatus = Game['status'];

interface StatusOption {
  value: GameStatus;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const STATUS_OPTIONS: StatusOption[] = [
  { value: 'playing', label: 'Now Playing', icon: Play },
  { value: 'completed', label: 'Completed', icon: Trophy },
  { value: 'abandoned', label: 'Dropped', icon: XCircle },
  { value: 'backlog', label: 'Backlog', icon: Archive },
];

interface GameStatusBadgeProps {
  status: GameStatus;
  onChange: (status: GameStatus) => void;
  /** Called instead of onChange when "Completed" is picked, so the caller can collect a review first. */
  onSelectCompleted?: () => void;
  className?: string;
}

export default function GameStatusBadge({ status, onChange, onSelectCompleted, className }: GameStatusBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const current = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[0];
  const CurrentIcon = current.icon;
  const isCompleted = status === 'completed';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className={`relative inline-block ${className || ''}`}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
        className={`flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border transition-colors whitespace-nowrap ${
          isCompleted
            ? 'text-amber-400 bg-amber-400/10 border-amber-400/20'
            : 'text-zinc-400 bg-zinc-800 border-zinc-700 hover:text-zinc-200'
        }`}
      >
        <CurrentIcon className="w-3 h-3 shrink-0" />
        <span>{current.label}</span>
        <ChevronDown className={`w-3 h-3 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 top-full mt-2 min-w-[170px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50 p-1.5 space-y-0.5"
          >
            {STATUS_OPTIONS.map(option => {
              const OptionIcon = option.icon;
              const isActive = option.value === status;
              return (
                <button
                  key={option.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    if (option.value === 'completed' && onSelectCompleted) {
                      onSelectCompleted();
                    } else if (!isActive) {
                      onChange(option.value);
                    }
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center gap-3 text-sm rounded-xl transition-colors whitespace-nowrap ${
                    isActive ? 'text-zinc-100 bg-zinc-800/80' : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/80'
                  }`}
                >
                  <OptionIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="flex-1">{option.label}</span>
                  {isActive && <Check className="w-3.5 h-3.5 shrink-0 text-zinc-400" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
