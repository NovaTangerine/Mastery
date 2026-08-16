import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, Gamepad2, Activity, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useUserJourney } from '../contexts/UserJourneyContext';
import { signOut } from '../firebase';

interface ProfileHoverCardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileHoverCard({ isOpen, onClose }: ProfileHoverCardProps) {
  const { user } = useAuth();
  const { navigateTo } = useUI();
  const { totalGames, totalSessions, totalNotes } = useUserJourney();
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const displayName = user?.displayName || (user?.isAnonymous ? 'Guest Gamer' : user?.email?.split('@')[0] || 'Player');

  // Calculate a gamified player level from real sessions & notes
  const calculatedLevel = Math.max(1, Math.floor((totalSessions * 3 + totalNotes * 2 + totalGames * 5) / 10) + 1);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={cardRef}
          initial={{ opacity: 0, y: -4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.96 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-full mt-2 w-64 bg-zinc-950/95 border border-amber-500/30 rounded-2xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.8),0_0_15px_rgba(245,158,11,0.15)] z-50 text-zinc-100 backdrop-blur-xl"
        >
          {/* Header Badge */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-100 truncate">{displayName}</p>
                <p className="text-[10px] text-zinc-500">Cartridge Gamer</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full text-amber-400 text-[10px] font-extrabold shrink-0">
              <Shield className="w-3 h-3" />
              <span>LVL {calculatedLevel}</span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="py-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-zinc-900/80 rounded-lg p-1.5 border border-zinc-800">
              <span className="block font-bold text-zinc-200">{totalGames}</span>
              <span className="text-[9px] text-zinc-500 uppercase">Games</span>
            </div>
            <div className="bg-zinc-900/80 rounded-lg p-1.5 border border-zinc-800">
              <span className="block font-bold text-amber-400">{totalSessions}</span>
              <span className="text-[9px] text-zinc-500 uppercase">Runs</span>
            </div>
            <div className="bg-zinc-900/80 rounded-lg p-1.5 border border-zinc-800">
              <span className="block font-bold text-indigo-400">{totalNotes}</span>
              <span className="text-[9px] text-zinc-500 uppercase">Notes</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <button
              onClick={() => {
                onClose();
                navigateTo('profile-mockups');
              }}
              className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              <span>Options Lab</span>
            </button>
            <button
              onClick={() => {
                onClose();
                signOut();
              }}
              className="text-[11px] font-semibold text-red-400 hover:text-red-300 flex items-center gap-1"
            >
              <LogOut className="w-3 h-3" />
              <span>Sign Out</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
