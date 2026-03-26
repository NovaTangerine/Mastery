import React, { useRef, useEffect, useState } from 'react';
import { Plus, BookOpen, Clock, PenLine, X, Send, ChevronRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

import { useGameContext } from '../contexts/GameContext';
import { SortableNote } from '../components/SortableNote';
import { useVirtualizer } from '@tanstack/react-virtual';

export default function SessionView() {
  const {
    selectedGame,
    sessions,
    activeSession,
    notes,
    handleStartSession,
    handleResumeSession,
    handleUpdateSessionDetails,
    goBack,
    handleDragEnd,
    handleUpdateNote,
    handleDeleteNote,
    handleAddTag,
    handleRemoveTag,
    handleAddNote,
    isSubmittingNote
  } = useGameContext();

  const [noteInput, setNoteInput] = useState('');
  const [isEditingSessionDetails, setIsEditingSessionDetails] = useState(false);
  const [sessionNameInput, setSessionNameInput] = useState('');
  const [sessionChapterInput, setSessionChapterInput] = useState('');
  const [sessionHoursInput, setSessionHoursInput] = useState('');

  const parentRef = useRef<HTMLDivElement>(null);
  const notesEndRef = useRef<HTMLDivElement>(null);

  const sessionNotes = notes.filter(n => n.sessionId === activeSession?.id);

  const rowVirtualizer = useVirtualizer({
    count: sessionNotes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [sessionNotes.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!selectedGame || !activeSession) return null;

  const submitNote = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!noteInput.trim() || isSubmittingNote) return;
    
    const content = noteInput;
    setNoteInput('');
    await handleAddNote(content);
  };

  const saveSessionDetails = async () => {
    await handleUpdateSessionDetails(sessionNameInput, sessionChapterInput, sessionHoursInput);
    setIsEditingSessionDetails(false);
  };

  return (
    <div className="h-[calc(100vh-120px)] flex justify-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sidebar for Sessions */}
      <div className="w-72 shrink-0 hidden md:flex flex-col border-r border-zinc-800/50 pr-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold uppercase tracking-widest text-xs text-zinc-400">Sessions</h3>
          <button 
            onClick={() => handleStartSession()}
            className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
            title="New Session"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => handleResumeSession(session)}
              className={`w-full text-left p-3 rounded-xl transition-all ${activeSession.id === session.id ? 'bg-zinc-800 border border-zinc-700' : 'bg-transparent hover:bg-zinc-900 border border-transparent'}`}
            >
              <p className={`font-bold text-sm truncate ${activeSession.id === session.id ? 'text-zinc-100' : 'text-zinc-400'}`}>{session.name || session.progressMarker}</p>
              <p className="text-zinc-500 text-[10px] mt-1">{format(session.startTime, 'MMM d, yyyy')}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Main Session View */}
      <div className="flex-1 w-full max-w-2xl flex flex-col min-w-0">
        {/* Compact Session Header */}
        <div className="mb-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap flex-1 min-w-0">
              <h2 className="text-xl font-bold truncate">
                {activeSession.name || activeSession.progressMarker}
              </h2>
              
              {!isEditingSessionDetails && (
                <div className="flex items-center gap-3 text-zinc-400 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    Live
                  </div>
                  {activeSession.chapter && (
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                      {activeSession.chapter}
                    </div>
                  )}
                  {activeSession.hoursPlayed && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      {activeSession.hoursPlayed} hrs
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  if (isEditingSessionDetails) {
                    setIsEditingSessionDetails(false);
                  } else {
                    setSessionNameInput(activeSession.name || '');
                    setSessionChapterInput(activeSession.chapter || '');
                    setSessionHoursInput(activeSession.hoursPlayed ? activeSession.hoursPlayed.toString() : '');
                    setIsEditingSessionDetails(true);
                  }
                }}
                className="p-1.5 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
              >
                {isEditingSessionDetails ? <X className="w-4 h-4" /> : <PenLine className="w-4 h-4" />}
              </button>
              <button 
                onClick={goBack}
                className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors"
              >
                End Session
              </button>
            </div>
          </div>

          {isEditingSessionDetails && (
            <div className="mt-4 pt-4 border-t border-zinc-800/50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Session Name</label>
                  <input
                    type="text"
                    value={sessionNameInput}
                    onChange={(e) => setSessionNameInput(e.target.value)}
                    placeholder="e.g. Boss Fight"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Chapter / Level</label>
                  <input
                    type="text"
                    value={sessionChapterInput}
                    onChange={(e) => setSessionChapterInput(e.target.value)}
                    placeholder="e.g. Chapter 4"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Hours Played</label>
                  <input
                    type="number"
                    step="0.1"
                    value={sessionHoursInput}
                    onChange={(e) => setSessionHoursInput(e.target.value)}
                    placeholder="e.g. 2.5"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>
              </div>
              <div className="flex justify-end mt-4">
                <button
                  onClick={saveSessionDetails}
                  className="px-4 py-2 bg-zinc-100 text-zinc-950 rounded-xl text-sm font-bold hover:bg-white transition-colors"
                >
                  Save Details
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notes Feed */}
        <div 
          ref={parentRef} 
          className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar"
        >
          {sessionNotes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-zinc-900/50 rounded-full flex items-center justify-center mb-4">
                <PenLine className="w-8 h-8 text-zinc-700" />
              </div>
              <h3 className="text-xl font-bold text-zinc-400 mb-2">No notes yet</h3>
              <p className="text-zinc-600 max-w-sm">
                Start typing below to add your first note for this session. Notes will appear here.
              </p>
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={sessionNotes.map(n => n.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const note = sessionNotes[virtualRow.index];
                    return (
                      <div
                        key={note.id}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                          paddingBottom: '16px', // space-y-4 equivalent
                        }}
                      >
                        <SortableNote 
                          note={note}
                          onUpdate={handleUpdateNote}
                          onDelete={handleDeleteNote}
                          onAddTag={handleAddTag}
                          onRemoveTag={handleRemoveTag}
                        />
                      </div>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
          <div ref={notesEndRef} />
        </div>

        {/* Input Area */}
        <div className="sticky bottom-0 bg-zinc-950 pt-4">
          <form onSubmit={submitNote} className="relative">
            <textarea 
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              placeholder="Type a note about your experience..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl px-6 py-5 pr-16 focus:outline-none focus:border-zinc-100 transition-all duration-300 resize-none min-h-[60px] hover:min-h-[120px] focus:min-h-[120px] shadow-2xl"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submitNote();
                }
              }}
            />
            <button 
              type="submit"
              disabled={!noteInput.trim() || isSubmittingNote}
              className="absolute right-4 bottom-4 p-3 bg-zinc-100 text-zinc-950 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all active:scale-95"
            >
              {isSubmittingNote ? (
                <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
          <p className="text-center text-[10px] text-zinc-600 mt-4 uppercase tracking-widest">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
