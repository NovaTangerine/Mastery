import React, { useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { useGameContext } from '../contexts/GameContext';
import { ArrowLeft, Plus, Gamepad2, Trophy, MoreVertical } from 'lucide-react';

// Light mode specific colors:
// Background: bg-zinc-50 (with maybe a hint of violet or blue)
// Text: text-zinc-900 / text-zinc-600
// Gradients: from-violet-50 via-zinc-50 to-white (just examples)

export default function LightModeLibraryMockupView() {
  const { navigateTo } = useUI();
  const { games } = useGameContext();
  const [layout, setLayout] = useState<'3col' | '2col' | '3col-art'>('3col-art');

  return (
    <div className="min-h-screen bg-[#ececf1] text-zinc-900 font-sans p-8 pt-12 relative overflow-hidden">
      
      {/* Background Polish - slightly darker neutral tone with distributed purplish/bluish hues */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#e5e5ea] to-[#ececf1] pointer-events-none" />
      <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] bg-indigo-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-violet-400/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[30%] left-[20%] w-[500px] h-[500px] bg-blue-400/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10 w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-16">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 mb-2">Light Theme Exploration</h1>
            <p className="text-zinc-500 font-medium">
              Testing a clean, pure aesthetic with subtle indigo/blue undertones rather than flat grey.
            </p>
          </div>
          <button 
            onClick={() => navigateTo('dashboard')}
            className="px-5 py-2.5 bg-white shadow-sm hover:shadow-md rounded-full text-sm font-semibold tracking-wide text-zinc-700 transition-all flex items-center gap-2 border border-zinc-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Return Main
          </button>
        </div>

        {/* Dashboard Shell matching the layout structure */}
        <div className="space-y-8 animate-in fade-in duration-500 relative">
          
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Your Library</h2>
            <div className="flex gap-3">
              <div className="flex bg-white shadow-sm border border-zinc-200 rounded-full p-1 self-center hidden sm:flex">
                <button
                  onClick={() => setLayout('2col')}
                  className={`p-1.5 rounded-full transition-all ${layout === '2col' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                  title="2 Column Layout"
                >
                  <div className="flex gap-[3px] items-center justify-center w-5 h-5">
                    <div className="w-2 h-[14px] bg-current rounded-[2px]" />
                    <div className="w-2 h-[14px] bg-current rounded-[2px]" />
                  </div>
                </button>
                <button
                  onClick={() => setLayout('3col')}
                  className={`p-1.5 rounded-full transition-all ${layout === '3col' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
                  title="3 Column Layout"
                >
                  <div className="flex gap-[2px] items-center justify-center w-5 h-5">
                    <div className="w-[5px] h-[14px] bg-current rounded-[2px]" />
                    <div className="w-[5px] h-[14px] bg-current rounded-[2px]" />
                    <div className="w-[5px] h-[14px] bg-current rounded-[2px]" />
                  </div>
                </button>
                <button
                  onClick={() => setLayout('3col-art')}
                  className={`p-1.5 rounded-full transition-all ${layout === '3col-art' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-zinc-400 hover:text-zinc-600'}`}
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
                className="bg-zinc-900 text-white shadow-md shadow-zinc-900/10 px-5 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-zinc-800 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Add Game
              </button>
            </div>
          </div>

          <div className={`grid ${layout === '3col-art' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-2 sm:gap-x-3 gap-y-3 sm:gap-y-4' : `grid-cols-1 sm:grid-cols-2 ${layout.startsWith('3col') ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-3 sm:gap-4 lg:gap-6`}`}>
            {games.map(game => (
               layout === '3col-art' ? (
                 <div 
                   key={game.id}
                   className={`relative group aspect-[264/374] rounded-md cursor-pointer transition-all block shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-zinc-200/50`}
                 >
                   <div className="absolute inset-0 bg-zinc-100 rounded-md overflow-hidden">
                     {game.coverUrl ? (
                       <img src={game.coverUrl.replace('t_cover_big', 't_720p')} alt={game.title} className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.03]" />
                     ) : (
                       <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-400 font-bold p-4 text-center transition-all duration-700 ease-out group-hover:scale-[1.03]">
                         <Gamepad2 className="w-8 h-8 mb-2 opacity-30" />
                         <span className="text-xs leading-tight opacity-70 text-zinc-500">{game.title}</span>
                       </div>
                     )}
                   </div>
                   
                   {/* Light mode inner shadow/border overlay instead of intense dark borders */}
                   <div className="absolute inset-0 z-30 rounded-md pointer-events-none transition-all duration-[150ms] ease-out shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)] group-hover:shadow-[inset_0_0_0_2px_rgba(79,70,229,0.5)]" />
                   
                   <div className="absolute top-3 right-3 z-30">
                     <div className={`transition-all duration-300 transform opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100`}>
                       {game.status === 'completed' && (
                         <span className="flex items-center justify-center w-8 h-8 bg-white/80 backdrop-blur-md rounded-full border border-zinc-200 text-indigo-600 shadow-sm">
                           <Trophy className="w-4 h-4" />
                         </span>
                       )}
                     </div>
                   </div>
                 </div>
               ) : (
                 <div 
                   key={game.id}
                   className={`relative group bg-white border border-zinc-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-900/5 rounded-3xl p-6 text-left transition-all flex flex-col cursor-pointer hover:-translate-y-1 h-[160px]`}
                 >
                   <div className="flex justify-between items-start mb-4">
                     <div className="w-12 h-12 bg-indigo-50/50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-100 transition-colors duration-500">
                       <Gamepad2 className="w-6 h-6 text-indigo-400 group-hover:text-indigo-600 transition-colors duration-500" />
                     </div>
                   </div>
                     
                   <div className="flex items-center absolute right-6 top-6">
                     <div className={`transition-all duration-300 group-hover:delay-75 transform group-hover:-translate-x-10`}>
                       {game.status === 'completed' ? (
                         <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded shadow-sm whitespace-nowrap">
                           <Trophy className="w-3 h-3" />
                           Completed
                         </span>
                       ) : (
                         <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded whitespace-nowrap">
                           {game.status}
                         </span>
                       )}
                     </div>
                     
                     <div className={`absolute right-0 flex items-center justify-center transition-opacity duration-300 group-hover:delay-75 opacity-0 group-hover:opacity-100`}>
                       <button
                         className="w-8 h-8 rounded-full hover:bg-zinc-100 flex items-center justify-center text-zinc-400 hover:text-zinc-600 transition-colors"
                       >
                         <MoreVertical className="w-5 h-5" />
                       </button>
                     </div>
                   </div>
 
                   <div className="mt-auto relative z-10 w-full overflow-hidden">
                     <h3 className="font-bold text-lg text-zinc-900 truncate tracking-tight">{game.title}</h3>
                     <p className="text-sm text-zinc-500 mt-1 flex items-center gap-2">
                       {game.status === 'completed' ? 'Finished playing' : 'Currently playing'}
                     </p>
                   </div>
                 </div>
               )
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
