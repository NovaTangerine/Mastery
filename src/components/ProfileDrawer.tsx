import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogOut, LayoutGrid, Gamepad2, FileText, Sparkles, Trophy, Shield, Calendar, Activity, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useUserJourney } from '../contexts/UserJourneyContext';
import { useGameLibrary } from '../contexts/GameContext';
import { signOut } from '../firebase';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileDrawer({ isOpen, onClose }: ProfileDrawerProps) {
  const { user } = useAuth();
  const { navigateTo } = useUI();
  const { totalGames, totalSessions, totalNotes, isPowerUser } = useUserJourney();
  const { games } = useGameLibrary();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const displayName = user?.displayName || (user?.isAnonymous ? 'Guest Gamer' : user?.email?.split('@')[0] || 'Player');
  const email = user?.email || (user?.isAnonymous ? 'Anonymous Session' : 'No email configured');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-full max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl h-full flex flex-col z-10 text-zinc-100 overflow-y-auto"
          >
            {/* Header / Banner */}
            <div className="relative p-6 bg-gradient-to-b from-zinc-800/80 to-zinc-900 border-b border-zinc-800">
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                title="Close Drawer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl border-2 border-zinc-700/80 overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center shadow-lg">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-black text-amber-400">
                      {displayName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold truncate text-white">{displayName}</h2>
                    {user?.isAnonymous ? (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                        Guest
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Pro
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 truncate mt-1">{email}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* User Stats Card */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">Player Snapshot</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-3.5 text-center">
                    <Gamepad2 className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
                    <span className="text-xl font-bold text-white">{totalGames}</span>
                    <p className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5">Games</p>
                  </div>
                  <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-3.5 text-center">
                    <Activity className="w-4 h-4 text-amber-400 mx-auto mb-1.5" />
                    <span className="text-xl font-bold text-white">{totalSessions}</span>
                    <p className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5">Sessions</p>
                  </div>
                  <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-3.5 text-center">
                    <FileText className="w-4 h-4 text-indigo-400 mx-auto mb-1.5" />
                    <span className="text-xl font-bold text-white">{totalNotes}</span>
                    <p className="text-[10px] text-zinc-500 font-semibold uppercase mt-0.5">Notes</p>
                  </div>
                </div>
              </div>

              {/* Active Playing Library Preview */}
              {games.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Currently in Library</h3>
                    <button
                      onClick={() => {
                        onClose();
                        navigateTo('dashboard');
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                    >
                      View all <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {games.slice(0, 3).map((g) => (
                      <div
                        key={g.id}
                        onClick={() => {
                          onClose();
                          navigateTo('session-view', g);
                        }}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-950/40 hover:bg-zinc-800/60 border border-zinc-800/60 transition-colors cursor-pointer group"
                      >
                        {g.coverUrl ? (
                          <img src={g.coverUrl} alt={g.title} className="w-9 h-12 object-cover rounded-md shadow shrink-0" />
                        ) : (
                          <div className="w-9 h-12 rounded-md bg-zinc-800 flex items-center justify-center font-bold text-zinc-500 text-xs shrink-0">
                            {g.title.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-zinc-200 group-hover:text-white truncate">{g.title}</p>
                          <p className="text-xs text-zinc-500 truncate">{g.status || 'In Library'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Navigation Shortcuts */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Shortcuts</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      onClose();
                      navigateTo('profile-mockups');
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 rounded-xl transition-colors border border-amber-400/20 font-medium"
                  >
                    <span className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Compare All 5 Profile Options</span>
                    </span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-zinc-800 bg-zinc-950/40">
              <button
                onClick={() => {
                  onClose();
                  signOut();
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold text-sm transition-colors border border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Cartridge</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
