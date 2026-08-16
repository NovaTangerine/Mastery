import React, { useState, useEffect } from 'react';
import { Plus, Gamepad2, Clock, Play, X, Trophy, MoreVertical, Trash2, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Game, GameSession } from '../types';
import { useGameContext } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import GameSearchModal from '../components/GameSearchModal';
import GameSyncModal from '../components/GameSyncModal';

export default function DashboardView() {
  const { user } = useAuth();
  const { navigateTo } = useUI();
  const [layout, setLayout] = useState<'3col' | '2col' | '3col-art'>('3col-art');
  const [displayLayout, setDisplayLayout] = useState<'3col' | '2col' | '3col-art'>('3col-art');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleLayoutChange = (newLayout: '3col' | '2col' | '3col-art') => {
    if (layout === newLayout || isTransitioning) return;
    setIsTransitioning(true);
    setLayout(newLayout);
    
    setTimeout(() => {
      setDisplayLayout(newLayout);
      setIsTransitioning(false);
    }, 400);
  };

  const {
    games,
    gamesLimit,
    loadMoreGames,
    handleAddGame,
    handleDeleteGame,
    handleUpdateGameDetails
  } = useGameContext();

  const [isAddingGame, setIsAddingGame] = useState(false);
  const [justAddedGameId, setJustAddedGameId] = useState<string | null>(null);
  const [syncTargetGame, setSyncTargetGame] = useState<Game | null>(null);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [deleteInfo, setDeleteInfo] = useState<{ sessions: number, notes: number } | null>(null);
  const [isCheckingDelete, setIsCheckingDelete] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const shuffledIndices = React.useMemo(() => {
    const indices = Array.from({ length: games.length }).map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
       const j = Math.floor(Math.random() * (i + 1));
       [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, [games.length]);

  // --- Smart Tooltip State ---
  const [hoveredGameId, setHoveredGameId] = useState<string | null>(null);
  const [isRapidTooltip, setIsRapidTooltip] = useState(false);
  const tooltipEnterTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipLeaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnterTooltip = (gameId: string) => {
    if (tooltipLeaveTimeoutRef.current) {
        clearTimeout(tooltipLeaveTimeoutRef.current);
        tooltipLeaveTimeoutRef.current = null;
    }
    
    if (isRapidTooltip) {
      setHoveredGameId(gameId);
    } else {
      tooltipEnterTimeoutRef.current = setTimeout(() => {
        setIsRapidTooltip(true);
        setHoveredGameId(gameId);
      }, 500); // Wait 500ms before initial pop
    }
  };

  const handleMouseLeaveTooltip = () => {
    if (tooltipEnterTimeoutRef.current) {
      clearTimeout(tooltipEnterTimeoutRef.current);
      tooltipEnterTimeoutRef.current = null;
    }
    setHoveredGameId(null);
    
    tooltipLeaveTimeoutRef.current = setTimeout(() => {
      setIsRapidTooltip(false);
    }, 300); // 300ms window to move to another poster without losing rapid state
  };
  // ---------------------------

  React.useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuId(null);
    };
    if (openMenuId) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('touchend', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchend', handleClickOutside);
    };
  }, [openMenuId]);

  const toggleMenu = (e: React.MouseEvent, gameId: string) => {
    e.stopPropagation();
    setOpenMenuId(prev => prev === gameId ? null : gameId);
  };

  const handleDeleteClick = async (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    setGameToDelete(game);
    setIsCheckingDelete(true);
    setDeleteInfo(null);
    try {
      const sessionsQuery = query(collection(db, 'sessions'), where('gameId', '==', game.id), where('uid', '==', user!.uid));
      const sessionsSnap = await getDocs(sessionsQuery);
      
      const notesQuery = query(collection(db, 'notes'), where('gameId', '==', game.id), where('uid', '==', user!.uid));
      const notesSnap = await getDocs(notesQuery);
      
      const sCount = sessionsSnap.size;
      const nCount = notesSnap.size;
      
      if (sCount === 0 && nCount === 0) {
         await handleDeleteGame(game.id);
         setGameToDelete(null);
      } else {
         setDeleteInfo({ sessions: sCount, notes: nCount });
      }
    } catch (err) {
      console.error(err);
      setGameToDelete(null);
    } finally {
      setIsCheckingDelete(false);
    }
  };

  const confirmDelete = async () => {
     if (gameToDelete) {
        await handleDeleteGame(gameToDelete.id);
        setGameToDelete(null);
        setDeleteInfo(null);
     }
  };

  const cancelDelete = () => {
     setGameToDelete(null);
     setDeleteInfo(null);
  };

  const resumeOrCreateSession = async (game: Game) => {
    try {
      const q = query(
        collection(db, 'sessions'),
        where('gameId', '==', game.id), where('uid', '==', user!.uid),
        orderBy('startTime', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const sessionDoc = snapshot.docs[0];
        const sessionData = { id: sessionDoc.id, ...sessionDoc.data() } as GameSession;
        navigateTo('session-view', game, sessionData);
      } else {
        const { addDoc } = await import('firebase/firestore');
        const now = new Date();
        const hour = now.getHours();
        let timeOfDay = 'Morning';
        if (hour >= 12 && hour < 17) timeOfDay = 'Afternoon';
        else if (hour >= 17 && hour < 21) timeOfDay = 'Evening';
        else if (hour >= 21 || hour < 4) timeOfDay = 'Night';

        const sessionName = `${format(now, 'MMM d')}, ${timeOfDay} Session`;
        const sessionData: any = {
          name: sessionName,
          gameId: game.id,
          uid: user!.uid,
          startTime: now.getTime(),
          progressMarker: 'Starting session',
        };
        const docRef = await addDoc(collection(db, 'sessions'), sessionData);
        const newSession = { id: docRef.id, ...sessionData } as GameSession;
        navigateTo('session-view', game, newSession);
      }
    } catch (error) {
      console.error("Error creating or fetching session", error);
    }
  };

  const handleQuickResume = async (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    await resumeOrCreateSession(game);
  };

  const handleToggleBoxArt = async (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    setOpenMenuId(null);
    const dsCover = "https://images.igdb.com/igdb/image/upload/t_720p/cobksg.jpg";
    const isSwapped = game.coverUrl === dsCover;
    
    if (isSwapped) {
      const originalCover = localStorage.getItem(`originalCover_${game.id}`);
      await handleUpdateGameDetails(game.id, game.title, originalCover || null);
    } else {
      if (game.coverUrl) {
        localStorage.setItem(`originalCover_${game.id}`, game.coverUrl);
      } else {
        localStorage.removeItem(`originalCover_${game.id}`);
      }
      await handleUpdateGameDetails(game.id, game.title, dsCover);
    }
  };

  const handleSelectGame = async (game: any, startPlaying: boolean = true) => {
    const coverUrl = game.cover?.image_id 
      ? `https://images.igdb.com/igdb/image/upload/t_720p/${game.cover.image_id}.jpg`
      : undefined;
      
    const newGameId = await handleAddGame(game.name, coverUrl);
    
    if (newGameId) {
      if (startPlaying) {
        await resumeOrCreateSession({ id: newGameId, title: game.name } as Game);
      } else {
        setJustAddedGameId(newGameId);
        setTimeout(() => setJustAddedGameId(null), 3000);
      }
    }
    
    setIsAddingGame(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      <GameSearchModal  
        isOpen={isAddingGame}
        onClose={() => setIsAddingGame(false)}
        onSelectGame={handleSelectGame}
        slotNumber={null}
      />

      <GameSyncModal
        gameToSync={syncTargetGame}
        onClose={() => setSyncTargetGame(null)}
        onConfirmSync={async (gameId, igdbGame) => {
          const coverUrl = igdbGame.cover?.image_id 
            ? `https://images.igdb.com/igdb/image/upload/t_720p/${igdbGame.cover.image_id}.jpg`
            : undefined;
          await handleUpdateGameDetails(gameId, igdbGame.name, coverUrl);
        }}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Your Library</h2>
        <div className="flex gap-3">
          <div className="flex bg-zinc-900 border border-zinc-800 rounded-full p-1 self-center hidden sm:flex">
            <button
              onClick={() => handleLayoutChange('2col')}
              className={`p-1.5 rounded-full transition-all ${layout === '2col' ? 'bg-zinc-800 text-amber-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="2 Column Layout"
            >
              <div className="flex gap-[3px] items-center justify-center w-5 h-5">
                <div className="w-2 h-[14px] bg-current rounded-[2px]" />
                <div className="w-2 h-[14px] bg-current rounded-[2px]" />
              </div>
            </button>
            <button
              onClick={() => handleLayoutChange('3col')}
              className={`p-1.5 rounded-full transition-all ${layout === '3col' ? 'bg-zinc-800 text-amber-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="3 Column Layout"
            >
              <div className="flex gap-[2px] items-center justify-center w-5 h-5">
                <div className="w-[5px] h-[14px] bg-current rounded-[2px]" />
                <div className="w-[5px] h-[14px] bg-current rounded-[2px]" />
                <div className="w-[5px] h-[14px] bg-current rounded-[2px]" />
              </div>
            </button>
            <button
              onClick={() => handleLayoutChange('3col-art')}
              className={`p-1.5 rounded-full transition-all ${layout === '3col-art' ? 'bg-zinc-800 text-amber-400 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="3 Column Layout with Art"
            >
              <div className="flex gap-[2px] items-center justify-center w-5 h-5">
                <div className="w-[4px] h-[14px] border-[1.5px] border-current rounded-[1px] opacity-70" />
                <div className="w-[4px] h-[14px] bg-current rounded-[1px]" />
                <div className="w-[4px] h-[14px] bg-current rounded-[1px]" />
              </div>
            </button>
          </div>
          <button 
            onClick={async () => {
              const newGameId = await handleAddGame("Acme Gaming");
              if (newGameId) {
                await resumeOrCreateSession({ id: newGameId, title: "Acme Gaming" } as Game);
              }
            }}
            className="bg-indigo-500/20 text-indigo-400 px-5 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-indigo-500/30 transition-all active:scale-95 hidden lg:flex"
          >
            Acme Test
          </button>
          <button 
            onClick={() => setIsAddingGame(true)}
            className="bg-zinc-100 text-zinc-950 px-5 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-white transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add Game
          </button>
        </div>
      </div>

      <div className={`grid ${layout === '3col-art' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-2 sm:gap-x-3 gap-y-3 sm:gap-y-4' : `grid-cols-1 sm:grid-cols-2 ${layout.startsWith('3col') ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-3 sm:gap-4 lg:gap-6`}`}>
        {isTransitioning ? (
          games.map(game => (
            <div 
              key={`skeleton-${game.id}`} 
              className={`bg-zinc-800/50 animate-pulse ${layout === '3col-art' ? 'aspect-[264/374] rounded-md' : 'h-[160px] rounded-3xl'}`}
            />
          ))
        ) : (
          games.map((game, index) => (
            displayLayout === '3col-art' ? (
            <div 
              key={game.id}
              onClick={() => resumeOrCreateSession(game)}
              onMouseEnter={() => handleMouseEnterTooltip(game.id)}
              onMouseLeave={handleMouseLeaveTooltip}
              className={`relative group aspect-[264/374] rounded-md cursor-pointer transition-all block shadow-[0_1px_3px_rgba(0,0,0,0.35)] animate-in fade-in duration-300 ${justAddedGameId === game.id ? 'ring-2 ring-amber-400 animate-pulse shadow-[0_0_15px_rgba(251,191,36,0.3)]' : ''}`}
            >
              {/* Tooltip */}
              <div 
                className={`absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-[100] pointer-events-none whitespace-nowrap transition-opacity duration-150 ${hoveredGameId === game.id ? 'opacity-100' : 'opacity-0'}`}
              >
                <div className="relative bg-[#1f2326] text-zinc-100 text-xs font-semibold px-2.5 py-1.5 rounded shadow-xl border border-zinc-700/50">
                  {game.title}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[5px] border-transparent border-t-zinc-700/50">
                    <div className="absolute -top-[6px] -left-[4px] border-[4px] border-transparent border-t-[#1f2326]" />
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 bg-zinc-900 rounded-md overflow-hidden">
                <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)] rounded-md z-20 pointer-events-none" />
                {game.coverUrl ? (
                  <BlurRevealImage 
                    url={game.coverUrl.replace('t_cover_big', 't_720p')} 
                    alt={game.title} 
                    className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.03]" 
                    revealDelay={(shuffledIndices[index] || 0) * 40}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 text-zinc-500 font-bold p-4 text-center transition-all duration-700 ease-out group-hover:scale-[1.03]">
                    <Gamepad2 className="w-8 h-8 mb-2 opacity-30" />
                    <span className="text-xs leading-tight opacity-70">{game.title}</span>
                  </div>
                )}
              </div>
              
              {/* Hover Border Effect */}
              <div className="absolute inset-0 z-30 rounded-md pointer-events-none transition-all duration-[150ms] ease-out shadow-[inset_0_0_0_0px_rgba(255,255,255,1)] group-hover:shadow-[inset_0_0_0_2.5px_rgba(255,255,255,1)]" />
              
              <div className="absolute top-3 right-3 z-30">
                <div className={`transition-all duration-300 transform ${openMenuId === game.id ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'}`}>
                  {game.status === 'completed' && (
                    <span className="flex items-center justify-center w-8 h-8 bg-black/50 backdrop-blur-md rounded-full border border-amber-400/30 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                      <Trophy className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>

              {/* Ellipse Menu triggered on hover */}
              <div className={`absolute top-2 left-2 z-30 flex items-center justify-center transition-all duration-300 group-hover:scale-105 ${openMenuId === game.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <button
                  onClick={(e) => toggleMenu(e, game.id)}
                  className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-md hover:bg-black/80 flex items-center justify-center text-white transition-colors border border-white/10"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                
                {openMenuId === game.id && (
                  <div className="absolute left-0 top-full mt-2 w-48 bg-zinc-800 rounded-xl shadow-xl z-[60] border border-zinc-700 overflow-hidden">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        setSyncTargetGame(game);
                      }}
                      className="hidden sm:flex w-full text-left px-4 py-3 text-zinc-300 hover:text-amber-400 hover:bg-zinc-700/50 items-center gap-2 transition-colors font-bold text-sm border-b border-zinc-700/50"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Sync with IGDB
                    </button>
                    {game.title === 'Zero Parades: For Dead Spies' && (
                      <button
                        onClick={(e) => handleToggleBoxArt(e, game)}
                        className="w-full text-left px-4 py-3 text-zinc-300 hover:bg-zinc-700/50 flex items-center gap-2 transition-colors font-semibold text-sm border-b border-zinc-700/50"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Swap Box Art
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(null);
                        handleDeleteClick(e, game);
                      }}
                      className="w-full text-left px-4 py-3 text-red-400 hover:bg-zinc-700/50 flex items-center gap-2 transition-colors font-bold text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Game
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div 
              key={game.id}
              onClick={() => resumeOrCreateSession(game)}
              className={`relative group bg-zinc-900 border ${justAddedGameId === game.id ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)] animate-pulse' : 'border-zinc-800 hover:border-zinc-700 hover:shadow-xl'} rounded-3xl p-6 text-left transition-all flex flex-col cursor-pointer hover:-translate-y-1 h-full animate-in fade-in duration-300`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:bg-zinc-700 transition-colors duration-500 group-hover:delay-[150ms]">
                  <Gamepad2 className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors duration-500 group-hover:delay-[150ms]" />
                </div>
              </div>
                
              <div className="flex items-center absolute right-6 top-6">
                <div className={`transition-all duration-300 group-hover:delay-75 transform ${openMenuId === game.id ? '-translate-x-10' : 'group-hover:-translate-x-10'}`}>
                  {game.status === 'completed' ? (
                    <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded shadow-[0_0_10px_rgba(251,191,36,0.1)] whitespace-nowrap">
                      <Trophy className="w-3 h-3" />
                      Completed
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 bg-zinc-950 px-2 py-1 rounded whitespace-nowrap">
                      {game.status}
                    </span>
                  )}
                </div>
                
                <div className={`absolute right-0 flex items-center justify-center transition-opacity duration-300 group-hover:delay-75 ${openMenuId === game.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <button
                    onClick={(e) => toggleMenu(e, game.id)}
                    className="w-8 h-8 rounded-full hover:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-100 transition-colors"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  
                  {openMenuId === game.id && (
                    <div 
                      className="absolute right-0 top-full mt-2 w-48 bg-zinc-800 rounded-xl shadow-xl z-[60] border border-zinc-700 overflow-hidden"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          setSyncTargetGame(game);
                        }}
                        className="hidden sm:flex w-full text-left px-4 py-3 text-zinc-300 hover:text-amber-400 hover:bg-zinc-700/50 items-center gap-2 transition-colors font-bold text-sm border-b border-zinc-700/50"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Sync with IGDB
                      </button>
                    {game.title === 'Zero Parades: For Dead Spies' && (
                      <button
                        onClick={(e) => handleToggleBoxArt(e, game)}
                        className="w-full text-left px-4 py-3 text-zinc-300 hover:bg-zinc-700/50 flex items-center gap-2 transition-colors font-semibold text-sm border-b border-zinc-700/50"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Swap Box Art
                      </button>
                    )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(null);
                          handleDeleteClick(e, game);
                        }}
                        className="w-full text-left px-4 py-3 text-red-400 hover:bg-zinc-700/50 flex items-center gap-2 transition-colors font-bold text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete Game
                      </button>
                    </div>
                  )}
                </div>
              </div>
  
              <div className="flex flex-col min-w-0">
                <h3 className="text-xl font-medium tracking-tight mb-1 truncate pr-8">{game.title}</h3>
                <p className="text-zinc-500 text-xs flex items-center gap-1 mt-auto pr-12">
                  <Clock className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">Last played {format(game.updatedAt, 'MMM d, yyyy')}</span>
                </p>
              </div>
              
              {/* Quick Resume Button */}
              <button
                onClick={(e) => handleQuickResume(e, game)}
                className="absolute bottom-5 right-5 w-10 h-10 bg-zinc-100 text-zinc-950 rounded-xl flex items-center justify-center opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 ease-out hover:bg-white shadow-lg hover:scale-105"
                title="Resume Last Session"
              >
                <Play className="w-5 h-5 ml-1" />
              </button>
            </div>
          )
        )))}
        
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

      {deleteInfo && gameToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-2 text-white">Delete Library Game?</h3>
            <p className="text-zinc-400 text-sm mb-6">
              You are about to delete <span className="font-bold text-white">{gameToDelete.title}</span>.
              <br/><br/>
              This game contains:
            </p>
            <ul className="list-disc ml-5 mt-[-16px] mb-6 text-zinc-300 text-sm">
              <li>{deleteInfo.sessions} session{deleteInfo.sessions !== 1 && 's'}</li>
              <li>{deleteInfo.notes} note{deleteInfo.notes !== 1 && 's'}</li>
            </ul>
            <p className="text-zinc-400 text-sm mb-6 font-bold text-red-400">
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={cancelDelete}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold py-3 rounded-xl transition-colors"
              >
                Delete Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BlurRevealImage({ url, alt, className, revealDelay }: { url: string, alt: string, className?: string, revealDelay?: number }) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  
  // Use passed delay or fallback to random
  const fallbackDelay = React.useMemo(() => Math.floor(Math.random() * 600), []);
  const delay = revealDelay !== undefined ? revealDelay : fallbackDelay;
  const [transitionDone, setTransitionDone] = useState(false);

  const handleImageLoaded = () => {
    // Wait a tiny bit before triggering the transition to ensure the initial blurry state has rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setLoaded(true);
      });
    });
  };

  React.useEffect(() => {
    if (imgRef.current?.complete) {
      handleImageLoaded();
    }
  }, [url]);

  React.useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => {
        setTransitionDone(true);
      }, delay + 700); // Wait for delay + transition duration
      return () => clearTimeout(timer);
    }
  }, [loaded, delay]);
  
  return (
    <>
      <div 
        className={`absolute inset-0 bg-zinc-800 transition-opacity duration-700 z-10 pointer-events-none ${loaded ? 'opacity-0' : 'animate-pulse'}`} 
        style={{ transitionDelay: loaded ? `${delay}ms` : '0ms' }}
      />
      <img
        ref={imgRef}
        src={url}
        alt={alt}
        onLoad={handleImageLoaded}
        className={`${className || ''} ${loaded ? 'opacity-100 blur-none' : 'opacity-0 blur-md'}`}
        style={{ transitionDelay: transitionDone ? '0ms' : `${loaded ? delay : 0}ms` }}
      />
    </>
  );
}
