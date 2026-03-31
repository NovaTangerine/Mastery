import React from 'react';
import { X, Lightbulb } from 'lucide-react';
import { format } from 'date-fns';
import { useGameContext } from '../contexts/GameContext';
import { useUI } from '../contexts/UIContext';
import { useNotes } from '../hooks/useNotes';

export default function AllInsightsView() {
  const { goBack } = useUI();
  const { selectedGame } = useGameContext();

  const { notes } = useNotes(selectedGame?.id || null);

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
            <h2 className="text-2xl font-bold">Global Insights</h2>
            <p className="text-zinc-500 text-sm">{selectedGame.title}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {notes.filter(n => n.isGlobal).length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-2">
              <Lightbulb className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-xl font-bold text-zinc-300">No global insights</h3>
            <p className="text-zinc-500 max-w-sm">Global insights are notes that apply to the game as a whole. The AI will automatically tag notes as global if they seem like general observations.</p>
          </div>
        ) : (
          notes.filter(n => n.isGlobal).slice().reverse().map(note => (
            <div key={note.id} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-wrap gap-2">
                  {note.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                      {tag}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] font-mono text-zinc-500">
                  {format(note.timestamp, 'MMM d, yyyy HH:mm')}
                </span>
              </div>
              <p className="text-zinc-300 text-lg font-medium leading-relaxed">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
