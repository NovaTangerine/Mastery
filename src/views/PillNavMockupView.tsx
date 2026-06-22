import React, { useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { ArrowLeft, Search, User, Gamepad2, Bell, Library, LayoutGrid, Rows3, GalleryHorizontal, Plus, Filter, SortDesc } from 'lucide-react';
import DashboardView from './DashboardView';

export default function PillNavMockupView() {
  const { navigateTo } = useUI();
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [activeTab, setActiveTab] = useState('library');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list' | 'gallery'>('grid');
  const [isLayoutDropdownOpen, setIsLayoutDropdownOpen] = useState(false);

  const LayoutIcon = viewLayout === 'grid' ? LayoutGrid : viewLayout === 'list' ? Rows3 : GalleryHorizontal;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans relative overflow-hidden flex flex-col">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-zinc-900/50 to-transparent pointer-events-none" />
      
      {/* 
        PILL NAVIGATION BAR 
        Aesthetic: Sleek, dark, subtle premium gradient shine, glassmorphism, thin borders.
        Typography: Light, refined, tracking-wide.
      */}
      <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-4xl px-4">
        <nav 
          className="relative flex items-center justify-between px-2 py-2 rounded-full border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          style={{
             background: 'linear-gradient(180deg, rgba(39,39,42,0.6) 0%, rgba(24,24,27,0.8) 100%)',
             backdropFilter: 'blur(20px)',
             WebkitBackdropFilter: 'blur(20px)'
          }}
        >
          {/* Inner highlight ring */}
          <div className="absolute inset-0 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] pointer-events-none" />

          {/* Left: Brand / Logo */}
          <div className="flex items-center pl-4 pr-6 border-r border-white/5">
            <button 
              onClick={() => setActiveTab('home')}
              className="flex items-center group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center mr-3 group-hover:bg-amber-400 group-hover:text-amber-950 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_20px_rgba(251,191,36,0.4)]">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <span className={`text-[17px] tracking-tight transition-colors ${activeTab === 'home' ? 'font-medium text-white' : 'font-light text-zinc-100 group-hover:text-white'}`}>Cartridge</span>
            </button>
          </div>

          {/* Center: Navigation Links */}
          <div className="flex items-center gap-1 px-4 flex-1">
            <button 
              onClick={() => setActiveTab('library')}
              className={`relative px-5 py-2.5 rounded-full text-[13px] tracking-wide transition-all ${
                activeTab === 'library' 
                  ? 'text-white font-normal' 
                  : 'text-zinc-400 font-light hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              {activeTab === 'library' && (
                <div className="absolute inset-0 bg-white/10 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Library className="w-4 h-4" />
                Library
              </span>
            </button>
            
            <button 
              onClick={() => setActiveTab('search')}
              className={`relative px-5 py-2.5 rounded-full text-[13px] tracking-wide transition-all ${
                activeTab === 'search' 
                  ? 'text-white font-normal' 
                  : 'text-zinc-400 font-light hover:text-zinc-200 hover:bg-white/5'
              }`}
            >
              {activeTab === 'search' && (
                <div className="absolute inset-0 bg-white/10 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Search
              </span>
            </button>
          </div>

          {/* Contextual Action Area (Dynamic Based on activeTab) */}
          <div className={`flex items-center pr-4 border-r border-white/5 transition-all duration-300 overflow-hidden ${activeTab === 'library' || activeTab === 'search' ? 'opacity-100 max-w-[200px] gap-2' : 'opacity-0 max-w-0 pr-0 border-r-0'}`}>
            {activeTab === 'library' && (
              <>
                <div className="relative">
                  <button 
                    onClick={() => setIsLayoutDropdownOpen(!isLayoutDropdownOpen)}
                    className="relative w-9 h-9 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 transition-colors"
                    title="Change Layout"
                  >
                    <LayoutIcon className="w-4 h-4" />
                  </button>

                  {/* Dropdown for Layouts */}
                  {isLayoutDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40 cursor-default" onClick={() => setIsLayoutDropdownOpen(false)} />
                      <div className="absolute top-full right-0 mt-2 w-40 bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-2xl p-1 z-50 flex flex-col gap-1 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                        <button 
                          onClick={() => { setViewLayout('grid'); setIsLayoutDropdownOpen(false); }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${viewLayout === 'grid' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
                        >
                          <LayoutGrid className="w-4 h-4" />
                          Grid
                        </button>
                        <button 
                          onClick={() => { setViewLayout('list'); setIsLayoutDropdownOpen(false); }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${viewLayout === 'list' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
                        >
                          <Rows3 className="w-4 h-4" />
                          List
                        </button>
                        <button 
                          onClick={() => { setViewLayout('gallery'); setIsLayoutDropdownOpen(false); }}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${viewLayout === 'gallery' ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
                        >
                          <GalleryHorizontal className="w-4 h-4" />
                          Gallery
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <button 
                  onClick={() => setIsAddingGame(true)}
                  className="px-4 py-2 h-9 bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-colors whitespace-nowrap shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Game
                </button>
              </>
            )}
            
            {activeTab === 'search' && (
              <button className="px-4 py-2 h-9 bg-white/10 hover:bg-white/20 text-white text-xs font-medium tracking-wide rounded-full flex items-center gap-2 transition-colors whitespace-nowrap">
                <Filter className="w-3.5 h-3.5" />
                Filters
              </button>
            )}
          </div>

          {/* Right: Actions / Profile */}
          <div className="flex items-center gap-2 pr-2 pl-4 border-l border-white/5">
             <button className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors">
               <Bell className="w-4 h-4" />
             </button>
             <button className="w-10 h-10 rounded-full overflow-hidden border border-zinc-700 hover:border-zinc-500 transition-colors bg-zinc-800">
               <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover opacity-80 hover:opacity-100" />
             </button>
          </div>

        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full relative z-10 pt-28 max-w-[1440px] mx-auto px-4 sm:px-6">
        
        {/* Mockup Toolbar */}
        <div className="flex justify-between flex-row items-center mb-8 border-b border-zinc-800/50 pb-8 max-w-6xl mx-auto">
          <div className="space-y-2">
            <h1 className="text-[2.75rem] font-light tracking-tight text-white leading-none">Pill Navigation</h1>
            <p className="text-lg text-zinc-500 font-light tracking-wide max-w-xl">
              Previewing the contextual pill navigation over the live Dashboard layout.
            </p>
          </div>
          <button 
            onClick={() => navigateTo('dashboard')}
            className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700/80 rounded-full text-sm font-light tracking-wide text-zinc-200 transition-colors flex items-center gap-2 border border-zinc-700/50 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            Return Main
          </button>
        </div>

        {/* Dashboard Content Container */}
        <div className="relative mb-20 pointer-events-auto max-w-6xl mx-auto">
           {/* Rendering DashboardView internally to see context. */}
           <DashboardView />
        </div>

      </div>

    </div>
  );
}
