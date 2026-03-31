/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Gamepad2, 
  LogOut, 
  ChevronRight,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  WifiOff
} from 'lucide-react';
import { Toaster } from 'sonner';

import { signInWithGoogle, signOut } from './firebase';

import { ErrorBoundary } from './components/ErrorBoundary';

import { GameProvider, useGameContext } from './contexts/GameContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UIProvider, useUI } from './contexts/UIContext';
import { useNetworkStatus } from './hooks/useNetworkStatus';

import DashboardView from './views/DashboardView';
import GameDetailView from './views/GameDetailView';
import SessionView from './views/SessionView';
import { NoteEditorView } from './views/NoteEditorView';
import QuickNoteView from './views/QuickNoteView';
import AllInsightsView from './views/AllInsightsView';
import AllNotesView from './views/AllNotesView';

// --- Components ---

function MainApp() {
  const [isBackBarVisible, setIsBackBarVisible] = useState(true);
  const isOnline = useNetworkStatus();
  const { user, isAuthReady } = useAuth();
  const {
    view,
    isCompactMode,
    setIsCompactMode,
    navigateTo,
    goBack,
    clearHistory
  } = useUI();
  const { selectedGame } = useGameContext();

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
      <div className="h-[100dvh] flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-100 selection:text-zinc-950">
        <Toaster position="top-center" theme="dark" />
        
        {/* Offline Banner */}
        {!isOnline && (
          <div className="shrink-0 z-40 bg-amber-900/20 border-b border-amber-900/30 px-6 py-2 flex items-center justify-center text-amber-500 text-xs font-medium text-center">
            ⚠️ Offline Mode: Changes are saved locally. Reconnect to sync and prevent data loss.
          </div>
        )}

        {/* Navigation Rail / Header & Back Bar */}
        {view !== 'note-editor' && (
          <div className="shrink-0 z-50 flex flex-col">
            <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { clearHistory(); navigateTo('dashboard', null, null); }}
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
              {!isOnline && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/30 border border-amber-900/50 rounded-full text-amber-500 text-xs font-medium" title="Offline Mode: Changes are saved locally. Reconnect to sync and prevent data loss.">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Offline Mode</span>
                </div>
              )}
              {view !== 'dashboard' && (
                <button
                  onClick={() => setIsBackBarVisible(!isBackBarVisible)}
                  className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors"
                  title={isBackBarVisible ? "Hide back bar" : "Show back bar"}
                >
                  {isBackBarVisible ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              )}
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
            <div className={`w-full bg-zinc-950/80 backdrop-blur-xl transition-all duration-300 ease-in-out overflow-hidden ${isBackBarVisible ? 'max-h-16 border-b border-zinc-900 opacity-100' : 'max-h-0 border-transparent opacity-0'}`}>
              <div className="px-6 py-2">
                <div className={`mx-auto flex items-center justify-between ${view === 'session-view' ? 'max-w-[1440px]' : 'max-w-6xl'}`}>
                  <button 
                    onClick={goBack}
                    className="text-left hover:bg-zinc-900/80 transition-colors group cursor-pointer py-1 px-2 -ml-2 rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-zinc-500 group-hover:text-zinc-100 transition-colors text-xs font-bold uppercase tracking-widest">
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      Back
                    </div>
                  </button>
                  
                  {view === 'session-view' && (
                    <button
                      onClick={() => setIsCompactMode(!isCompactMode)}
                      className="flex items-center gap-2 text-zinc-500 hover:text-zinc-100 transition-colors text-xs font-bold uppercase tracking-widest p-1 px-2 -mr-2 rounded-lg hover:bg-zinc-900/80"
                      title={isCompactMode ? "Show utility bars" : "Hide utility bars"}
                    >
                      {isCompactMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      <span className="hidden sm:inline">{isCompactMode ? "Show Utilities" : "Hide Utilities"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

        <main className={`flex-1 min-h-0 w-full ${['session-view', 'quick-note', 'note-editor'].includes(view) ? 'flex flex-col' : 'overflow-y-auto'}`}>
          <div className={`mx-auto w-full ${['session-view', 'quick-note', 'note-editor'].includes(view) ? (view === 'note-editor' ? 'p-0 flex-1 min-h-0 flex flex-col' : 'p-2 sm:p-6 flex-1 min-h-0 flex flex-col max-w-[1440px]') : 'p-4 sm:p-6 max-w-6xl'}`}>
            {view === 'dashboard' && <DashboardView />}
            {view === 'quick-note' && <QuickNoteView />}
            {view === 'game-detail' && <GameDetailView />}
            {view === 'all-insights' && <AllInsightsView />}
            {view === 'all-notes' && <AllNotesView />}
            {view === 'session-view' && <SessionView />}
            {view === 'note-editor' && <NoteEditorView />}
          </div>
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
    <AuthProvider>
      <UIProvider>
        <GameProvider>
          <MainApp />
        </GameProvider>
      </UIProvider>
    </AuthProvider>
  );
}
