import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Game {
  id: number;
  name: string;
  cover?: {
    image_id: string;
  };
  first_release_date?: number;
}

interface GameSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGame: (game: Game) => void;
  slotNumber: number | null;
}

export default function GameSearchModal({ isOpen, onClose, onSelectGame, slotNumber }: GameSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Game[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const searchGames = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await fetch('/api/games/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          throw new Error('Failed to search games');
        }

        const data = await response.json();
        setResults(data);
      } catch (err) {
        console.error(err);
        setError('Failed to search games. Please try again.');
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchGames, 500);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4 sm:px-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm"
        />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
            <Search className="w-5 h-5 text-zinc-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={slotNumber !== null ? `Search for a game for Slot ${slotNumber}...` : "Search for a game..."}
              className="flex-1 bg-transparent border-none text-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-0"
            />
            {isSearching && <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
            >
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          <div className="overflow-y-auto p-2 flex-1">
            {error && (
              <div className="p-4 text-center text-red-400 text-sm">
                {error}
              </div>
            )}

            {!error && results.length === 0 && query.trim() && !isSearching && (
              <div className="p-8 text-center text-zinc-500">
                No games found for "{query}"
              </div>
            )}

            {!error && results.length === 0 && !query.trim() && (
              <div className="p-8 text-center text-zinc-500">
                Start typing to search IGDB...
              </div>
            )}

            <div className="space-y-1">
              {results.map((game) => (
                <button
                  key={game.id}
                  onClick={() => onSelectGame(game)}
                  className="w-full flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-xl transition-colors text-left group"
                >
                  <div className="w-12 h-16 bg-zinc-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-zinc-700/50">
                    {game.cover?.image_id ? (
                      <img 
                        src={`https://images.igdb.com/igdb/image/upload/t_cover_small/${game.cover.image_id}.jpg`}
                        alt={game.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-zinc-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-zinc-100 truncate group-hover:text-amber-400 transition-colors">
                      {game.name}
                    </h4>
                    {game.first_release_date && (
                      <p className="text-sm text-zinc-500">
                        {new Date(game.first_release_date * 1000).getFullYear()}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
