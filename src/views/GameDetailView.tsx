import React, { useState } from 'react';
import { Plus, Trash2, PenLine, BookOpen, Edit3, Save, Star, ChevronRight, History, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { useGameContext } from '../contexts/GameContext';
import { cn } from '../lib/utils';

import { GameSession } from '../types';

export default function GameDetailView() {
  const {
    selectedGame,
    sessions,
    notes,
    handleStartSession,
    handleResumeSession,
    handleUpdateGameField,
    handleDeleteGame,
    handleDeleteSession,
    navigateTo,
  } = useGameContext();

  const [isEditingOverallThoughts, setIsEditingOverallThoughts] = useState(false);
  const [overallThoughtsDraft, setOverallThoughtsDraft] = useState('');
  const [isEditingStorySynopsis, setIsEditingStorySynopsis] = useState(false);
  const [storySynopsisDraft, setStorySynopsisDraft] = useState('');
  const [isDeletingGame, setIsDeletingGame] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<GameSession | null>(null);

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
                onClick={handleDeleteGame}
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
            <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {selectedGame.status}
            </span>
            <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold text-zinc-400">
              {sessions.length} Sessions
            </span>
          </div>
        </div>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Notes & Sessions */}
        <div className="lg:col-span-2 space-y-10">
          {/* Global Notes Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-400">
                <BookOpen className="w-5 h-5" />
                <h3 className="font-bold uppercase tracking-widest text-xs">Overall Thoughts</h3>
              </div>
              {!isEditingOverallThoughts && (
                <button
                  onClick={() => {
                    setOverallThoughtsDraft(selectedGame.overallNotes || '');
                    setIsEditingOverallThoughts(true);
                  }}
                  className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-100 transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              )}
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              {isEditingOverallThoughts ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <textarea 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 focus:outline-none focus:border-zinc-600 text-zinc-300 leading-relaxed resize-none min-h-[150px]"
                    placeholder="Add overall thoughts about the game, mechanics, or general impressions..."
                    value={overallThoughtsDraft}
                    onChange={(e) => setOverallThoughtsDraft(e.target.value)}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setIsEditingOverallThoughts(false)}
                      className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        handleUpdateGameField('overallNotes', overallThoughtsDraft);
                        setIsEditingOverallThoughts(false);
                      }}
                      className="px-4 py-2 bg-zinc-100 text-zinc-950 rounded-xl text-xs font-bold hover:bg-white transition-colors flex items-center gap-2"
                    >
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className={cn(
                    "text-zinc-300 leading-relaxed min-h-[150px] whitespace-pre-wrap animate-in fade-in duration-200",
                    !selectedGame.overallNotes && "text-zinc-600 italic"
                  )}
                >
                  {selectedGame.overallNotes || "No overall thoughts yet. Click edit to add some."}
                </div>
              )}
            </div>
          </section>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Global Insights Section (AI Highlighted) */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Star className="w-5 h-5" />
                  <h3 className="font-bold uppercase tracking-widest text-xs">Global Insights</h3>
                </div>
                {notes.filter(n => n.isGlobal).length > 3 && (
                  <button 
                    onClick={() => navigateTo('all-insights', selectedGame, null)}
                    className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-100 transition-colors flex items-center gap-1"
                  >
                    View All <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 gap-4">
                {notes.filter(n => n.isGlobal).length > 0 ? (
                  notes.filter(n => n.isGlobal).slice().reverse().slice(0, 3).map(note => (
                    <div key={note.id} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex flex-wrap gap-2">
                          {note.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500">
                          {format(note.timestamp, 'MMM d')}
                        </span>
                      </div>
                      <p className="text-zinc-300 text-sm font-medium leading-relaxed">{note.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl p-8 text-center">
                    <p className="text-zinc-500 text-xs italic">No global insights yet. The AI will highlight key observations here.</p>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-400">
                <MessageSquare className="w-5 h-5" />
                <h3 className="font-bold uppercase tracking-widest text-xs">Story Synopsis</h3>
              </div>
              {!isEditingStorySynopsis && (
                <button
                  onClick={() => {
                    setStorySynopsisDraft(selectedGame.storySynopsis || '');
                    setIsEditingStorySynopsis(true);
                  }}
                  className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-100 transition-colors flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              )}
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
              {isEditingStorySynopsis ? (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <textarea 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 focus:outline-none focus:border-zinc-600 text-zinc-300 leading-relaxed resize-none min-h-[200px]"
                    placeholder="Summarize the story so far..."
                    value={storySynopsisDraft}
                    onChange={(e) => setStorySynopsisDraft(e.target.value)}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setIsEditingStorySynopsis(false)}
                      className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        handleUpdateGameField('storySynopsis', storySynopsisDraft);
                        setIsEditingStorySynopsis(false);
                      }}
                      className="px-4 py-2 bg-zinc-100 text-zinc-950 rounded-xl text-xs font-bold hover:bg-white transition-colors flex items-center gap-2"
                    >
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  className={cn(
                    "text-zinc-300 leading-relaxed min-h-[200px] whitespace-pre-wrap animate-in fade-in duration-200",
                    !selectedGame.storySynopsis && "text-zinc-600 italic"
                  )}
                >
                  {selectedGame.storySynopsis || "No story synopsis yet. Click edit to add one."}
                </div>
              )}
            </div>
          </section>

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
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
