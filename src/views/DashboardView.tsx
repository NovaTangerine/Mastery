import React, { useState } from 'react';
import { Plus, Gamepad2, Clock, Play, X, Trophy, MoreVertical, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Game, GameSession } from '../types';
import { useGameContext } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import GameSearchModal from '../components/GameSearchModal';

export default function DashboardView() {
  const { user } = useAuth();
  const { navigateTo } = useUI();
  const {
    games,
    gamesLimit,
    loadMoreGames,
    handleAddGame,
    handleDeleteGame
  } = useGameContext();

  const [isAddingGame, setIsAddingGame] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [deleteInfo, setDeleteInfo] = useState<{ sessions: number, notes: number } | null>(null);
  const [isCheckingDelete, setIsCheckingDelete] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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
      const sessionsQuery = query(collection(db, 'sessions'), where('gameId', '==', game.id));
      const sessionsSnap = await getDocs(sessionsQuery);
      
      const notesQuery = query(collection(db, 'notes'), where('gameId', '==', game.id));
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

  const handleQuickResume = async (e: React.MouseEvent, game: Game) => {
    e.stopPropagation();
    try {
      const q = query(
        collection(db, 'sessions'),
        where('gameId', '==', game.id),
        orderBy('startTime', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const sessionDoc = snapshot.docs[0];
        const sessionData = { id: sessionDoc.id, ...sessionDoc.data() } as GameSession;
        navigateTo('session-view', game, sessionData);
      } else {
        navigateTo('game-detail', game, null);
      }
    } catch (error) {
      console.error("Error fetching latest session", error);
      navigateTo('game-detail', game, null);
    }
  };

  const handleSelectGame = async (game: any) => {
    const coverUrl = game.cover?.image_id 
      ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
      : undefined;
      
    const newGameId = await handleAddGame(game.name, coverUrl);
    setIsAddingGame(false);
    
    if (newGameId) {
      // Create a partial game object that navigation can use
      // The GameProvider will find the full record in the games array
      navigateTo('game-detail', { id: newGameId, title: game.name } as Game, null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <GameSearchModal 
        isOpen={isAddingGame}
        onClose={() => setIsAddingGame(false)}
        onSelectGame={handleSelectGame}
        slotNumber={null}
      />

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Your Library</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsAddingGame(true)}
            className="bg-zinc-100 text-zinc-950 px-5 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-white transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Add Game
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {games.map(game => (
          <div 
            key={game.id}
            onClick={() => navigateTo('game-detail', game, null)}
            className="relative group bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-left hover:border-zinc-700 transition-all hover:shadow-xl flex flex-col cursor-pointer hover:-translate-y-1 h-full"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:bg-zinc-700 transition-colors duration-500 group-hover:delay-[150ms]">
                <Gamepad2 className="w-6 h-6 text-zinc-500 group-hover:text-white transition-colors duration-500 group-hover:delay-[150ms]" />
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
            </div>
            <h3 className="text-xl font-bold mb-1 truncate pr-8">{game.title}</h3>
            <p className="text-zinc-500 text-xs flex items-center gap-1 mt-auto pr-12">
              <Clock className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">Last played {format(game.updatedAt, 'MMM d, yyyy')}</span>
            </p>
            
            {/* Quick Resume Button */}
            <button
              onClick={(e) => handleQuickResume(e, game)}
              className="absolute bottom-5 right-5 w-10 h-10 bg-zinc-100 text-zinc-950 rounded-xl flex items-center justify-center opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 ease-out hover:bg-white shadow-lg hover:scale-105"
              title="Resume Last Session"
            >
              <Play className="w-5 h-5 ml-1" />
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
