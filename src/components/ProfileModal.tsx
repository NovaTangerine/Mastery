import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, LogOut, User, Shield, Gamepad2, FileText, Calendar, Sparkles, CheckCircle2, Copy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useUserJourney } from '../contexts/UserJourneyContext';
import { signOut } from '../firebase';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user } = useAuth();
  const { navigateTo } = useUI();
  const { totalGames, totalSessions, totalNotes, hasLoggedAnySession } = useUserJourney();
  const [copiedUid, setCopiedUid] = React.useState(false);

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

  const copyUid = () => {
    if (!user?.uid) return;
    navigator.clipboard.writeText(user.uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const displayName = user?.displayName || (user?.isAnonymous ? 'Guest Gamer' : user?.email?.split('@')[0] || 'Player');
  const email = user?.email || (user?.isAnonymous ? 'Anonymous Session' : 'No email attached');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-10 text-zinc-100 divide-y divide-zinc-800"
          >
            {/* Header Banner */}
            <div className="p-6 relative bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-900">
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-2 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl border-2 border-zinc-700 overflow-hidden bg-zinc-800 flex items-center justify-center shadow-lg shrink-0">
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
                    <h2 className="text-xl font-bold truncate text-white">{displayName}</h2>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400 border border-amber-400/20">
                      {user?.isAnonymous ? 'Guest' : 'Member'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 truncate mt-1">{email}</p>
                </div>
              </div>
            </div>

            {/* Stats Overview */}
            <div className="p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Player Passport</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-center">
                  <p className="text-2xl font-bold text-zinc-100">{totalGames}</p>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase mt-0.5">Games</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-center">
                  <p className="text-2xl font-bold text-amber-400">{totalSessions}</p>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase mt-0.5">Sessions</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 text-center">
                  <p className="text-2xl font-bold text-indigo-400">{totalNotes}</p>
                  <p className="text-[11px] font-semibold text-zinc-500 uppercase mt-0.5">Notes</p>
                </div>
              </div>

              {/* Account Details Box */}
              <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">User Identifier</span>
                  <button
                    onClick={copyUid}
                    className="flex items-center gap-1.5 font-mono text-zinc-300 hover:text-white bg-zinc-800 px-2 py-1 rounded transition-colors"
                  >
                    {copiedUid ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
                    <span>{user?.uid ? `${user.uid.slice(0, 10)}...` : 'Unknown'}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Authentication</span>
                  <span className="text-zinc-200 font-medium">{user?.isAnonymous ? 'Anonymous Guest' : 'Google / Firebase Auth'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium">Player Status</span>
                  <span className="text-emerald-400 font-semibold">{hasLoggedAnySession ? 'Active Journaler' : 'New Explorer'}</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-zinc-950/50 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  onClose();
                  navigateTo('profile-mockups');
                }}
                className="flex items-center gap-2 text-xs font-semibold text-amber-400 hover:text-amber-300 py-2 px-3 rounded-lg hover:bg-amber-400/10 transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                <span>Test All 5 UX Options</span>
              </button>

              <button
                onClick={() => {
                  onClose();
                  signOut();
                }}
                className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
