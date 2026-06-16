import React, { useState, useEffect } from 'react';
import { useUI } from '../contexts/UIContext';
import { RefreshCw } from 'lucide-react';

// Common real-world IGDB cover aspect ratios
const MOCK_IMAGES = [
  'https://images.igdb.com/igdb/image/upload/t_720p/co1x7f.jpg',
  'https://images.igdb.com/igdb/image/upload/t_720p/co1syk.jpg',
  'https://images.igdb.com/igdb/image/upload/t_720p/co2vdg.jpg',
  'https://images.igdb.com/igdb/image/upload/t_720p/co1r7f.jpg',
  'https://images.igdb.com/igdb/image/upload/t_720p/co1wz1.jpg',
  'https://images.igdb.com/igdb/image/upload/t_720p/co1y38.jpg'
];

export default function ImageLoadingMockupView() {
  const { navigateTo } = useUI();
  const [activeTab, setActiveTab] = useState(1);
  const [key, setKey] = useState(0);

  const resetSimulation = () => setKey(k => k + 1);

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Box Art Load Transitions</h1>
        <button 
          onClick={() => navigateTo('dashboard')}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-semibold transition-colors"
        >
          Return to Dashboard
        </button>
      </div>

      <div className="flex border-b border-zinc-800 overflow-x-auto whitespace-nowrap scrollbar-hide">
        <button
          onClick={() => setActiveTab(1)}
          className={`pb-4 px-4 text-sm font-bold transition-colors ${activeTab === 1 ? 'border-b-2 border-amber-400 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Option 1: Smooth Crossfade
        </button>
        <button
          onClick={() => setActiveTab(2)}
          className={`pb-4 px-4 text-sm font-bold transition-colors ${activeTab === 2 ? 'border-b-2 border-amber-400 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Option 2: Focus Pull (Scale Down)
        </button>
        <button
          onClick={() => setActiveTab(3)}
          className={`pb-4 px-4 text-sm font-bold transition-colors ${activeTab === 3 ? 'border-b-2 border-amber-400 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Option 3: Organic Slide-Up
        </button>
        <button
          onClick={() => setActiveTab(4)}
          className={`pb-4 px-4 text-sm font-bold transition-colors ${activeTab === 4 ? 'border-b-2 border-amber-400 text-amber-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          Option 4: Blur Reveal
        </button>
      </div>

      <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 rounded-lg p-4">
         <span className="text-zinc-400 text-sm">Previewing the transition from the skeleton placeholder to the loaded image</span>
         <button
            onClick={resetSimulation}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded text-sm transition-colors font-medium border border-zinc-700"
         >
            <RefreshCw className="w-4 h-4" />
            Reload Images
         </button>
      </div>

      <div className="flex-1 bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 min-h-[400px]">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4" key={key}>
          {MOCK_IMAGES.map((url, i) => (
            <MockImageContainer 
              key={i} 
              url={url} 
              delayMs={300 + (Math.random() * 800)} // Staggered simulation
              animationStyle={activeTab}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function MockImageContainer({ url, delayMs, animationStyle }: { url: string, delayMs: number, animationStyle: number }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // We intentionally delay the "load" to simulate network loading
    // so the user can easily observe the skeleton -> image transition.
    const timer = setTimeout(() => {
      setLoaded(true);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  // Styles/Classes for the loaded image
  let imgClass = "absolute inset-0 w-full h-full object-cover transition-all ";
  let imgStyle = {};

  if (animationStyle === 1) {
    // Option 1: Smooth Crossfade
    imgClass += loaded ? "opacity-100 duration-500 ease-out" : "opacity-0";
  } else if (animationStyle === 2) {
    // Option 2: Focus Pull (Scale Down + Fade)
    imgClass += loaded ? "opacity-100 scale-100 duration-700 ease-out" : "opacity-0 scale-110";
  } else if (animationStyle === 3) {
    // Option 3: Organic Slide-Up
    imgClass += loaded ? "opacity-100 translate-y-0 duration-500 ease-out" : "opacity-0 translate-y-4";
  } else if (animationStyle === 4) {
    // Option 4: Image Blur Reveal
    imgClass += loaded ? "opacity-100 duration-700 ease-out" : "opacity-0";
    imgStyle = { filter: loaded ? 'blur(0px)' : 'blur(8px)' };
  }

  return (
    <div className="aspect-[264/374] bg-zinc-900 rounded-md overflow-hidden relative shadow-md">
      {/* Skeleton Layer */}
      <div 
        className={`absolute inset-0 bg-zinc-800 transition-opacity duration-700 pointer-events-none z-10 ${loaded ? 'opacity-0' : 'animate-pulse'}`} 
      />
      
      {/* Image Layer */}
      <img 
        src={url} 
        alt="Mock Box Art"
        className={imgClass}
        style={imgStyle}
      />
      
      {/* Overlay Border to make it look like our actual cards */}
      <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)] rounded-md z-20 pointer-events-none" />
    </div>
  );
}
