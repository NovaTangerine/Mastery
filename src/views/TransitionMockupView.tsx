import React, { useState, useEffect } from 'react';
import { Loader2, LayoutGrid, List, LayoutPanelLeft } from 'lucide-react';
import { useUI } from '../contexts/UIContext';

// Dummy data for mockups
const MOCK_GAMES = Array.from({ length: 6 }).map((_, i) => ({
  id: `game-${i}`,
  title: `Mock Game ${i + 1}`,
}));

export default function TransitionMockupView() {
  const { navigateTo } = useUI();
  const [activeTab, setActiveTab] = useState(1);
  const [layout, setLayout] = useState('grid');
  const [displayLayout, setDisplayLayout] = useState('grid');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleLayoutChange = (newLayout: string) => {
    if (layout === newLayout || isTransitioning) return;
    setIsTransitioning(true);
    setLayout(newLayout);
    
    // Wait for fade out animation before swapping the actual layout being displayed
    setTimeout(() => {
      setDisplayLayout(newLayout);
      // Wait a bit to simulate loading, then fade back in
      setTimeout(() => {
        setIsTransitioning(false);
      }, 400);
    }, 150);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Transition Mockups</h1>
        <button 
          onClick={() => navigateTo('dashboard')}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-semibold transition-colors"
        >
          Return to Dashboard
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-800">
        <button
          onClick={() => setActiveTab(1)}
          className={`pb-4 px-4 text-sm font-bold transition-colors ${activeTab === 1 ? 'border-b-2 border-amber-400 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Option 1: Crossfade + Loader
        </button>
        <button
          onClick={() => setActiveTab(2)}
          className={`pb-4 px-4 text-sm font-bold transition-colors ${activeTab === 2 ? 'border-b-2 border-amber-400 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Option 2: Staggered Entrance
        </button>
        <button
          onClick={() => setActiveTab(3)}
          className={`pb-4 px-4 text-sm font-bold transition-colors ${activeTab === 3 ? 'border-b-2 border-amber-400 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Option 3: Skeleton UI
        </button>
      </div>

      {/* Layout Controls */}
      <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-1 w-fit">
        <button
          onClick={() => handleLayoutChange('grid')}
          className={`p-2 rounded-md transition-colors ${layout === 'grid' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
          title="Grid View"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>
        <button
          onClick={() => handleLayoutChange('list')}
          className={`p-2 rounded-md transition-colors ${layout === 'list' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
          title="List View"
        >
          <List className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 min-h-[400px] relative overflow-hidden">
        {activeTab === 1 && <Option1Loader isTransitioning={isTransitioning} layout={displayLayout} />}
        {activeTab === 2 && <Option2Stagger isTransitioning={isTransitioning} layout={displayLayout} />}
        {activeTab === 3 && <Option3Skeleton isTransitioning={isTransitioning} layout={displayLayout} />}
      </div>
    </div>
  );
}

// Option 1: Crossfade with Loader
function Option1Loader({ isTransitioning, layout }: { isTransitioning: boolean, layout: string }) {
  return (
    <>
      <div className={`absolute inset-0 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm z-10 transition-opacity duration-300 ${isTransitioning ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
      </div>
      <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        <MockupGrid layout={layout} />
      </div>
    </>
  );
}

// Option 2: Staggered Entrance
function Option2Stagger({ isTransitioning, layout }: { isTransitioning: boolean, layout: string }) {
  return (
    <div className={`transition-opacity duration-200 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
      <div className={`grid gap-4 ${layout === 'grid' ? 'grid-cols-3' : 'grid-cols-1'}`}>
        {MOCK_GAMES.map((game, i) => (
          <div 
            key={game.id} 
            className={`bg-zinc-800 rounded-lg p-4 transition-all hover:bg-zinc-700
              ${layout === 'grid' ? 'aspect-[3/4] flex flex-col justify-end' : 'h-24 flex block'}
              ${!isTransitioning ? 'animate-in fade-in slide-in-from-bottom-4 fill-mode-both' : 'opacity-0'}
            `}
            style={!isTransitioning ? { animationDelay: `${i * 50}ms`, animationDuration: '300ms' } : {}}
          >
            <div className="w-8 h-8 bg-zinc-700/50 rounded mb-2"></div>
            <div className="h-4 bg-zinc-700/50 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Option 3: Skeleton UI
function Option3Skeleton({ isTransitioning, layout }: { isTransitioning: boolean, layout: string }) {
  if (isTransitioning) {
    return (
      <div className={`grid gap-4 ${layout === 'grid' ? 'grid-cols-3' : 'grid-cols-1'}`}>
        {MOCK_GAMES.map((game, i) => (
          <div 
            key={`skeleton-${i}`} 
            className={`bg-zinc-800/50 animate-pulse rounded-lg
              ${layout === 'grid' ? 'aspect-[3/4]' : 'h-24'}
            `}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      <MockupGrid layout={layout} />
    </div>
  );
}

// Reusable dummy grid
function MockupGrid({ layout }: { layout: string }) {
  return (
    <div className={`grid gap-4 ${layout === 'grid' ? 'grid-cols-3' : 'grid-cols-1'}`}>
      {MOCK_GAMES.map((game) => (
        <div 
          key={game.id} 
          className={`bg-zinc-800 rounded-lg p-4 transition-colors hover:bg-zinc-700 relative overflow-hidden group
            ${layout === 'grid' ? 'aspect-[3/4] flex flex-col justify-end' : 'h-24 flex items-center gap-4'}
          `}
        >
          {layout === 'grid' ? (
            <>
              {/* Dummy hover tooltip to show chaos if not transitioning */}
              <div className="absolute opacity-0 group-hover:opacity-100 top-2 left-2 bg-zinc-900 border border-zinc-700 px-2 py-1 text-xs rounded z-20 transition-all duration-300 group-hover:scale-105">
                {game.title}
              </div>
              <div className="w-8 h-8 bg-zinc-700/50 rounded mb-2"></div>
              <div className="h-4 bg-zinc-700/50 rounded w-1/2"></div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-zinc-700/50 rounded shrink-0"></div>
              <div>
                <div className="h-4 bg-zinc-700/50 rounded w-32 mb-2"></div>
                <div className="h-3 bg-zinc-700/50 rounded w-24"></div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
