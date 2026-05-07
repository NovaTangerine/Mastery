import React, { useState } from 'react';
import { Plus, Trash2, PenLine, Star, ChevronRight, History, Tag as TagIcon, Target } from 'lucide-react';
import { format } from 'date-fns';
import { useGameContext } from '../contexts/GameContext';
import { useUI } from '../contexts/UIContext';
import { useNotes } from '../hooks/useNotes';
import { cn } from '../lib/utils';

import { GameSession } from '../types';

export default function GameDetailView() {
  const { navigateTo } = useUI();
  const {
    selectedGame,
    sessions,
    sessionsLimit,
    loadMoreSessions,
    handleStartSession,
    handleResumeSession,
    handleUpdateGameField,
    handleUpdateGameStatus,
    handleDeleteGame,
    handleDeleteSession,
  } = useGameContext();

  const { notes } = useNotes(selectedGame?.id || null);
  const [isDeletingGame, setIsDeletingGame] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<GameSession | null>(null);

  const tagCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const note of notes) {
      if (note.tags) {
        for (const tag of note.tags) {
          counts[tag] = (counts[tag] || 0) + 1;
        }
      }
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [notes]);

  if (!selectedGame) return null;

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {isDeletingGame && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-4">Delete "{selectedGame?.title}"?</h3>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              This will permanently delete this game and all associated sessions and notes. This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => handleDeleteGame()}
                className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-bold hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
              <button 
                onClick={() => setIsDeletingGame(false)}
                className="flex-1 bg-zinc-800 text-zinc-100 py-3 rounded-2xl font-bold hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {sessionToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-4">Delete Session?</h3>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              This will permanently delete this session and all its notes. This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  handleDeleteSession(sessionToDelete.id);
                  setSessionToDelete(null);
                }}
                className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-bold hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
              <button 
                onClick={() => setSessionToDelete(null)}
                className="flex-1 bg-zinc-800 text-zinc-100 py-3 rounded-2xl font-bold hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h2 className="text-5xl font-black tracking-tighter mb-2">{selectedGame.title}</h2>
          <div className="flex flex-wrap gap-3">
            <select 
              value={selectedGame.status}
              onChange={(e) => handleUpdateGameStatus(e.target.value as any)}
              className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold text-zinc-400 uppercase tracking-wider cursor-pointer hover:bg-zinc-800 transition-colors outline-none appearance-none pr-6 relative"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 8px center',
                backgroundSize: '12px'
              }}
            >
              <option value="playing">Playing</option>
              <option value="completed">Completed</option>
              <option value="backlog">Backlog</option>
              <option value="abandoned">Abandoned</option>
            </select>
            <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold text-zinc-400">
              {sessions.length} Sessions
            </span>
          </div>
        </div>
        {(notes.length > 0 || sessions.length > 0) && (
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-1">
              <button 
                onClick={() => handleStartSession()}
                className="p-3 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-all"
                title="Start New Session"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsDeletingGame(true)}
                className="p-3 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                title="Delete Game"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <button 
              onClick={() => sessions.length > 0 ? handleResumeSession(sessions[0]) : handleStartSession()}
              className="bg-zinc-100 text-zinc-950 px-6 sm:px-8 py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 hover:bg-white transition-all active:scale-95 shadow-lg shadow-zinc-100/10"
            >
              <PenLine className="w-5 h-5 sm:w-6 sm:h-6" />
              {sessions.length > 0 ? 'Continue Logging' : 'Start Logging'}
            </button>
          </div>
        )}
      </div>

      {notes.length === 0 && sessions.length === 0 ? (
        <div className="relative mt-12 mb-12 sm:mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Placeholder Background UI */}
          <div className="absolute inset-x-0 -top-12 bottom-0 z-0 overflow-hidden opacity-30 select-none pointer-events-none filter blur-[3px]">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 opacity-70">
              <div className="lg:col-span-2 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-zinc-600">
                      <TagIcon className="w-5 h-5" />
                      <div className="w-16 h-3 bg-zinc-800 rounded-full" />
                    </div>
                    <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-5">
                      <div className="flex flex-wrap gap-2">
                        <div className="w-20 h-8 bg-zinc-800/80 rounded-lg" />
                        <div className="w-24 h-8 bg-zinc-800/80 rounded-lg" />
                        <div className="w-16 h-8 bg-zinc-800/80 rounded-lg" />
                        <div className="w-28 h-8 bg-zinc-800/80 rounded-lg" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 text-zinc-600">
                      <History className="w-5 h-5" />
                      <div className="w-24 h-3 bg-zinc-800 rounded-full" />
                    </div>
                    <div className="space-y-4">
                      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-5 h-24" />
                      <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-5 h-32" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-10">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 text-zinc-600">
                    <Target className="w-5 h-5" />
                    <div className="w-32 h-3 bg-zinc-800 rounded-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-16 bg-zinc-900/40 rounded-2xl" />
                    <div className="w-full h-16 bg-zinc-900/40 rounded-2xl" />
                    <div className="w-full h-16 bg-zinc-900/40 rounded-2xl" />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Gradient Overlay to fade out bottom */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />
          </div>

          {/* Overlay Content */}
          <div className="relative z-10 flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl min-h-[400px]">
            <h3 className="text-3xl sm:text-4xl font-black text-zinc-100 mb-4 tracking-tight">Your Journey Awaits</h3>
            <p className="text-zinc-400 max-w-lg mb-16 leading-relaxed">
              Start tracking your playthrough to capture every moment, organize your thoughts, and never lose track of what to do next.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 w-full max-w-4xl text-left">
              <div className="flex flex-col items-center text-center gap-4 group">
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-lg shadow-indigo-500/5 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300">
                  <PenLine className="w-7 h-7 text-indigo-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-100 mb-2">Take Notes</h4>
                  <p className="text-sm text-zinc-500 leading-relaxed max-w-[250px]">
                    Take notes on your thoughts and feelings as you progress throughout a game.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center gap-4 group">
                <div className="w-16 h-16 rounded-3xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-lg shadow-amber-500/5 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all duration-300">
                  <TagIcon className="w-7 h-7 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-100 mb-2">Tag Notes</h4>
                  <p className="text-sm text-zinc-500 leading-relaxed max-w-[250px]">
                    Tag notes with various topics to make them easy to sort and organize based on topic.
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center gap-4 group">
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-lg shadow-emerald-500/5 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300">
                  <Target className="w-7 h-7 text-emerald-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                  <h4 className="font-bold text-zinc-100 mb-2">Track Objectives</h4>
                  <p className="text-sm text-zinc-500 leading-relaxed max-w-[250px]">
                    Track side-quests, collectibles, or create your own objectives to keep track of your goals.
                  </p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => handleStartSession()}
              className="mt-20 bg-zinc-100 text-zinc-950 px-10 py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-xl shadow-zinc-100/10"
            >
              START FIRST SESSION
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left Column: Notes & Sessions */}
          <div className="lg:col-span-2 space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Tags Section */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <TagIcon className="w-5 h-5" />
                    <h3 className="font-bold uppercase tracking-widest text-xs">Tags</h3>
                  </div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                  {tagCounts.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tagCounts.map(([tag, count]) => (
                        <button 
                          key={tag}
                          onClick={() => navigateTo('all-notes', selectedGame, null, null, { filteredTag: tag })}
                          className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center gap-2 group hover:border-zinc-700 hover:bg-zinc-800 transition-colors animate-in fade-in"
                        >
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter group-hover:text-zinc-300">{tag}</span>
                          <span className="text-[10px] font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded group-hover:bg-zinc-950">{count}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center">
                      <p className="text-zinc-500 text-xs italic">No tags used yet.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Recent Activity / Notes Feed */}
              <section className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <History className="w-5 h-5" />
                    <h3 className="font-bold uppercase tracking-widest text-xs">Recent Notes</h3>
                  </div>
                  {notes.length > 3 && (
                    <button 
                      onClick={() => navigateTo('all-notes', selectedGame, null)}
                      className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-100 transition-colors flex items-center gap-1"
                    >
                      View All <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  {notes.slice().reverse().slice(0, 3).map(note => (
                    <div key={note.id} className="bg-zinc-900/50 border border-zinc-900 rounded-2xl p-5 hover:border-zinc-800 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-wrap gap-2">
                          {note.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                              {tag}
                            </span>
                          ))}
                          {note.isGlobal && (
                            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-950 rounded text-[10px] font-bold uppercase tracking-tighter">
                              Global
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-zinc-600">
                          {format(note.timestamp, 'HH:mm')}
                        </span>
                      </div>
                      <p className="text-zinc-300 text-sm leading-relaxed">{note.content}</p>
                    </div>
                  ))}
                  {notes.length === 0 && (
                    <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl p-8 text-center">
                      <p className="text-zinc-500 text-xs italic">No notes yet. Start a session to begin logging.</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Right Column: Story & Sessions List */}
          <div className="space-y-10">
            <section className="space-y-4">
              <h3 className="font-bold uppercase tracking-widest text-xs text-zinc-400">Past Sessions</h3>
              <div className="space-y-2">
                {sessions.length === 0 ? (
                  <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                    <History className="w-8 h-8 text-zinc-600 mb-3" />
                    <p className="text-zinc-400 font-medium">No sessions yet</p>
                    <p className="text-zinc-500 text-sm mt-1">Start a new session to begin tracking your progress.</p>
                  </div>
                ) : (
                  sessions.map(session => (
                    <div 
                      key={session.id} 
                      role="button"
                      tabIndex={0}
                      onClick={() => handleResumeSession(session)}
                      onKeyDown={(e) => e.key === 'Enter' && handleResumeSession(session)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group cursor-pointer"
                    >
                      <div className="text-left">
                        <p className="font-bold text-sm group-hover:text-zinc-100 transition-colors">{session.name || session.progressMarker}</p>
                        <p className="text-zinc-500 text-[10px]">{format(session.startTime, 'MMM d, yyyy')}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSessionToDelete(session);
                          }}
                          className="hidden md:flex opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all shrink-0 items-center justify-center mr-2"
                          title="Delete Session"
                        >
                          <Trash2 className="w-4 h-4 transition-colors hover:fill-red-400/20" />
                        </button>
                        <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Resume</span>
                        <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-100 transition-colors" />
                      </div>
                    </div>
                  ))
                )}
                {sessions.length >= sessionsLimit && (
                  <div className="flex justify-center mt-6">
                    <button 
                      onClick={loadMoreSessions}
                      className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-6 py-3 rounded-full font-bold text-sm hover:text-zinc-100 hover:bg-zinc-800 transition-all"
                    >
                      Load More Sessions
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
