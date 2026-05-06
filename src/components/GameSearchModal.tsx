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
  summary?: string;
  genres?: { name: string }[];
  platforms?: { name: string }[];
  involved_companies?: {
    company: { name: string };
    developer: boolean;
    publisher: boolean;
  }[];
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
  const [selectedPreviewGame, setSelectedPreviewGame] = useState<Game | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedPreviewGame(null);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handlePreviewGame = async (game: Game) => {
    setIsLoadingDetails(true);
    setSelectedPreviewGame(game); // Set initial data for immediate UI feedback
    
    try {
      const response = await fetch(`/api/games/${game.id}`);
      if (!response.ok) throw new Error('Failed to fetch game details');
      const details = await response.json();
      setSelectedPreviewGame(details);
    } catch (err) {
      console.error(err);
      // Fallback is just to keep the basic info we already had
    } finally {
      setIsLoadingDetails(false);
    }
  };

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
            {selectedPreviewGame ? (
              <button 
                onClick={() => setSelectedPreviewGame(null)}
                className="p-2 hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
              >
                <Search className="w-5 h-5 text-zinc-400" />
              </button>
            ) : (
              <Search className="w-5 h-5 text-zinc-400 shrink-0" />
            )}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (selectedPreviewGame) setSelectedPreviewGame(null);
              }}
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

          <div className="overflow-y-auto flex-1 min-h-[400px]">
            <AnimatePresence mode="wait">
              {selectedPreviewGame ? (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-5 flex flex-col gap-5"
                >
                  <div className="flex flex-col sm:flex-row gap-5">
                    <div className="w-full sm:w-36 aspect-[3/4] bg-zinc-800 rounded-xl overflow-hidden shrink-0 border border-zinc-700 shadow-xl">
                      {selectedPreviewGame.cover?.image_id ? (
                        <img 
                          src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${selectedPreviewGame.cover.image_id}.jpg`}
                          alt={selectedPreviewGame.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-zinc-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-zinc-100 tracking-tight leading-tight">
                          {selectedPreviewGame.name}
                        </h3>
                      </div>

                      <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                        <div className="space-y-0.5">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Developer</p>
                          <p className="text-sm text-zinc-300">
                            {selectedPreviewGame.involved_companies?.find(c => c.developer)?.company.name || 'Unknown'}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Publisher</p>
                          <p className="text-sm text-zinc-300">
                            {selectedPreviewGame.involved_companies?.find(c => c.publisher)?.company.name || 'Unknown'}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Release Date</p>
                          <p className="text-sm text-zinc-300">
                            {selectedPreviewGame.first_release_date 
                              ? new Date(selectedPreviewGame.first_release_date * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                              : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">About this game</p>
                    {isLoadingDetails ? (
                      <div className="space-y-2 animate-pulse">
                        <div className="h-3.5 bg-zinc-800 rounded w-full" />
                        <div className="h-3.5 bg-zinc-800 rounded w-[90%]" />
                        <div className="h-3.5 bg-zinc-800 rounded w-[95%]" />
                      </div>
                    ) : (
                      <p className="text-zinc-400 text-sm leading-relaxed font-normal line-clamp-4">
                        {selectedPreviewGame.summary || "No description available for this title."}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto pt-4 border-t border-zinc-800 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => onSelectGame(selectedPreviewGame)}
                      className="flex-[2] bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-3 rounded-xl shadow-lg shadow-amber-400/5 transition-all flex items-center justify-center gap-2 active:scale-95 text-sm"
                    >
                      ADD TO LIBRARY
                    </button>
                    <button
                      onClick={() => setSelectedPreviewGame(null)}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 rounded-xl transition-all active:scale-95 text-sm"
                    >
                      Back
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-2 space-y-1"
                >
                  {error && (
                    <div className="p-4 text-center text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  {results.length === 0 && query.trim() && !isSearching && (
                    <div className="p-8 text-center text-zinc-500">
                      No games found for "{query}"
                    </div>
                  )}

                  {results.length === 0 && !query.trim() && (
                    <div className="p-8 text-center text-zinc-500">
                      Start typing to search IGDB...
                    </div>
                  )}

                  {results.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => handlePreviewGame(game)}
                      className="w-full flex items-center gap-4 p-3 hover:bg-zinc-800/50 rounded-xl transition-colors text-left group"
                    >
                      <div className="w-12 h-16 bg-zinc-800 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-zinc-700/50">
                        {game.cover?.image_id ? (
                          <img 
                            src={`https://images.igdb.com/igdb/image/upload/t_cover_small/${game.cover.image_id}.jpg`}
                            alt={game.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
