import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Image as ImageIcon, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Game as StoreGame } from '../types';

interface IGDBGame {
  id: number;
  name: string;
  cover?: {
    image_id: string;
  };
  first_release_date?: number;
  summary?: string;
  involved_companies?: {
    company: { name: string };
    developer: boolean;
    publisher: boolean;
  }[];
}

interface GameSyncModalProps {
  gameToSync: StoreGame | null;
  onClose: () => void;
  onConfirmSync: (gameId: string, igdbGame: IGDBGame) => Promise<void>;
}

export default function GameSyncModal({ gameToSync, onClose, onConfirmSync }: GameSyncModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IGDBGame[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedGameForSync, setSelectedGameForSync] = useState<IGDBGame | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (gameToSync) {
      setQuery(gameToSync.title);
      setSelectedGameForSync(null);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [gameToSync]);

  useEffect(() => {
    const searchGames = async () => {
      if (!query.trim() || !gameToSync) {
        setResults([]);
        return;
      }

      setIsSearching(true);
      setError(null);

      try {
        const response = await fetch('/api/games/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) throw new Error('Failed to search games');

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
  }, [query, gameToSync]);

  const handleConfirmSync = async () => {
    if (!gameToSync || !selectedGameForSync) return;
    setIsSyncing(true);
    try {
      await onConfirmSync(gameToSync.id, selectedGameForSync);
      onClose();
    } catch (err) {
      console.error(err);
      setError('Failed to sync game details');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AnimatePresence>
      {gameToSync && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-zinc-950/50 backdrop-blur-[12px]"
          />
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[10vh] px-4 sm:px-6 pointer-events-none">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[800px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] pointer-events-auto"
            >
              {selectedGameForSync ? (
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b border-zinc-800">
                    <h3 className="text-2xl font-bold text-white mb-2">Confirm Sync</h3>
                    <p className="text-zinc-400">
                      Sync <span className="text-white font-medium">{gameToSync.title}</span> with this IGDB entry? This will update the artwork and title.
                    </p>
                  </div>
                  
                  <div className="p-6 flex-1 overflow-y-auto">
                    <div className="flex flex-col sm:flex-row gap-6">
                      <div className="w-full sm:w-48 aspect-[3/4] bg-zinc-800 rounded-md overflow-hidden shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.35)] relative mt-0">
                        <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)] rounded-md z-20 pointer-events-none" />
                        {selectedGameForSync.cover?.image_id ? (
                          <img 
                            src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${selectedGameForSync.cover.image_id}.jpg`}
                            alt={selectedGameForSync.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-zinc-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-bold text-white mb-2">{selectedGameForSync.name}</h4>
                        {selectedGameForSync.first_release_date && (
                          <p className="text-sm text-zinc-400 mb-4">
                            Released: {new Date(selectedGameForSync.first_release_date * 1000).getFullYear()}
                          </p>
                        )}
                        <p className="text-sm text-zinc-300 line-clamp-6 leading-relaxed">
                          {selectedGameForSync.summary || 'No description available.'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/50">
                    <button
                      onClick={() => setSelectedGameForSync(null)}
                      disabled={isSyncing}
                      className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all disabled:opacity-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleConfirmSync}
                      disabled={isSyncing}
                      className="px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      Sync Game
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
                    <Search className="w-5 h-5 text-zinc-400 shrink-0" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search for a game..."
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

                    {results.length > 0 && (
                      <div className="p-2 sm:p-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {results.map((game) => (
                          <div
                            key={game.id}
                            onClick={() => setSelectedGameForSync(game)}
                            className="w-full flex items-center gap-4 p-3 sm:p-4 hover:bg-zinc-800/80 rounded-2xl transition-colors text-left group cursor-pointer border border-transparent hover:border-zinc-700/50"
                          >
                            <div className="w-14 sm:w-16 aspect-[3/4] bg-zinc-800 rounded-md overflow-hidden shrink-0 flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.35)] relative">
                              <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)] rounded-md z-20 pointer-events-none" />
                              {game.cover?.image_id ? (
                                <img 
                                  src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`}
                                  alt={game.name}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-zinc-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0 pr-2">
                              <h4 className="font-medium text-base sm:text-lg text-zinc-100 line-clamp-2 leading-tight group-hover:text-amber-400 transition-colors">
                                {game.name}
                              </h4>
                              {game.first_release_date && (
                                <p className="text-sm text-zinc-500 mt-1">
                                  {new Date(game.first_release_date * 1000).getFullYear()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
