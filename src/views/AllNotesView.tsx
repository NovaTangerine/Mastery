import React from 'react';
import { X, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { useGameContext } from '../contexts/GameContext';
import { useUI } from '../contexts/UIContext';
import { useNotes } from '../hooks/useNotes';

export default function AllNotesView() {
  const { goBack, viewState } = useUI();
  const { selectedGame } = useGameContext();

  const [filteredTag, setFilteredTag] = React.useState<string | null>(viewState?.filteredTag || null);

  const {
    notes,
    notesLimit,
    loadMoreNotes
  } = useNotes(selectedGame?.id || null, undefined, filteredTag);

  const reversedNotes = [...notes].reverse();

  if (!selectedGame) return null;

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={goBack}
            className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold">
              {filteredTag ? `Notes tagged "${filteredTag}"` : 'All Notes'}
            </h2>
            <p className="text-zinc-500 text-sm">{selectedGame.title}</p>
          </div>
        </div>
        {filteredTag && (
          <button 
            onClick={() => setFilteredTag(null)}
            className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-sm font-bold hover:bg-zinc-700 transition-colors"
          >
            Clear Filter
          </button>
        )}
      </div>

      {reversedNotes.length === 0 ? (
        <div className="py-32 text-center border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-2">
            <BookOpen className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-xl font-bold text-zinc-300">No notes found</h3>
          <p className="text-zinc-500 max-w-sm">
            {filteredTag ? `No notes are tagged with "${filteredTag}".` : "You haven't added any notes for this game. Start a session to begin tracking your thoughts."}
          </p>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-4">
          {reversedNotes.map((note) => (
            <div key={note.id} className="w-full">
              <div className="bg-zinc-900/50 border border-zinc-900 rounded-2xl p-6 group hover:border-zinc-800 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] font-mono text-zinc-600 group-hover:text-indigo-400 transition-colors duration-200 shrink-0 select-none uppercase tracking-wider">
                    {format(note.timestamp, 'MMM d, yyyy · HH:mm')}
                  </span>
                  {note.isGlobal && (
                    <span className="px-2 py-0.5 bg-zinc-100 text-zinc-950 rounded text-[10px] font-medium uppercase tracking-wide">
                      Global
                    </span>
                  )}
                </div>
                <p className="text-zinc-300 text-base leading-relaxed">{note.content}</p>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-[2px] mt-5 pt-3 border-t border-zinc-800/40">
                    <span className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-500 transition-colors duration-200 uppercase tracking-wide shrink-0 select-none mr-0.5">
                      Tags:
                    </span>
                    {note.tags.map(tag => (
                      <span 
                        key={tag} 
                        onClick={() => setFilteredTag(tag)}
                        className="cursor-pointer group-hover:text-zinc-300 hover:!bg-indigo-500/15 hover:!border-indigo-500/30 hover:!text-indigo-200 transition-all px-1.5 py-0.5 bg-transparent border border-transparent rounded text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-wide"
                      >
                        #{tag.replace(/^#/, '')}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {notes.length >= notesLimit && (
        <div className="flex justify-center mt-8 pb-8">
          <button
            onClick={loadMoreNotes}
            className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-sm font-bold transition-colors"
          >
            Load More Notes
          </button>
        </div>
      )}
    </div>
  );
}
