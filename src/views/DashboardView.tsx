import React, { useState } from 'react';
import { Plus, Gamepad2, Clock, Feather, X } from 'lucide-react';
import { format } from 'date-fns';
import { useGameContext } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';

export default function DashboardView() {
  const { user } = useAuth();
  const { navigateTo } = useUI();
  const {
    games,
    gamesLimit,
    loadMoreGames,
    handleAddGame,
    handleImportDeadSpace2Logs
  } = useGameContext();

  const [isAddingGame, setIsAddingGame] = useState(false);
  const [newGameTitle, setNewGameTitle] = useState('');

  const submitGame = async () => {
    if (!newGameTitle.trim()) return;
    await handleAddGame(newGameTitle);
    setNewGameTitle('');
    setIsAddingGame(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Your Library</h2>
        <div className="flex gap-3">
          {user?.email === 'kyledk05@gmail.com' && (
            <button 
              onClick={handleImportDeadSpace2Logs}
              className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-5 py-2 rounded-full font-bold text-sm hover:text-zinc-100 transition-all"
            >
              Import Dead Space 2 Logs
            </button>
          )}
          <button 
            onClick={() => setIsAddingGame(true)}
            className="bg-zinc-100 text-zinc-950 px-5 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-white transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add Game
          </button>
        </div>
      </div>

      {isAddingGame && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            placeholder="Game Title (e.g. Elden Ring)"
            value={newGameTitle}
            onChange={(e) => setNewGameTitle(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-3 focus:outline-none focus:border-zinc-100 transition-colors"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && submitGame()}
          />
          <div className="flex gap-2">
            <button 
              onClick={submitGame}
              className="flex-1 sm:flex-none bg-zinc-100 text-zinc-950 px-8 py-3 rounded-2xl font-bold"
            >
              Add
            </button>
            <button 
              onClick={() => setIsAddingGame(false)}
              className="p-3 text-zinc-500 hover:text-zinc-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map(game => (
          <div 
            key={game.id}
            onClick={() => navigateTo('game-detail', game, null)}
            className="relative group bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-left hover:border-zinc-700 transition-all hover:shadow-xl flex flex-col cursor-pointer hover:-translate-y-1 h-full"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:bg-zinc-100 transition-colors">
                <Gamepad2 className="w-6 h-6 text-zinc-500 group-hover:text-zinc-950" />
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 bg-zinc-950 px-2 py-1 rounded">
                {game.status}
              </span>
            </div>
            <h3 className="text-xl font-bold mb-1 truncate pr-8">{game.title}</h3>
            <p className="text-zinc-500 text-xs flex items-center gap-1 mt-auto pr-12">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">Last played {format(game.updatedAt, 'MMM d, yyyy')}</span>
            </p>
            
            {/* Quick Note Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateTo('quick-note', game, null);
              }}
              className="absolute bottom-5 right-5 w-10 h-10 bg-zinc-100 text-zinc-950 rounded-xl flex items-center justify-center opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 hover:bg-white shadow-lg hover:scale-105"
              title="Quick Note"
            >
              <Feather className="w-5 h-5" />
            </button>
          </div>
        ))}
        
        {games.length === 0 && !isAddingGame && (
          <div className="col-span-full py-32 text-center border-2 border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-2">
              <Gamepad2 className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-xl font-bold text-zinc-300">No games yet</h3>
            <p className="text-zinc-500 max-w-sm">Your library is empty. Add a game to start tracking your progress, thoughts, and strategies.</p>
            <button 
              onClick={() => setIsAddingGame(true)}
              className="mt-4 bg-zinc-100 text-zinc-950 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-white transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Add Your First Game
            </button>
          </div>
        )}
      </div>
      
      {games.length >= gamesLimit && (
        <div className="flex justify-center mt-8">
          <button 
            onClick={loadMoreGames}
            className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-6 py-3 rounded-full font-bold text-sm hover:text-zinc-100 hover:bg-zinc-800 transition-all"
          >
            Load More Games
          </button>
        </div>
      )}
    </div>
  );
}
