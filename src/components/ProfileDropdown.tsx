import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, LogOut, LayoutGrid, Gamepad2, FileText, Settings, ShieldCheck, Sparkles, ExternalLink, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useUserJourney } from '../contexts/UserJourneyContext';
import { signOut } from '../firebase';

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

export default function ProfileDropdown({ isOpen, onClose }: ProfileDropdownProps) {
  const { user } = useAuth();
  const { navigateTo } = useUI();
  const { totalGames, totalSessions, totalNotes } = useUserJourney();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const displayName = user?.displayName || (user?.isAnonymous ? 'Guest Gamer' : user?.email?.split('@')[0] || 'Player');
  const email = user?.email || (user?.isAnonymous ? 'Anonymous Session' : 'No email attached');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -6 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          className="absolute right-0 top-full mt-2 w-72 bg-zinc-900 border border-zinc-800/90 rounded-2xl shadow-2xl overflow-hidden z-50 text-zinc-100 divide-y divide-zinc-800/60"
        >
          {/* User Info Header */}
          <div className="p-4 bg-zinc-900/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-zinc-700/80 overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-amber-400">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-bold text-zinc-100 truncate">{displayName}</p>
                  {user?.isAnonymous && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                      Guest
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-400 truncate mt-0.5">{email}</p>
              </div>
            </div>

            {/* Quick Stats Pill */}
            <div className="mt-3 grid grid-cols-3 gap-1 bg-zinc-950/60 p-2 rounded-xl border border-zinc-800/80 text-center">
              <div>
                <p className="text-xs font-bold text-zinc-200">{totalGames}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Games</p>
              </div>
              <div className="border-x border-zinc-800">
                <p className="text-xs font-bold text-amber-400">{totalSessions}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Sessions</p>
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-400">{totalNotes}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Notes</p>
              </div>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="p-1.5 space-y-0.5">
            <button
              onClick={() => {
                onClose();
                navigateTo('dashboard');
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/80 rounded-xl transition-colors text-left whitespace-nowrap"
            >
              <LayoutGrid className="w-4 h-4 text-zinc-400 shrink-0" />
              <span>Library Dashboard</span>
            </button>
          </div>

          {/* Profile Options / Showcase */}
          <div className="p-1.5 space-y-0.5">
            <button
              onClick={() => {
                onClose();
                navigateTo('profile-mockups');
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-amber-400/90 hover:text-amber-300 hover:bg-amber-400/10 rounded-xl transition-colors text-left font-medium whitespace-nowrap gap-2"
            >
              <span className="flex items-center gap-3 whitespace-nowrap">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Profile Options Lab</span>
              </span>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-bold shrink-0">5 UX</span>
            </button>
          </div>

          {/* Sign Out Action */}
          <div className="p-1.5">
            <button
              onClick={() => {
                onClose();
                signOut();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors text-left font-medium whitespace-nowrap"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
