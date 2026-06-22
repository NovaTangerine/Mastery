import React, { useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { 
  ArrowLeft, Clock, CalendarDays, Plus, Play, MoreHorizontal, ChevronRight, List,
  TagIcon, Target, LayoutDashboard
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';

export default function SessionListMockupView() {
  const { navigateTo } = useUI();
  const [activeTab, setActiveTab] = useState<'component' | 'full-page'>('component');
  
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 sm:p-8 pt-6 relative overflow-hidden flex flex-col">
      <div className="absolute inset-x-0 top-0 h-[800px] pointer-events-none bg-[radial-gradient(ellipse_150%_100%_at_50%_0%,rgba(39,39,42,0.5)_0%,rgba(9,9,11,0)_100%)] z-0" />
      
      {/* Header and Tabs */}
      <div className="relative z-10 w-full mb-8 max-w-[1600px] mx-auto flex flex-col items-center">
        <div className="w-full flex items-center justify-between mb-6">
          <button 
            onClick={() => navigateTo('dashboard')}
            className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-full text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return
          </button>
          
          <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-full shadow-lg">
            <button
               onClick={() => setActiveTab('component')}
               className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'component' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Component
            </button>
            <button
               onClick={() => setActiveTab('full-page')}
               className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'full-page' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Full Page Layout
            </button>
          </div>
          
          <div className="w-24 opacity-0 pointer-events-none">{/* Spacer */}</div>
        </div>
        
        {activeTab === 'component' && (
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Session List Layout</h1>
            <p className="text-zinc-500 font-medium max-w-lg leading-relaxed text-sm mx-auto">
              Exploring nested container layouts for session groups.
            </p>
          </div>
        )}
      </div>

      {activeTab === 'component' && (
        <div className="max-w-[400px] mx-auto relative z-10 w-full space-y-8 flex-1">
          {/* Outer Container (The "Sessions" Tab) */}
          <div className="bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-[32px] p-2 sm:p-4 shadow-2xl">
            
            {/* Outer Header */}
            <div className="px-4 py-4 mb-4 font-sans flex items-center justify-between border-b border-zinc-800/50">
              <div className="flex items-center gap-3 text-zinc-100">
                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700/50">
                  <List className="w-5 h-5 text-zinc-300" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Play Sessions</h2>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 rounded-full border border-zinc-700/50 flex items-center justify-center shadow-sm transition-all focus:scale-95">
                  <Plus className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all focus:scale-95 font-bold">
                  <Play className="w-4 h-4 ml-0.5 fill-current" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Group 1 container */}
              <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-[24px] p-2">
                <div className="px-4 py-3 flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5 text-zinc-400">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-zinc-800/80 text-zinc-300">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest">This Week</h3>
                  </div>
                  <button className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-1">
                  {[
                    { time: 'Today', duration: '2h 15m', title: 'Explored the Northern Wastes', notes: 3, isActive: true },
                    { time: 'Yesterday', duration: '45m', title: 'Quick quest cleanup', notes: 1, isActive: false }
                  ].map((s, i) => (
                    <div key={i} className={`group p-3 sm:p-4 rounded-2xl transition-colors flex items-center justify-between cursor-pointer border ${s.isActive ? 'bg-zinc-800/50 border-zinc-700' : 'hover:bg-zinc-800/30 border-transparent hover:border-zinc-700/50'}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`font-semibold ${s.isActive ? 'text-amber-400' : 'text-zinc-300'}`}>{s.time}</span>
                          <span className="text-zinc-600 text-sm font-medium">{s.duration}</span>
                        </div>
                        <p className="text-sm text-zinc-400 line-clamp-1">{s.title}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 transition-opacity">
                        <div className={`hidden sm:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${s.notes > 0 ? 'bg-zinc-800 text-zinc-400' : 'text-transparent'}`}>
                          {s.notes > 0 && <span>{s.notes} notes</span>}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-zinc-800/50 group-hover:bg-zinc-700 flex items-center justify-center transition-colors">
                          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Group 2 container */}
              <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-[24px] p-2">
                <div className="px-4 py-3 flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5 text-zinc-400">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-zinc-800/80 text-zinc-300">
                      <CalendarDays className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">April 2026</h3>
                  </div>
                  <button className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-1">
                  {[
                    { time: 'Apr 24', duration: '1h 30m', title: 'Boss fight attempts at the Great Citadel', notes: 5 },
                    { time: 'Apr 18', duration: '3h 10m', title: 'Main story progression and side quests', notes: 12 },
                    { time: 'Apr 02', duration: '50m', title: 'Started the game, character creation', notes: 0 }
                  ].map((s, i) => (
                    <div key={i} className="group p-3 sm:p-4 rounded-2xl hover:bg-zinc-800/30 transition-colors flex items-center justify-between cursor-pointer border border-transparent hover:border-zinc-700/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-zinc-300 font-semibold">{s.time}</span>
                          <span className="text-zinc-600 text-sm font-medium">{s.duration}</span>
                        </div>
                        <p className="text-sm text-zinc-500 line-clamp-1">{s.title}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 transition-opacity">
                        <div className={`hidden sm:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${s.notes > 0 ? 'bg-zinc-800 text-zinc-400' : 'text-transparent'}`}>
                          {s.notes > 0 && <span>{s.notes} notes</span>}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-zinc-800/50 group-hover:bg-zinc-700 flex items-center justify-center transition-colors opacity-50 group-hover:opacity-100">
                          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Group 3 container */}
              <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-[24px] p-2">
                <div className="px-4 py-3 flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5 text-zinc-400">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-zinc-800/80 text-zinc-300">
                      <CalendarDays className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">March 2026</h3>
                  </div>
                  <button className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-1">
                  {[
                    { time: 'Mar 28', duration: '2h 45m', title: 'Farming materials in the Dark Woods', notes: 2 }
                  ].map((s, i) => (
                    <div key={i} className="group p-3 sm:p-4 rounded-2xl hover:bg-zinc-800/30 transition-colors flex items-center justify-between cursor-pointer border border-transparent hover:border-zinc-700/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-zinc-300 font-semibold">{s.time}</span>
                          <span className="text-zinc-600 text-sm font-medium">{s.duration}</span>
                        </div>
                        <p className="text-sm text-zinc-500 line-clamp-1">{s.title}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 transition-opacity">
                        <div className={`hidden sm:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${s.notes > 0 ? 'bg-zinc-800 text-zinc-400' : 'text-transparent'}`}>
                          {s.notes > 0 && <span>{s.notes} notes</span>}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-zinc-800/50 group-hover:bg-zinc-700 flex items-center justify-center transition-colors opacity-50 group-hover:opacity-100">
                          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {activeTab === 'full-page' && (
        <div className="flex flex-1 gap-4 max-w-[1600px] mx-auto w-full relative z-10 font-sans h-[calc(100vh-140px)] min-h-0">
          
          {/* Left Sidebar: Session List Wrapper */}
          <div className="hidden lg:flex flex-col w-[380px] shrink-0 bg-zinc-900/60 backdrop-blur-md border border-zinc-800/80 rounded-[32px] p-2 sm:p-4 shadow-2xl overflow-y-auto custom-scrollbar">
            
            {/* Outer Header */}
            <div className="px-4 py-4 mb-4 flex py-2 items-center justify-between border-b border-zinc-800/50">
              <div className="flex items-center gap-3 text-zinc-100">
                <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-700/50">
                  <List className="w-5 h-5 text-zinc-300" />
                </div>
                <h2 className="text-xl font-bold tracking-tight">Play Sessions</h2>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 rounded-full border border-zinc-700/50 flex items-center justify-center shadow-sm transition-all focus:scale-95">
                  <Plus className="w-5 h-5" />
                </button>
                <button className="w-10 h-10 bg-amber-500 hover:bg-amber-400 text-amber-950 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.3)] transition-all focus:scale-95 font-bold">
                  <Play className="w-4 h-4 ml-0.5 fill-current" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 pb-8">
              {/* Group 1 container */}
              <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-[24px] p-2">
                <div className="px-4 py-3 flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5 text-zinc-400">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-zinc-800/80 text-zinc-300">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest">This Week</h3>
                  </div>
                  <button className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-1">
                  {[
                    { time: 'Today', duration: '2h 15m', title: 'Explored the Northern Wastes', notes: 3, isActive: true },
                    { time: 'Yesterday', duration: '45m', title: 'Quick quest cleanup', notes: 1, isActive: false }
                  ].map((s, i) => (
                    <div key={i} className={`group p-3 sm:p-4 rounded-2xl transition-colors flex items-center justify-between cursor-pointer border ${s.isActive ? 'bg-zinc-800/50 border-zinc-700' : 'hover:bg-zinc-800/30 border-transparent hover:border-zinc-700/50'}`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className={`font-semibold ${s.isActive ? 'text-amber-400' : 'text-zinc-300'}`}>{s.time}</span>
                          <span className="text-zinc-600 text-sm font-medium">{s.duration}</span>
                        </div>
                        <p className="text-sm text-zinc-400 line-clamp-1">{s.title}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 transition-opacity">
                        <div className={`hidden sm:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${s.notes > 0 ? 'bg-zinc-800 text-zinc-400' : 'text-transparent'}`}>
                          {s.notes > 0 && <span>{s.notes}</span>}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-zinc-800/50 group-hover:bg-zinc-700 flex items-center justify-center transition-colors">
                          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Group 2 container */}
              <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-[24px] p-2">
                <div className="px-4 py-3 flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5 text-zinc-400">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-zinc-800/80 text-zinc-300">
                      <CalendarDays className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">April 2026</h3>
                  </div>
                  <button className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-1">
                  {[
                    { time: 'Apr 24', duration: '1h 30m', title: 'Boss fight attempts at the Great Citadel', notes: 5 },
                    { time: 'Apr 18', duration: '3h 10m', title: 'Main story progression and side quests', notes: 12 },
                    { time: 'Apr 02', duration: '50m', title: 'Started the game, character creation', notes: 0 }
                  ].map((s, i) => (
                    <div key={i} className="group p-3 sm:p-4 rounded-2xl hover:bg-zinc-800/30 transition-colors flex items-center justify-between cursor-pointer border border-transparent hover:border-zinc-700/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-zinc-300 font-semibold">{s.time}</span>
                          <span className="text-zinc-600 text-sm font-medium">{s.duration}</span>
                        </div>
                        <p className="text-sm text-zinc-500 line-clamp-1">{s.title}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 transition-opacity">
                        <div className={`hidden sm:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${s.notes > 0 ? 'bg-zinc-800 text-zinc-400' : 'text-transparent'}`}>
                          {s.notes > 0 && <span>{s.notes}</span>}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-zinc-800/50 group-hover:bg-zinc-700 flex items-center justify-center transition-colors opacity-50 group-hover:opacity-100">
                          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Group 3 container */}
              <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-[24px] p-2">
                <div className="px-4 py-3 flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5 text-zinc-400">
                    <div className="w-6 h-6 rounded flex items-center justify-center bg-zinc-800/80 text-zinc-300">
                      <CalendarDays className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-400">March 2026</h3>
                  </div>
                  <button className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="space-y-1">
                  {[
                    { time: 'Mar 28', duration: '2h 45m', title: 'Farming materials in the Dark Woods', notes: 2 }
                  ].map((s, i) => (
                    <div key={i} className="group p-3 sm:p-4 rounded-2xl hover:bg-zinc-800/30 transition-colors flex items-center justify-between cursor-pointer border border-transparent hover:border-zinc-700/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-zinc-300 font-semibold">{s.time}</span>
                          <span className="text-zinc-600 text-sm font-medium">{s.duration}</span>
                        </div>
                        <p className="text-sm text-zinc-500 line-clamp-1">{s.title}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 transition-opacity">
                        <div className={`hidden sm:flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${s.notes > 0 ? 'bg-zinc-800 text-zinc-400' : 'text-transparent'}`}>
                          {s.notes > 0 && <span>{s.notes}</span>}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-zinc-800/50 group-hover:bg-zinc-700 flex items-center justify-center transition-colors opacity-50 group-hover:opacity-100">
                          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          {/* Main Content Area: Active Session Mockup */}
          <div className="flex-1 flex flex-col bg-zinc-950/80 border border-zinc-800/80 rounded-[32px] overflow-hidden shadow-2xl relative h-full">
            
            <div className="absolute inset-0 overflow-y-auto p-6 md:p-8 custom-scrollbar">
              
              {/* Main Header inside Active Session */}
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-zinc-800/50">
                 <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-xs font-bold uppercase tracking-widest shadow-[0_0_10px_rgba(251,191,36,0.1)]">
                        Active Session
                      </span>
                      <span className="text-zinc-500 text-sm font-medium flex items-center gap-1">
                        <Clock className="w-4 h-4" /> 2h 15m elapsed
                      </span>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Explored the Northern Wastes</h1>
                 </div>
                 <button className="h-12 px-6 rounded-full bg-zinc-100 text-zinc-950 font-bold hover:bg-white inline-flex items-center justify-center transition-transform active:scale-95 shadow-xl">
                   End Session
                 </button>
              </div>

              {/* Session Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
                
                {/* Left Col: Notes */}
                <div className="lg:col-span-2 space-y-6">
                   
                   <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-inner relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                       <List className="w-32 h-32" />
                     </div>
                     <form className="relative z-10 flex flex-col gap-4">
                       <textarea 
                         placeholder="Jot down a quick note..."
                         className="w-full bg-transparent text-xl font-medium text-white placeholder:text-zinc-600 resize-none outline-none focus:ring-0"
                         rows={3}
                       />
                       <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
                          <div className="flex items-center gap-2">
                            <button className="text-zinc-500 hover:text-zinc-300">
                              <TagIcon className="w-5 h-5" />
                            </button>
                          </div>
                          <button className="px-6 py-2.5 bg-white text-zinc-950 font-bold rounded-full text-sm hover:bg-zinc-200 transition-colors shadow-lg">
                            Save Note
                          </button>
                       </div>
                     </form>
                   </div>

                   <div className="space-y-4">
                      <h3 className="font-bold text-zinc-500 uppercase tracking-widest text-xs px-2">Session Notes</h3>
                      
                      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-5 hover:bg-zinc-900 transition-colors cursor-text group">
                        <p className="text-zinc-300 leading-relaxed text-[15px]">
                          Found a hidden cave behind the waterfall in the Northern Wastes. Inside, there's a mini-boss that drops the <span className="text-amber-400 font-semibold px-1 bg-amber-400/10 rounded">Frostbite Dagger</span>. Need to come back when I'm level 25.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded-md text-xs font-semibold">#location</span>
                          <span className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded-md text-xs font-semibold">#boss</span>
                          <span className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded-md text-xs font-semibold">#loot</span>
                        </div>
                      </div>
                      
                      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-5 hover:bg-zinc-900 transition-colors cursor-text group">
                        <p className="text-zinc-300 leading-relaxed text-[15px]">
                          Upgraded the main armor set to Tier 3. Cost 5000 gold and 10 Iron Ore.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="px-2 py-1 bg-zinc-800 text-zinc-400 rounded-md text-xs font-semibold">#crafting</span>
                        </div>
                      </div>
                   </div>

                </div>
                
                {/* Right Col: Trackers & Tags */}
                <div className="space-y-6">
                  
                  {/* Trackers */}
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-5 w-full">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                        <Target className="w-4 h-4 text-emerald-500" />
                        Session Trackers
                      </h4>
                      <button className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-colors">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-zinc-300">Deaths</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 font-bold">-</button>
                          <span className="text-xl font-black w-6 text-center tabular-nums text-white">4</span>
                          <button className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-white flex items-center justify-center text-zinc-950 font-bold">+</button>
                        </div>
                      </div>
                      <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-2xl p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-zinc-300">Health Potions Used</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 font-bold">-</button>
                          <span className="text-xl font-black w-6 text-center tabular-nums text-white">12</span>
                          <button className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-white flex items-center justify-center text-zinc-950 font-bold">+</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Session Tags */}
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-5 w-full">
                    <div className="flex items-center gap-2 text-zinc-400 mb-4">
                      <TagIcon className="w-4 h-4 text-zinc-600" />
                      <h3 className="font-bold uppercase tracking-widest text-xs">Session Tags</h3>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-2 mb-4 flex items-center gap-2">
                      <input type="text" placeholder="Add a tag..." className="bg-transparent border-none focus:ring-0 text-sm outline-none px-2 py-1 w-full text-white" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                       <span className="px-3 py-1.5 bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 rounded-lg text-xs font-semibold hover:bg-zinc-700 cursor-pointer transition-colors">
                         #boss
                       </span>
                       <span className="px-3 py-1.5 bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 rounded-lg text-xs font-semibold hover:bg-zinc-700 cursor-pointer transition-colors">
                         #location
                       </span>
                       <span className="px-3 py-1.5 bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 rounded-lg text-xs font-semibold hover:bg-zinc-700 cursor-pointer transition-colors">
                         #loot
                       </span>
                       <span className="px-3 py-1.5 bg-zinc-800/80 text-zinc-300 border border-zinc-700/50 rounded-lg text-xs font-semibold hover:bg-zinc-700 cursor-pointer transition-colors">
                         #crafting
                       </span>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}

