import React, { useEffect, useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { useGameContext } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, Plus, PlayCircle, Calendar, Star, Loader2, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface IGDBGameDetails {
  id: number;
  name: string;
  summary?: string;
  first_release_date?: number;
  aggregated_rating?: number;
  cover?: {
    image_id: string;
  };
  screenshots?: {
    image_id: string;
  }[];
  genres?: {
    name: string;
  }[];
  platforms?: {
    name: string;
  }[];
  involved_companies?: {
    developer: boolean;
    company: {
      name: string;
    };
  }[];
}

export default function IGDBGameView() {
  const { selectedIgdbId, navigateTo } = useUI();
  const { user } = useAuth();
  const { handleAddGame, games } = useGameContext();
  const [game, setGame] = useState<IGDBGameDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if game is already in library
  const existingGame = games.find(g => g.title === game?.name);

  useEffect(() => {
    const fetchGameDetails = async () => {
      if (!selectedIgdbId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/games/${selectedIgdbId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch game details');
        }
        const data = await response.json();
        setGame(data);
      } catch (err) {
        console.error(err);
        setError('Could not load game details.');
      } finally {
        setLoading(false);
      }
    };

    fetchGameDetails();
  }, [selectedIgdbId]);

  const handleGoToSession = async () => {
    if (!existingGame) return;
    try {
      const { collection, query, where, orderBy, limit, getDocs, addDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');

      const q = query(
        collection(db, 'sessions'),
        where('gameId', '==', existingGame.id), where('uid', '==', user!.uid),
        orderBy('startTime', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const sessionDoc = snapshot.docs[0];
        const sessionData = { id: sessionDoc.id, ...sessionDoc.data() } as any;
        navigateTo('session-view', existingGame, sessionData);
      } else {
        const now = new Date();
        const hour = now.getHours();
        let timeOfDay = 'Morning';
        if (hour >= 12 && hour < 17) timeOfDay = 'Afternoon';
        else if (hour >= 17 && hour < 21) timeOfDay = 'Evening';
        else if (hour >= 21 || hour < 4) timeOfDay = 'Night';

        const { format } = await import('date-fns');
        const sessionName = `${format(now, 'MMM d')}, ${timeOfDay} Session`;
        
        const sessionData: any = {
          name: sessionName,
          gameId: existingGame.id,
          uid: user!.uid,
          startTime: now.getTime(),
          progressMarker: 'Starting session',
        };
        const docRef = await addDoc(collection(db, 'sessions'), sessionData);
        const newSession = { id: docRef.id, ...sessionData };
        navigateTo('session-view', existingGame, newSession);
      }
    } catch (error) {
      console.error("Error creating or fetching session", error);
    }
  };

  const onAddGame = async () => {
    if (!game) return;
    const coverUrl = game.cover?.image_id 
      ? `https://images.igdb.com/igdb/image/upload/t_720p/${game.cover.image_id}.jpg`
      : undefined;
    
    // We navigate to dashboard so the user can easily click the game from there, 
    // or we could handle quick resume logic directly if handleAddGame returned the ID.
    // handleAddGame returns the string ID.
    const newGameId = await handleAddGame(game.name, coverUrl);
    if (newGameId) {
       navigateTo('dashboard');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mb-4">
          <Info className="w-8 h-8 text-zinc-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">Game Not Found</h2>
        <p className="text-zinc-400 mb-6">{error || "We couldn't find details for this game."}</p>
        <button 
          onClick={() => navigateTo('dashboard')}
          className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-6 py-2 rounded-full font-medium transition-colors"
        >
          Return Home
        </button>
      </div>
    );
  }

  const developer = game.involved_companies?.find(c => c.developer)?.company.name;
  const releaseYear = game.first_release_date ? new Date(game.first_release_date * 1000).getFullYear() : null;
  const heroImage = game.screenshots?.[0]?.image_id 
    ? `https://images.igdb.com/igdb/image/upload/t_1080p/${game.screenshots[0].image_id}.jpg`
    : null;
  const coverImage = game.cover?.image_id
    ? `https://images.igdb.com/igdb/image/upload/t_720p/${game.cover.image_id}.jpg`
    : null;

  return (
    <div className="relative min-h-screen pb-20">
      {/* Hero Background */}
      <div className="absolute top-0 left-0 right-0 h-[50vh] md:h-[60vh] overflow-hidden -mx-4 sm:-mx-6 -mt-4 sm:-mt-6">
        {heroImage ? (
          <>
            <img 
              src={heroImage} 
              alt={game.name} 
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent" />
          </>
        ) : (
          <div className="w-full h-full bg-zinc-900">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent" />
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="relative z-10 pt-8 md:pt-32 max-w-5xl mx-auto">
        <button 
          onClick={() => navigateTo('dashboard')}
          className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-zinc-100 transition-colors font-medium bg-zinc-950/50 px-4 py-2 rounded-full backdrop-blur-md w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Left Column: Cover & Actions */}
          <div className="shrink-0 flex flex-col items-center md:items-start w-full md:w-64 lg:w-72">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-48 md:w-full aspect-[264/374] rounded-2xl overflow-hidden shadow-2xl border border-zinc-800 bg-zinc-900 mb-6"
            >
              {coverImage ? (
                <img src={coverImage} alt={game.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-center p-4">
                  <span className="font-bold text-zinc-500">{game.name}</span>
                </div>
              )}
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="w-full space-y-3"
            >
              {existingGame ? (
                <button 
                  onClick={handleGoToSession}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 py-3.5 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-[0_0_20px_-5px_rgba(16,185,129,0.4)]"
                >
                  <PlayCircle className="w-5 h-5" />
                  Continue Journal
                </button>
              ) : (
                <button 
                  onClick={onAddGame}
                  className="w-full bg-zinc-100 hover:bg-white text-zinc-950 py-3.5 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add to Library
                </button>
              )}
            </motion.div>
          </div>

          {/* Right Column: Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex-1"
          >
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {releaseYear && (
                <span className="px-3 py-1 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {releaseYear}
                </span>
              )}
              {developer && (
                <span className="px-3 py-1 bg-zinc-900/80 backdrop-blur-md border border-zinc-800 rounded-full text-xs font-bold text-zinc-300">
                  {developer}
                </span>
              )}
              {game.aggregated_rating && (
                <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  {Math.round(game.aggregated_rating)} / 100
                </span>
              )}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              {game.name}
            </h1>

            {game.genres && game.genres.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                {game.genres.map(g => (
                  <span key={g.name} className="text-sm font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-md">
                    {g.name}
                  </span>
                ))}
              </div>
            )}

            <div className="prose prose-invert max-w-none">
              <h3 className="text-xl font-bold mb-3">About</h3>
              <p className="text-zinc-300 leading-relaxed text-lg">
                {game.summary || "No summary available for this game."}
              </p>
            </div>

            {game.platforms && game.platforms.length > 0 && (
              <div className="mt-10">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Platforms</h3>
                <div className="flex flex-wrap gap-2">
                  {game.platforms.map(p => (
                    <span key={p.name} className="text-sm font-medium text-zinc-300 bg-zinc-800/50 px-3 py-1.5 rounded-md">
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
