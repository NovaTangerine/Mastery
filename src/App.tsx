/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Gamepad2, 
  LogOut, 
  ChevronRight
} from 'lucide-react';
import { Toaster } from 'sonner';

import { signInWithGoogle, signOut } from './firebase';

import { ErrorBoundary } from './components/ErrorBoundary';

import { GameProvider, useGameContext } from './contexts/GameContext';

import DashboardView from './views/DashboardView';
import GameDetailView from './views/GameDetailView';
import SessionView from './views/SessionView';
import QuickNoteView from './views/QuickNoteView';
import AllInsightsView from './views/AllInsightsView';
import AllNotesView from './views/AllNotesView';

// --- Components ---

function MainApp() {
  const {
    user,
    isAuthReady,
    view,
    selectedGame,
    setHistory,
    navigateTo,
    goBack
  } = useGameContext();

  // --- Render Helpers ---

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-zinc-100 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center shadow-2xl">
          <div className="w-20 h-20 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-8 rotate-3">
            <Gamepad2 className="w-10 h-10 text-zinc-950" />
          </div>
          <h1 className="text-4xl font-bold text-zinc-100 mb-4 tracking-tight">QuestLog</h1>
          <p className="text-zinc-400 mb-10 leading-relaxed">
            A dead-simple journal for your gaming adventures. Log your progress, take notes, and let AI organize your thoughts.
          </p>
          <button 
            onClick={signInWithGoogle}
            className="w-full py-4 bg-zinc-100 text-zinc-950 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white transition-all active:scale-95"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-100 selection:text-zinc-950">
        <Toaster position="top-center" theme="dark" />
        
        {/* Navigation Rail / Header & Back Bar */}
        <div className="sticky top-0 z-50 flex flex-col">
          <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { setHistory([]); navigateTo('dashboard', null, null); }}
                className="flex items-center gap-2 group"
              >
                <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center group-hover:rotate-6 transition-transform">
                  <Gamepad2 className="w-5 h-5 text-zinc-950" />
                </div>
                <span className="font-bold text-xl tracking-tight hidden sm:block">QuestLog</span>
              </button>
              
              {selectedGame && (
                <div className="flex items-center gap-2 text-zinc-500">
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-zinc-100 font-medium truncate max-w-[150px] sm:max-w-none">
                    {selectedGame.title}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={signOut}
                className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-zinc-800" alt="Profile" />
            </div>
          </header>

          {/* Back Bar */}
          {view !== 'dashboard' && (
            <button 
              onClick={goBack}
              className="w-full text-left bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 px-6 py-2 hover:bg-zinc-900/80 transition-colors group cursor-pointer"
            >
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-2 text-zinc-500 group-hover:text-zinc-100 transition-colors text-xs font-bold uppercase tracking-widest">
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Back
                </div>
              </div>
            </button>
          )}
        </div>

        <main className="max-w-6xl mx-auto p-6">
          {view === 'dashboard' && <DashboardView />}
          {view === 'quick-note' && <QuickNoteView />}
          {view === 'game-detail' && <GameDetailView />}
          {view === 'all-insights' && <AllInsightsView />}
          {view === 'all-notes' && <AllNotesView />}
          {view === 'session-view' && <SessionView />}
        </main>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #27272a;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #3f3f46;
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <GameProvider>
      <MainApp />
    </GameProvider>
  );
}
