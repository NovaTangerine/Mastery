import React, { useState } from 'react';
import { Gamepad2, User, Trophy, PenTool, ArrowRight, Sparkles, Target, Compass, Plus, X, BookOpen, PlayCircle, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import GameSearchModal from '../components/GameSearchModal';
import { useGameLibrary } from '../contexts/GameContext';
import { useUI } from '../contexts/UIContext';

interface TopGame {
  slot: number;
  id: number;
  name: string;
  coverId?: string;
}

export default function HomeView() {
  const { games } = useGameLibrary();
  const { navigateTo } = useUI();
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [topGames, setTopGames] = useState<TopGame[]>([]);
  
  const hasActiveGames = games.length > 0;
  const modules = [
    {
      id: 'currently-playing',
      title: 'Set Currently Playing',
      description: 'What are you playing right now? Add it to your active log to start journaling.',
      icon: Gamepad2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
      action: 'Search Games'
    },
    {
      id: 'profile',
      title: 'Customize Profile',
      description: 'Claim your identity. Add an avatar, bio, and set up your digital presence.',
      icon: User,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
      action: 'Edit Profile'
    },
    {
      id: 'first-review',
      title: 'Write First Review',
      description: 'Got a strong opinion on a game you recently finished? Draft your first review.',
      icon: PenTool,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      border: 'border-purple-400/20',
      action: 'Draft Review'
    }
  ];

  const handleSelectGame = async (game: any) => {
    if (activeSlot === null) return;
    
    setTopGames(prev => {
      const filtered = prev.filter(g => g.slot !== activeSlot);
      return [...filtered, {
        slot: activeSlot,
        id: game.id,
        name: game.name,
        coverId: game.cover?.image_id
      }];
    });
    setActiveSlot(null);
  };

  const handleRemoveGame = (e: React.MouseEvent, slot: number) => {
    e.stopPropagation();
    setTopGames(prev => prev.filter(g => g.slot !== slot));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <GameSearchModal 
        isOpen={activeSlot !== null}
        onClose={() => setActiveSlot(null)}
        onSelectGame={handleSelectGame}
        slotNumber={activeSlot}
      />

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-widest mb-4"
          >
            <Sparkles className="w-3 h-3 text-zinc-300" />
            <span>Welcome to Capsule</span>
          </motion.div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-3 text-emerald-400">
            Capsule: Build your Cartridge.
          </h1>
          <div className="bg-emerald-500 text-zinc-950 px-3 py-1 inline-flex items-center gap-2 font-black rounded-lg mt-4 shadow-lg shadow-emerald-500/20">
            <span className="animate-pulse">●</span> DEPLOYED: v1.0.2 @ 14:42
          </div>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 text-lg max-w-2xl"
          >
            {hasActiveGames 
              ? "You've started your journey. Keep journaling your active games or continue setting up your digital trophy room."
              : "Your library is currently empty. Complete a few quick steps to kickstart your journey and set up your digital trophy room."}
          </motion.p>
        </div>

        {/* Journaling Module (Dynamic) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={() => navigateTo('dashboard')}
          className={`mb-6 border rounded-3xl p-6 sm:p-8 relative overflow-hidden group/journal cursor-pointer transition-all duration-500 ${
            hasActiveGames 
              ? 'bg-emerald-950/20 border-emerald-900/50 hover:bg-emerald-900/30 hover:border-emerald-500/50' 
              : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700'
          }`}
        >
          {/* Decorative background glow */}
          <div className={`absolute -right-40 -top-40 w-80 h-80 rounded-full blur-3xl opacity-0 group-hover/journal:opacity-100 transition-opacity duration-700 pointer-events-none ${
            hasActiveGames ? 'bg-emerald-500/10' : 'bg-zinc-500/10'
          }`} />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-6">
              <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center shrink-0 transition-colors ${
                hasActiveGames 
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                  : 'bg-zinc-800 border-zinc-700 text-zinc-400 group-hover/journal:bg-zinc-100 group-hover/journal:text-zinc-950'
              }`}>
                {hasActiveGames ? <PlayCircle className="w-8 h-8" /> : <BookOpen className="w-8 h-8" />}
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-2">
                  {hasActiveGames ? 'Continue Journaling' : 'Start Your Journal'}
                </h3>
                <p className={`text-sm ${hasActiveGames ? 'text-emerald-200/70' : 'text-zinc-400'}`}>
                  {hasActiveGames 
                    ? `You have ${games.length} active game${games.length === 1 ? '' : 's'} in your library. Jump back in and log your progress.`
                    : 'Add your first game to the library and start tracking your playthroughs, thoughts, and progress.'}
                </p>
              </div>
            </div>
            
            {hasActiveGames && (
              <div className="flex -space-x-4 shrink-0">
                {games.slice(0, 3).map((game, i) => (
                  <div key={game.id} className="w-12 h-12 rounded-full border-2 border-zinc-950 bg-zinc-800 overflow-hidden relative z-10" style={{ zIndex: 10 - i }}>
                    {game.coverUrl ? (
                      <img src={game.coverUrl} alt={game.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-emerald-900/50 text-emerald-400 text-xs font-bold">
                        {game.title.charAt(0)}
                      </div>
                    )}
                  </div>
                ))}
                {games.length > 3 && (
                  <div className="w-12 h-12 rounded-full border-2 border-zinc-950 bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 relative z-0">
                    +{games.length - 3}
                  </div>
                )}
              </div>
            )}
            
            <div className={`w-10 h-10 rounded-full border flex items-center justify-center transition-colors shrink-0 ${
              hasActiveGames
                ? 'bg-emerald-500/20 border-emerald-500/30 group-hover/journal:bg-emerald-400 group-hover/journal:text-zinc-950'
                : 'bg-zinc-950 border-zinc-800 group-hover/journal:bg-zinc-100 group-hover/journal:border-zinc-100 group-hover/journal:text-zinc-950'
            }`}>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </motion.div>

        {/* Top Games Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden group/top"
        >
          {/* Decorative background glow */}
          <div className="absolute -right-40 -top-40 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl opacity-0 group-hover/top:opacity-100 transition-opacity duration-700 pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-2xl font-bold">Set Top Games</h3>
                </div>
                <p className="text-zinc-400">Curate your top 5 games of all time to anchor your profile and find similar players.</p>
              </div>
              <button className="shrink-0 bg-zinc-100 text-zinc-950 px-5 py-2.5 rounded-full font-bold hover:bg-white transition-all active:scale-95 flex items-center gap-2 self-start">
                Search Games
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((slot) => {
                const game = topGames.find(g => g.slot === slot);
                
                return (
                  <div 
                    key={slot}
                    onClick={() => setActiveSlot(slot)}
                    className="relative aspect-[264/374] rounded-2xl border-2 border-dashed border-zinc-800 bg-zinc-950/50 flex flex-col items-center justify-center cursor-pointer group/slot transition-all duration-300 hover:-translate-y-2 hover:border-amber-400/50 hover:bg-amber-400/5 hover:shadow-[0_8px_30px_rgb(251,191,36,0.1)] overflow-hidden"
                  >
                    {game ? (
                      <>
                        {game.coverId ? (
                          <img 
                            src={`https://images.igdb.com/igdb/image/upload/t_720p/${game.coverId}.jpg`}
                            alt={game.name}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover/slot:scale-110"
                          />
                        ) : (
                          <div className="absolute inset-0 w-full h-full bg-zinc-800 flex items-center justify-center p-4 text-center">
                            <span className="font-bold text-zinc-400">{game.name}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-transparent opacity-0 group-hover/slot:opacity-100 transition-opacity duration-300" />
                        
                        {/* Actions Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/slot:opacity-100 transition-opacity duration-300 z-10">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigateTo('igdb-game', null, null, game.id);
                            }}
                            className="bg-zinc-100/90 hover:bg-white text-zinc-950 backdrop-blur-md p-3 rounded-full shadow-xl transition-transform hover:scale-110 active:scale-95"
                            title="View Game Details"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </button>
                        </div>

                        <button 
                          onClick={(e) => handleRemoveGame(e, slot)}
                          className="absolute top-2 right-2 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover/slot:opacity-100 hover:bg-red-500/80 transition-all duration-300 z-20"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover/slot:translate-y-0 transition-transform duration-300 z-20">
                          <p className="text-xs font-bold text-white truncate">{game.name}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center group-hover/slot:bg-amber-400/20 group-hover/slot:scale-110 transition-all duration-300">
                          <Plus className="w-6 h-6 text-zinc-600 group-hover/slot:text-amber-400 transition-colors" />
                        </div>
                        <span className="mt-4 text-xs font-bold text-zinc-600 uppercase tracking-widest group-hover/slot:text-amber-400/80 transition-colors">
                          Slot {slot}
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod, index) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + (index * 0.1) }}
              className="group relative bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer overflow-hidden"
            >
              {/* Decorative background glow */}
              <div className={`absolute -right-20 -top-20 w-40 h-40 ${mod.bg} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-12 h-12 rounded-2xl ${mod.bg} ${mod.border} border flex items-center justify-center`}>
                    <mod.icon className={`w-6 h-6 ${mod.color}`} />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center group-hover:bg-zinc-100 group-hover:border-zinc-100 transition-colors">
                    <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-950 transition-colors" />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-2">{mod.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-8 flex-1">
                  {mod.description}
                </p>
                
                <div className="mt-auto">
                  <span className="text-sm font-bold text-zinc-300 group-hover:text-zinc-100 transition-colors">
                    {mod.action}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Explore Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-12 bg-zinc-900 border border-zinc-800 rounded-3xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0">
              <Compass className="w-8 h-8 text-zinc-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold mb-1">Not sure where to start?</h3>
              <p className="text-zinc-400 text-sm">Explore the community feed to see what others are playing and reviewing.</p>
            </div>
          </div>
          <button className="shrink-0 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 px-6 py-3 rounded-xl font-bold transition-colors">
            Explore Feed
          </button>
        </motion.div>
      </main>
    </div>
  );
}
