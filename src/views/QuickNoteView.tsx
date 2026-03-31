import React, { useRef, useEffect, useState } from 'react';
import { X, Plus, PenLine } from 'lucide-react';
import { format } from 'date-fns';
import { useGameContext } from '../contexts/GameContext';
import { useUI } from '../contexts/UIContext';
import { useNotes } from '../hooks/useNotes';

export default function QuickNoteView() {
  const { goBack } = useUI();
  const { selectedGame } = useGameContext();

  const {
    notes,
    handleAddNote,
    isSubmittingNote
  } = useNotes(selectedGame?.id || null);

  const [noteInput, setNoteInput] = useState('');
  const notesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [notes]);

  if (!selectedGame) return null;

  const submitNote = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!noteInput.trim() || isSubmittingNote) return;
    
    const content = noteInput;
    setNoteInput('');
    await handleAddNote(content);
  };

  return (
    <div className="max-w-3xl w-full mx-auto flex-1 min-h-0 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{selectedGame.title}</h2>
          <p className="text-zinc-500 text-sm">Quick Note</p>
        </div>
        <button 
          onClick={goBack}
          className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Recent Notes */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6 custom-scrollbar">
        {notes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-zinc-900/50 rounded-full flex items-center justify-center mb-4">
              <PenLine className="w-8 h-8 text-zinc-700" />
            </div>
            <h3 className="text-xl font-bold text-zinc-400 mb-2">No recent notes</h3>
            <p className="text-zinc-600 max-w-sm">
              Jot down a quick thought below. It will be added to your game's global notes.
            </p>
          </div>
        ) : (
          notes.slice(-10).map(note => (
            <div key={note.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
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
                  {format(note.timestamp, 'MMM d, HH:mm')}
                </span>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed">{note.content}</p>
            </div>
          ))
        )}
        <div ref={notesEndRef} />
      </div>

      {/* Note Input */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-2 shrink-0">
        <form onSubmit={submitNote} className="flex gap-2">
          <input
            type="text"
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder="Jot down a quick thought..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-100 px-4 py-3 placeholder:text-zinc-600 outline-none"
            disabled={isSubmittingNote}
            autoFocus
          />
          <button
            type="submit"
            disabled={!noteInput.trim() || isSubmittingNote}
            className="bg-zinc-100 text-zinc-950 px-6 py-3 rounded-2xl font-bold hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Save</span>
          </button>
        </form>
      </div>
    </div>
  );
}
