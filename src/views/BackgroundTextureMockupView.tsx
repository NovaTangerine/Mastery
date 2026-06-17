import React, { useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { Settings, Home, ArrowLeft } from 'lucide-react';

const TEXTURES = [
  {
    id: 'none',
    name: 'None',
    description: 'Plain deep background with radial spotlight',
    style: {}
  },
  {
    id: 'film-grain',
    name: 'Film Grain / Noise',
    description: 'Classic Letterboxd-style subtle grain',
    style: {
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E")`
    }
  },
  {
    id: 'carbon-fiber',
    name: 'Carbon Fiber',
    description: 'Sleek luxury car dashboard feel',
    style: {
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Crect width='8' height='8' fill='%2318181b'%3E%3C/rect%3E%3Cpath d='M0 0L8 8ZM8 0L0 8Z' stroke='%2327272a' stroke-width='1'/%3E%3C/svg%3E")`,
      backgroundSize: '8px 8px'
    }
  },
  {
    id: 'leather',
    name: 'Premium Leather',
    description: 'Organic, subtle luxury bump map',
    style: {
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.05' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='matrix' values='1 0 0 0 0, 0 1 0 0 0, 0 0 1 0 0, 0 0 0 0.1 0' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
    }
  },
  {
    id: 'blueprint-grid',
    name: 'Architect Grid',
    description: 'Technical, progressive blueprint',
    style: {
      backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
      backgroundSize: '32px 32px'
    }
  },
  {
    id: 'dot-matrix',
    name: 'Dot Matrix',
    description: 'Retro-futuristic perforated dots',
    style: {
      backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)`,
      backgroundSize: '16px 16px'
    }
  },
  {
    id: 'topography',
    name: 'Abstract Topography',
    description: 'Wave lines simulating maps/journaling',
    style: {
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0V0zm20 20c-5.52 0-10-4.48-10-10S14.48 0 20 0s10 4.48 10 10-4.48 10-10 10zm0 20c-5.52 0-10-4.48-10-10s4.48-10 10-10 10 4.48 10 10-4.48 10-10 10zM20 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z' fill='%23ffffff' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`
    }
  }
];

export default function BackgroundTextureMockupView() {
  const { navigateTo } = useUI();
  const [activeTexture, setActiveTexture] = useState(TEXTURES[1]); // Default to noise
  const [opacity, setOpacity] = useState(100);
  const [blendMode, setBlendMode] = useState<string>('normal');

  return (
    <div className="relative min-h-screen flex flex-col w-full text-zinc-100 font-sans">
      
      {/* Background Layer with Texture */}
      <div className="fixed inset-0 z-0 bg-[#0a0a0a] overflow-hidden pointer-events-none">
        
        {/* Core Spotlight Gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[800px] bg-amber-500/10 rounded-full blur-[150px] opacity-50" />
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-orange-600/10 rounded-full blur-[120px] opacity-30" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-blue-900/10 rounded-full blur-[150px] opacity-20" />

        {/* Texture Layer */}
        {activeTexture.id !== 'none' && (
          <div 
            className="absolute inset-0"
            style={{
              ...activeTexture.style,
              opacity: opacity / 100,
              mixBlendMode: blendMode as any
            }}
          />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 p-8 max-w-6xl mx-auto w-full pt-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Background Textures</h1>
            <p className="text-zinc-400 text-lg">Exploring premium, tactile surfaces for the application.</p>
          </div>
          <button 
            onClick={() => navigateTo('dashboard')}
            className="px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-md rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return Main
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Controls Panel */}
          <div className="lg:col-span-5 bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Texture Settings
            </h2>
            
            <div className="space-y-8">
              {/* Texture Selection */}
              <div>
                <h3 className="text-zinc-300 font-medium mb-3">Surface Type</h3>
                <div className="grid grid-cols-1 gap-2">
                  {TEXTURES.map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTexture(t)}
                      className={`text-left px-4 py-3 rounded-lg border transition-all ${
                        activeTexture.id === t.id 
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.1)]' 
                          : 'bg-zinc-950/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                      }`}
                    >
                      <div className="font-semibold">{t.name}</div>
                      <div className={`text-xs mt-1 ${activeTexture.id === t.id ? 'text-amber-200/50' : 'text-zinc-600'}`}>
                        {t.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacity Control */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-zinc-300 font-medium">Texture Intensity</h3>
                  <span className="text-xs text-amber-500 font-mono">{opacity}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={opacity} 
                  onChange={e => setOpacity(parseInt(e.target.value))}
                  className="w-full accent-amber-500 h-2 bg-zinc-800 rounded-full appearance-none cursor-pointer"
                />
              </div>

              {/* Blend Mode Control */}
              <div>
                <h3 className="text-zinc-300 font-medium mb-3">Blend Mode</h3>
                <div className="flex flex-wrap gap-2">
                  {['normal', 'overlay', 'multiply', 'screen', 'soft-light', 'color-dodge'].map(mode => (
                    <button
                      key={mode}
                      onClick={() => setBlendMode(mode)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                        blendMode === mode 
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700 hover:text-zinc-200'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Panel - Mock Content to see texture behind it */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-zinc-900/40 backdrop-blur-md border border-zinc-700/30 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <h3 className="text-xl font-bold mb-4 relative z-10 text-white">Sample Content Card</h3>
              <p className="text-zinc-400 leading-relaxed relative z-10 mb-6">
                Notice how the texture interacts with the solid content areas versus the semi-transparent blurred backgrounds. Premium surfaces should feel tactile without distracting from the typography and box art.
              </p>
              <div className="flex gap-4 relative z-10">
                <div className="h-32 w-24 bg-zinc-800 rounded-md shadow-lg border border-white/10" />
                <div className="h-32 w-24 bg-zinc-800 rounded-md shadow-lg border border-white/10" />
                <div className="h-32 w-24 bg-zinc-800 rounded-md shadow-lg border border-white/10" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                  <h4 className="font-semibold text-zinc-200 mb-2">High Contrast Component</h4>
                  <div className="h-2 w-full bg-zinc-800 rounded-full mt-4 overflow-hidden">
                    <div className="h-full w-2/3 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]" />
                  </div>
               </div>
               <div className="bg-black/40 backdrop-blur-sm border border-black/50 rounded-2xl p-6">
                  <h4 className="font-semibold text-zinc-200 mb-2">Dark Component</h4>
                  <p className="text-xs text-zinc-500">Texture visibility depends highly on the blending mode and underlying color.</p>
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
