import React, { useState, useEffect } from 'react';
import { useUI } from '../contexts/UIContext';
import { ArrowLeft, RefreshCw, Layers, Zap, CornerDownRight, Shuffle, Droplet } from 'lucide-react';

const ITEMS_COUNT = 20;
const COLS = 5;

type RevealStrategy = 'random' | 'alternating' | 'outside-in' | 'snake' | 'sequential' | 'random-sequential';

export default function ImageRevealLogicMockupView() {
  const { navigateTo } = useUI();
  const [strategy, setStrategy] = useState<RevealStrategy>('random');
  const [rowDelay, setRowDelay] = useState(200);
  const [itemDelay, setItemDelay] = useState(150);
  const [randomDelayMax, setRandomDelayMax] = useState(600);
  const [key, setKey] = useState(0); // To force re-render/re-mount of animations
  const [isRevealing, setIsRevealing] = useState(false);

  useEffect(() => {
    setIsRevealing(true);
    const timer = setTimeout(() => setIsRevealing(false), 2000);
    return () => clearTimeout(timer);
  }, [key, strategy, rowDelay, itemDelay, randomDelayMax]);

  // For random assignment we need a fixed value per item per render cycle
  const [randomDelays, setRandomDelays] = useState<number[]>([]);
  const [shuffledIndices, setShuffledIndices] = useState<number[]>([]);
  useEffect(() => {
    setRandomDelays(Array.from({ length: ITEMS_COUNT }).map(() => Math.floor(Math.random() * randomDelayMax)));
    
    const indices = Array.from({ length: ITEMS_COUNT }).map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffledIndices(indices);
  }, [key, randomDelayMax]);

  const items = Array.from({ length: ITEMS_COUNT }).map((_, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    return { id: i, col, row, index: i };
  });

  // Calculate delay based on strategy
  const getDelay = (col: number, row: number, index: number) => {
    switch (strategy) {
      case 'random':
        return randomDelays[index] || 0;

      case 'sequential':
        // Straight sequential across all items (raindrop effect)
        return index * itemDelay;

      case 'random-sequential':
        // Random placement of uniform timings (random raindrop effect)
        return (shuffledIndices[index] || 0) * itemDelay;

      case 'alternating':
        // Alternating sides: Leftmost, Rightmost, Inner Left, Inner Right, Center
        let order = 0;
        if (col < Math.ceil(COLS / 2)) {
          order = col * 2;
        } else {
          order = (COLS - 1 - col) * 2 + 1;
        }
        return (row * rowDelay) + (order * itemDelay);

      case 'outside-in':
        // Both outside edges first, then converging to the center
        const maxDist = (COLS - 1) / 2;
        const distFromCenter = Math.abs(col - maxDist);
        const colIndex = maxDist - distFromCenter;
        return (row * rowDelay) + (colIndex * itemDelay);

      case 'snake':
        // Row 0: L -> R. Row 1: R -> L.
        const isEvenRow = row % 2 === 0;
        const snakeCol = isEvenRow ? col : (COLS - 1 - col);
        return (row * rowDelay) + (snakeCol * itemDelay);

      default:
        return 0;
    }
  };

  const handleReplay = () => setKey(prev => prev + 1);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans p-8 pt-12 relative overflow-x-hidden">
      
      {/* Background Polish */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-12">

          <div>
            <h1 className="text-4xl font-light tracking-tight mb-2 text-white">Image Reveal Logic</h1>
            <p className="text-zinc-400 text-lg font-light">
              Testing structured stagger delays for box art load ins, based on grid placement.
            </p>
          </div>
          <button 
            onClick={() => navigateTo('dashboard')}
            className="px-4 py-2 bg-zinc-800/80 hover:bg-zinc-700/80 backdrop-blur-md rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 border border-zinc-700/50"
          >
            <ArrowLeft className="w-4 h-4" />
            Return Main
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Controls Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-6 shadow-2xl">
              <h2 className="text-xs font-bold text-zinc-400 border-b border-zinc-800 pb-2 uppercase tracking-widest mb-4">
                Delay Strategies
              </h2>
              
              <div className="space-y-2 mb-6">
                <button
                  onClick={() => setStrategy('random')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex flex-col gap-0.5 ${
                    strategy === 'random'
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                      : 'bg-zinc-950/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800/50'
                  }`}
                >
                  <span className="font-semibold flex items-center gap-2">
                    <Shuffle className="w-4 h-4" /> Random
                  </span>
                  <span className="text-[11px] opacity-70 leading-relaxed">
                    Completely random delay for each item.
                  </span>
                </button>

                <button
                  onClick={() => setStrategy('sequential')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex flex-col gap-0.5 ${
                    strategy === 'sequential'
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                      : 'bg-zinc-950/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800/50'
                  }`}
                >
                  <span className="font-semibold flex items-center gap-2">
                    <Droplet className="w-4 h-4" /> Raindrop (Sequential)
                  </span>
                  <span className="text-[11px] opacity-70 leading-relaxed">
                    Pure top-to-bottom, left-to-right cascade.
                  </span>
                </button>

                <button
                  onClick={() => setStrategy('random-sequential')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex flex-col gap-0.5 ${
                    strategy === 'random-sequential'
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                      : 'bg-zinc-950/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800/50'
                  }`}
                >
                  <span className="font-semibold flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-blue-400" /> Random Raindrop
                  </span>
                  <span className="text-[11px] opacity-70 leading-relaxed">
                    Uniform drop intervals positioned randomly on the grid.
                  </span>
                </button>

                <button
                  onClick={() => setStrategy('alternating')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex flex-col gap-0.5 ${
                    strategy === 'alternating'
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                      : 'bg-zinc-950/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800/50'
                  }`}
                >
                  <span className="font-semibold flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Alternating Sides
                  </span>
                  <span className="text-[11px] opacity-70 leading-relaxed">
                    Left edge, then right edge, then the middle.
                  </span>
                </button>

                <button
                  onClick={() => setStrategy('outside-in')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex flex-col gap-0.5 ${
                    strategy === 'outside-in'
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                      : 'bg-zinc-950/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800/50'
                  }`}
                >
                  <span className="font-semibold flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Symmetrical (Outside-In)
                  </span>
                  <span className="text-[11px] opacity-70 leading-relaxed">
                    Outer edges appear simultaneously, converging to the center.
                  </span>
                </button>

                <button
                  onClick={() => setStrategy('snake')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all flex flex-col gap-0.5 ${
                    strategy === 'snake'
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                      : 'bg-zinc-950/50 border-zinc-800/50 text-zinc-400 hover:bg-zinc-800/50'
                  }`}
                >
                  <span className="font-semibold flex items-center gap-2">
                    <CornerDownRight className="w-4 h-4" /> Snake / Zig-Zag
                  </span>
                  <span className="text-[11px] opacity-70 leading-relaxed">
                    Row 1 flows left-to-right. Row 2 flows right-to-left.
                  </span>
                </button>
              </div>

              {/* Timing Controls based on Strategy */}
              <div className="bg-zinc-950 rounded-xl p-4 mb-6 border border-zinc-800/50 space-y-4">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-800/50 pb-2 mb-2">Timing Parameters</h3>
                
                {strategy === 'random' ? (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs text-zinc-400">
                      <label>Max Delay</label>
                      <span>{randomDelayMax}ms</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" max="2000" step="50" 
                      value={randomDelayMax} 
                      onChange={(e) => setRandomDelayMax(parseInt(e.target.value))}
                      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs text-zinc-400">
                        <label>
                          {strategy === 'sequential' || strategy === 'random-sequential' ? 'Cascade Delay (ms per item)' : 'Item Delay (in-row offset)'}
                        </label>
                        <span>{itemDelay}ms</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="1000" step="10" 
                        value={itemDelay} 
                        onChange={(e) => setItemDelay(parseInt(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                      />
                      <p className="text-[10px] text-zinc-600">
                        {strategy === 'sequential' || strategy === 'random-sequential' ? 'Delay between each sequential item' : 'Staggering between columns'}
                      </p>
                    </div>

                    {strategy !== 'sequential' && strategy !== 'random-sequential' && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs text-zinc-400">
                          <label>Row Delay</label>
                          <span>{rowDelay}ms</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" max="1000" step="10" 
                          value={rowDelay} 
                          onChange={(e) => setRowDelay(parseInt(e.target.value))}
                          className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-[10px] text-zinc-600">Base delay added for each new row</p>
                      </div>
                    )}
                  </>
                )}
              </div>

              <button
                onClick={handleReplay}
                className="w-full py-3 bg-zinc-100 hover:bg-white text-zinc-950 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                disabled={isRevealing}
              >
                <RefreshCw className={`w-4 h-4 ${isRevealing ? 'animate-spin' : ''}`} />
                Replay Animation
              </button>
              
            </div>
            
            <div className="bg-blue-900/10 border border-blue-800/30 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-blue-300 mb-2">How it works</h3>
              <p className="text-xs text-blue-100/70 leading-relaxed">
                Rather than pure randomness, we assign an explicit `transitionDelay` to each box-art component based on its dynamic <code>(col, row)</code> position in the grid.
              </p>
            </div>
          </div>

          {/* Grid Preview */}
          <div className="lg:col-span-8 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-8 shadow-inner relative min-h-[600px] lg:sticky lg:top-8 self-start">
             
             <style>{`
               @keyframes stagger-fade-in {
                 0% { opacity: 0; transform: scale(0.95); filter: blur(10px); }
                 100% { opacity: 1; transform: scale(1); filter: blur(0px); }
               }
               .stagger-item {
                 opacity: 0;
                 animation: stagger-fade-in 700ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
               }
             `}</style>

             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6" key={key}>
                {items.map((item) => {
                  const delay = getDelay(item.col, item.row, item.index);
                  
                  return (
                    <div 
                      key={item.id}
                      className="aspect-[264/374] w-full rounded-md relative overflow-hidden bg-zinc-900 shadow-lg border border-white/5 stagger-item"
                      style={{ animationDelay: `${delay}ms` }}
                    >
                      {/* Fake Blur Component representing the loaded image */}
                      <div className="absolute inset-0 bg-zinc-800 flex flex-col items-center justify-center">
                         <div className="text-4xl font-black text-black/20 mb-2">{item.id + 1}</div>
                         <div className="text-xs font-mono text-zinc-400 bg-zinc-950/50 px-2 py-1 rounded">
                           {delay}ms
                         </div>
                      </div>
                    </div>
                  );
                })}
             </div>

          </div>

        </div>
      </div>
    </div>
  );
}
