import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Loader2, Image as ImageIcon, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getPaletteSync } from 'colorthief';

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
  onSelectGame: (game: Game, startPlaying?: boolean) => Promise<void>;
  slotNumber: number | null;
}

export default function GameSearchModal({ isOpen, onClose, onSelectGame, slotNumber }: GameSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Game[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPreviewGame, setSelectedPreviewGame] = useState<Game | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [addingState, setAddingState] = useState<'idle' | 'adding' | 'playing'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [buttonGradient, setButtonGradient] = useState<string | null>(null);
  const [buttonTextColor, setButtonTextColor] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddGame = async (game: Game, startPlaying: boolean = true, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAddingState(startPlaying ? 'playing' : 'adding');
    try {
      await onSelectGame(game, startPlaying);
    } finally {
      setAddingState('idle');
    }
  };

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
    setButtonGradient(null);
    setButtonTextColor(null);
    
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

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
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
              layout
              transition={{ layout: { duration: 0.5, ease: [0.32, 0.72, 0, 1] } }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-[800px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] pointer-events-auto"
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

          <div className="overflow-y-auto overflow-x-hidden flex-1 min-h-[400px] relative">
            <AnimatePresence mode="popLayout" initial={false}>
              {selectedPreviewGame ? (
                <motion.div
                  key="detail"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="p-5 flex flex-col max-w-[720px] mx-auto w-full h-full"
                >
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-5 sm:mb-6">
                    <div className="w-full max-w-[200px] sm:max-w-none sm:w-48 mx-auto sm:mx-0 aspect-[264/374] bg-zinc-800 rounded-md overflow-hidden shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.35)] relative mt-0 sm:mt-1.5 ">
                      <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)] rounded-md z-20 pointer-events-none" />
                      {selectedPreviewGame.cover?.image_id ? (
                        <img 
                          src={`https://images.igdb.com/igdb/image/upload/t_720p/${selectedPreviewGame.cover.image_id}.jpg`}
                          alt={selectedPreviewGame.name}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                          onLoad={(e) => {
                            try {
                              const palette = getPaletteSync(e.currentTarget, { colorCount: 8 });
                              if (palette && palette.length > 0) {
                                let vibrantColor = palette[0];
                                let maxVibrancy = -1;

                                for (const color of palette) {
                                  const { s, l } = color.hsl();
                                  // Consider colors not too dark or light
                                  if (l > 15 && l < 85) {
                                    // Vividness score based primarily on saturation, with a slight penalty for being too dark or light
                                    const score = s - Math.abs(50 - l) * 0.5;
                                    if (score > maxVibrancy) {
                                      maxVibrancy = score;
                                      vibrantColor = color;
                                    }
                                  }
                                }

                                const { h, s, l } = vibrantColor.hsl();
                                
                                // Ensure the base color has some punch
                                const baseS = Math.max(s, 50); 
                                const baseL = Math.max(Math.min(l, 60), 30);
                                
                                // Lighting effect: very bright top highlight, solid mid hue, deep dark edges
                                const lightVariation = `hsl(${h}, ${Math.min(baseS + 20, 100)}%, ${Math.min(baseL + 30, 85)}%)`;
                                const baseVariation = `hsl(${h}, ${baseS}%, ${baseL}%)`;
                                const darkVariation = `hsl(${h}, ${Math.min(baseS + 15, 100)}%, ${Math.max(baseL - 25, 15)}%)`;
                                
                                setButtonGradient(`radial-gradient(120% 120% at 50% 0%, ${lightVariation} 0%, ${baseVariation} 40%, ${darkVariation} 100%)`);
                                setButtonTextColor(vibrantColor.textColor);
                              }
                            } catch (err) {
                              console.warn("Could not extract colors from image.", err);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-zinc-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 flex flex-col">
                      {isLoadingDetails ? (
                        <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] bg-zinc-900/20 border border-zinc-800/30 rounded-xl ml-0 sm:ml-4 sm:mt-1.5 mt-4">
                          <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-4" />
                          <p className="text-zinc-500 font-bold tracking-widest text-xs uppercase">Loading Details...</p>
                        </div>
                      ) : (
                        <>
                          <div className="pl-[13px] sm:pl-[11px] sm:ml-2 pt-2 text-zinc-100">
                            <h3 className="text-2xl sm:text-3xl font-medium tracking-tight leading-tight">
                              {selectedPreviewGame.name}
                            </h3>
                          </div>

                          <div className="mt-3 sm:mt-4 ml-0 sm:ml-2 bg-zinc-900/40 border border-zinc-800/60 pr-3 pl-3 sm:pl-2.5 py-2 sm:py-4 flex flex-col gap-4 sm:gap-5">
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

                            <div className="space-y-2">
                              <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">About this game</p>
                              <p className="text-zinc-400 text-sm leading-relaxed font-normal line-clamp-4">
                                {selectedPreviewGame.summary || "No description available for this title."}
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-zinc-800 flex flex-col sm:flex-row gap-3 pb-1 sm:pb-2.5">
                    <button
                      onClick={() => handleAddGame(selectedPreviewGame, false)}
                      disabled={addingState !== 'idle' || isLoadingDetails}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 font-semibold py-3 rounded-xl transition-all active:scale-95 text-sm order-2 sm:order-1 flex items-center justify-center gap-2"
                    >
                      {addingState === 'adding' ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>ADDING...</span>
                        </>
                      ) : (
                        <span>ADD TO LIBRARY</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleAddGame(selectedPreviewGame, true)}
                      disabled={addingState !== 'idle' || isLoadingDetails}
                      style={{ 
                        background: buttonGradient || undefined,
                        color: buttonTextColor || undefined
                      }}
                      className={`flex-[2] ${!buttonGradient ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950' : ''} disabled:opacity-50 disabled:cursor-not-allowed font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 text-sm relative overflow-hidden order-1 sm:order-2`}
                    >
                      <div className="absolute inset-0 bg-white/0 hover:bg-white/20 transition-colors pointer-events-none" />
                      {addingState === 'playing' ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                          <span className="relative z-10">CREATING SESSION...</span>
                        </>
                      ) : (
                        <span className="relative z-10">START PLAYING</span>
                      )}
                    </button>
                  </div>
                </motion.div>
              ) : (
                  <motion.div
                  key="list"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                  className="p-2 sm:p-4 flex flex-col gap-4 relative"
                >
                  {addingState !== 'idle' && (
                     <div className="absolute inset-0 bg-zinc-900/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-xl">
                        <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-4" />
                        <p className="font-bold text-zinc-100 uppercase tracking-widest text-sm">
                           {addingState === 'playing' ? 'Building Session...' : 'Adding...'}
                        </p>
                     </div>
                  )}
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

                  {results.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      {results.map((game) => (
                        <div
                          key={game.id}
                          onClick={() => addingState === 'idle' && handlePreviewGame(game)}
                          className="w-full flex items-center gap-4 p-3 sm:p-4 hover:bg-zinc-800/80 rounded-2xl transition-colors text-left group cursor-pointer border border-transparent hover:border-zinc-700/50"
                        >
                          <div className="w-14 sm:w-16 aspect-[264/374] bg-zinc-800 rounded-md overflow-hidden shrink-0 flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.35)] relative">
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
                            <h4 className="font-medium text-base sm:text-lg text-zinc-100 line-clamp-2 group-hover:text-amber-400 transition-colors leading-tight">
                              {game.name}
                            </h4>
                            {game.first_release_date && (
                              <p className="text-sm text-zinc-500 mt-1">
                                {new Date(game.first_release_date * 1000).getFullYear()}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={(e) => handleAddGame(game, false, e)}
                            disabled={addingState !== 'idle'}
                            className="opacity-0 group-hover:opacity-100 p-2.5 rounded-full hover:bg-zinc-700 disabled:opacity-0 text-zinc-400 hover:text-amber-400 transition-all active:scale-95 shrink-0 bg-zinc-800 shadow-sm md:block hidden"
                            title="Add to library"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
