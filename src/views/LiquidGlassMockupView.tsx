import React, { useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { 
  ChevronRight, Sparkles, Sliders, Check, Copy, RefreshCw, 
  Layers, Eye, ShieldCheck, MoreVertical, Edit2, Trash2, 
  PenLine, Plus, ExternalLink, ArrowRight, BookOpen, CheckCircle2,
  Tag as TagIcon, Sparkle, LayoutGrid, Clock, Calendar, Lock
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function LiquidGlassMockupView() {
  const { navigateTo } = useUI();

  // Interactive Live Tuning Parameters
  const [surfaceAlpha, setSurfaceAlpha] = useState<number>(0.10);
  const [blurRadius, setBlurRadius] = useState<number>(8);
  const [borderAlpha, setBorderAlpha] = useState<number>(0.20);
  const [rimAlpha, setRimAlpha] = useState<number>(0.25);
  const [rimColorType, setRimColorType] = useState<'indigo' | 'cyan' | 'amber' | 'emerald' | 'monochrome'>('indigo');
  const [cornerPreset, setCornerPreset] = useState<'organic' | 'standard' | 'fluid' | 'subtle' | 'pill'>('organic');
  const [shadowDepth, setShadowDepth] = useState<'production' | 'subtle' | 'deep' | 'glowing'>('production');
  const [backdropTheme, setBackdropTheme] = useState<'game-art' | 'neon-grid' | 'session-notes' | 'charcoal'>('game-art');
  
  // Interactive Menu Open States
  const [activeMenu, setActiveMenu] = useState<string | null>('note-menu');
  const [copiedCode, setCopiedCode] = useState(false);

  // Derived styling for live tuned glass
  const getRimRgba = () => {
    switch (rimColorType) {
      case 'indigo': return `rgba(132, 131, 200, ${rimAlpha})`;
      case 'cyan': return `rgba(56, 189, 248, ${rimAlpha})`;
      case 'amber': return `rgba(251, 191, 36, ${rimAlpha})`;
      case 'emerald': return `rgba(52, 211, 153, ${rimAlpha})`;
      case 'monochrome': return `rgba(255, 255, 255, ${rimAlpha})`;
    }
  };

  const getBorderRadius = () => {
    switch (cornerPreset) {
      case 'organic': return '8px 8px 20px 20px';
      case 'standard': return '12px 12px 12px 12px';
      case 'fluid': return '10px 10px 28px 28px';
      case 'subtle': return '6px 6px 14px 14px';
      case 'pill': return '24px 24px 24px 24px';
    }
  };

  const getShadow = () => {
    const rim = getRimRgba();
    switch (shadowDepth) {
      case 'production':
        return `0 0 0 1px ${rim}, 0 20px 48px rgba(0, 0, 0, 0.28)`;
      case 'subtle':
        return `0 0 0 1px ${rim}, 0 10px 24px rgba(0, 0, 0, 0.18)`;
      case 'deep':
        return `0 0 0 1px ${rim}, 0 30px 60px rgba(0, 0, 0, 0.45)`;
      case 'glowing':
        return `0 0 0 1px ${rim}, 0 0 24px ${rim}, 0 20px 48px rgba(0, 0, 0, 0.35)`;
    }
  };

  const customGlassStyle: React.CSSProperties = {
    background: `rgba(255, 255, 255, ${surfaceAlpha})`,
    backdropFilter: `blur(${blurRadius}px)`,
    WebkitBackdropFilter: `blur(${blurRadius}px)`,
    border: `1px solid rgba(255, 255, 255, ${borderAlpha})`,
    boxShadow: getShadow(),
    borderRadius: getBorderRadius(),
  };

  const resetToProductionDefaults = () => {
    setSurfaceAlpha(0.10);
    setBlurRadius(8);
    setBorderAlpha(0.20);
    setRimAlpha(0.25);
    setRimColorType('indigo');
    setCornerPreset('organic');
    setShadowDepth('production');
  };

  const handleCopyCSS = () => {
    const cssText = `.liquid-glass-box {
  background: rgba(255, 255, 255, ${surfaceAlpha});
  backdrop-filter: blur(${blurRadius}px);
  -webkit-backdrop-filter: blur(${blurRadius}px);
  border: 1px solid rgba(255, 255, 255, ${borderAlpha});
  box-shadow: 
    0 0 0 1px ${getRimRgba()},
    0 20px 48px rgba(0, 0, 0, 0.28);
  border-radius: ${getBorderRadius()};
}`;
    navigator.clipboard.writeText(cssText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-12 pb-28 max-w-7xl mx-auto">
      {/* Header & Breadcrumb */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase tracking-widest text-xs">
          <button 
            onClick={() => navigateTo('home')}
            className="hover:text-zinc-300 transition-colors"
          >
            Dev Tools
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-zinc-300">Liquid Glass Menus Experiment</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Liquid Glass Pop-up Menus
              </h1>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                In Production
              </span>
            </div>
            <p className="text-zinc-400 text-base sm:text-lg max-w-3xl mt-2 leading-relaxed">
              An optical refraction design system for floating context menus, dropdowns, and interactive popovers. 
              Replaces opaque zinc cards with a translucent 5-layer glass sheen, ambient specular rim highlights, and ergonomic asymmetric corner radii.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigateTo('dashboard')}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-sm font-semibold transition-colors border border-zinc-800"
            >
              Back to App
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Tuner Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 space-y-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-200">
                  Optical Engine Tuner
                </h2>
              </div>
              <button
                onClick={resetToProductionDefaults}
                className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 hover:underline"
              >
                <RefreshCw className="w-3 h-3" /> Reset
              </button>
            </div>

            {/* Parameter 1: Surface Alpha */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-zinc-300">Surface Translucency (Alpha)</span>
                <span className="font-mono text-cyan-400">{(surfaceAlpha * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range"
                min="0.02"
                max="0.35"
                step="0.01"
                value={surfaceAlpha}
                onChange={(e) => setSurfaceAlpha(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-[11px] text-zinc-500">
                Translucent white base tint allowing background textures to bleed through.
              </p>
            </div>

            {/* Parameter 2: Blur Radius */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-zinc-300">Backdrop Blur Radius</span>
                <span className="font-mono text-cyan-400">{blurRadius}px</span>
              </div>
              <input 
                type="range"
                min="0"
                max="24"
                step="1"
                value={blurRadius}
                onChange={(e) => setBlurRadius(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-[11px] text-zinc-500">
                Gaussian optical filter diffusing underlying cover art and UI text.
              </p>
            </div>

            {/* Parameter 3: Border Highlight Alpha */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-zinc-300">Frosted Edge Highlight</span>
                <span className="font-mono text-cyan-400">{(borderAlpha * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range"
                min="0.05"
                max="0.50"
                step="0.01"
                value={borderAlpha}
                onChange={(e) => setBorderAlpha(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <p className="text-[11px] text-zinc-500">
                1px crisp highlight rim creating physical refraction borders.
              </p>
            </div>

            {/* Parameter 4: Rim Ring Color & Alpha */}
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-zinc-300">Ambient Rim Specular Glow</span>
                <span className="font-mono text-cyan-400">{(rimAlpha * 100).toFixed(0)}%</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {(['indigo', 'cyan', 'amber', 'emerald', 'monochrome'] as const).map((color) => (
                  <button
                    key={color}
                    onClick={() => setRimColorType(color)}
                    className={cn(
                      "py-1.5 rounded-lg text-[11px] font-semibold capitalize border transition-all",
                      rimColorType === color
                        ? "bg-zinc-800 text-white border-white/40 shadow-sm"
                        : "bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                    )}
                  >
                    {color === 'indigo' ? 'Indigo*' : color}
                  </button>
                ))}
              </div>
              <input 
                type="range"
                min="0.05"
                max="0.60"
                step="0.01"
                value={rimAlpha}
                onChange={(e) => setRimAlpha(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Parameter 5: Corner Curvature Preset */}
            <div className="space-y-2">
              <span className="block text-xs font-semibold text-zinc-300">Corner Curvature Preset</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'organic', name: 'Organic (8/8/20/20)*' },
                  { id: 'standard', name: 'Standard (12px)' },
                  { id: 'fluid', name: 'Fluid (10/10/28/28)' },
                  { id: 'subtle', name: 'Subtle (6/6/14/14)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setCornerPreset(item.id as any)}
                    className={cn(
                      "p-2 rounded-xl text-xs text-left border transition-all font-medium",
                      cornerPreset === item.id 
                        ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/30" 
                        : "bg-zinc-950/40 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                    )}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Parameter 6: Backdrop Theme Simulator */}
            <div className="space-y-2 pt-2 border-t border-zinc-800">
              <span className="block text-xs font-semibold text-zinc-300">Backdrop Simulation</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'game-art', name: 'Game Cover Art' },
                  { id: 'neon-grid', name: 'Cyberpunk Neon' },
                  { id: 'session-notes', name: 'Session & Notes UI' },
                  { id: 'charcoal', name: 'Obsidian Void' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setBackdropTheme(t.id as any)}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-all",
                      backdropTheme === t.id
                        ? "bg-zinc-800 text-white border-zinc-600"
                        : "bg-zinc-950/50 text-zinc-400 border-zinc-800/80 hover:text-zinc-300"
                    )}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Live Interactive Glass Canvas */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
            
            {/* Backdrop Simulation Frame */}
            <div className="relative min-h-[440px] rounded-2xl overflow-hidden border border-zinc-800 p-6 flex flex-col justify-between select-none">
              
              {/* Dynamic Simulated Backgrounds */}
              {backdropTheme === 'game-art' && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-zinc-950/80 to-transparent z-10" />
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 p-4 opacity-40 scale-105">
                    <img src="https://images.igdb.com/igdb/image/upload/t_720p/co1x7f.jpg" alt="Elden Ring" className="rounded-xl object-cover h-44 w-full" referrerPolicy="no-referrer" />
                    <img src="https://images.igdb.com/igdb/image/upload/t_720p/co1syk.jpg" alt="Cyberpunk" className="rounded-xl object-cover h-44 w-full" referrerPolicy="no-referrer" />
                    <img src="https://images.igdb.com/igdb/image/upload/t_720p/co2vdg.jpg" alt="Zelda" className="rounded-xl object-cover h-44 w-full" referrerPolicy="no-referrer" />
                    <img src="https://images.igdb.com/igdb/image/upload/t_720p/co1r7f.jpg" alt="Silksong" className="rounded-xl object-cover h-44 w-full hidden sm:block" referrerPolicy="no-referrer" />
                  </div>
                </div>
              )}

              {backdropTheme === 'neon-grid' && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-purple-500/10 to-zinc-950 z-10" />
                  <div className="absolute top-10 right-10 w-72 h-72 rounded-full bg-cyan-500/20 blur-3xl" />
                  <div className="absolute bottom-10 left-10 w-80 h-80 rounded-full bg-purple-600/20 blur-3xl" />
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
                </div>
              )}

              {backdropTheme === 'session-notes' && (
                <div className="absolute inset-0 pointer-events-none p-6 opacity-35 space-y-4">
                  <div className="h-6 w-1/3 bg-zinc-700 rounded-md" />
                  <div className="h-20 bg-zinc-800 rounded-xl p-4 border border-zinc-700 space-y-2">
                    <div className="h-3 w-3/4 bg-zinc-600 rounded" />
                    <div className="h-3 w-1/2 bg-zinc-600 rounded" />
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 bg-amber-500/20 rounded-full text-xs text-amber-300">#boss-fight</span>
                    <span className="px-3 py-1 bg-indigo-500/20 rounded-full text-xs text-indigo-300">#lore</span>
                    <span className="px-3 py-1 bg-cyan-500/20 rounded-full text-xs text-cyan-300">#secrets</span>
                  </div>
                </div>
              )}

              {backdropTheme === 'charcoal' && (
                <div className="absolute inset-0 bg-zinc-950 pointer-events-none" />
              )}

              {/* Floating Menu Demonstrations */}
              <div className="relative z-20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10">
                    <Sparkle className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span className="text-xs font-semibold text-zinc-200">Interactive Glass Specimens</span>
                  </div>
                  <span className="text-xs text-zinc-400">Click any trigger below to inspect popover optics</span>
                </div>

                {/* Grid of Menus for inspection */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                  
                  {/* Menu Specimen 1: Note Options Context Menu */}
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Note Context</span>
                    <div 
                      style={customGlassStyle}
                      className="w-full min-w-[150px] overflow-hidden py-1"
                    >
                      <button className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:text-white hover:bg-white/10 flex items-center gap-2 transition-colors whitespace-nowrap">
                        <Edit2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Edit note</span>
                      </button>
                      <button className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:text-white hover:bg-white/10 flex items-center gap-2 transition-colors whitespace-nowrap">
                        <TagIcon className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                        <span>Manage tags</span>
                      </button>
                      <div className="h-px bg-white/10 my-1" />
                      <button className="w-full px-3 py-2 text-left text-xs text-red-400 font-medium hover:text-red-300 hover:bg-red-500/20 flex items-center gap-2 transition-colors whitespace-nowrap">
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Delete note</span>
                      </button>
                    </div>
                  </div>

                  {/* Menu Specimen 2: Tag & Tracker Options */}
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Tracker / Tag</span>
                    <div 
                      style={customGlassStyle}
                      className="w-full min-w-[150px] overflow-hidden py-1"
                    >
                      <button className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:text-white hover:bg-white/10 flex items-center gap-2 transition-colors whitespace-nowrap">
                        <PenLine className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span>Edit tracker</span>
                      </button>
                      <button className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:text-white hover:bg-white/10 flex items-center gap-2 transition-colors whitespace-nowrap">
                        <RefreshCw className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
                        <span>Reset count</span>
                      </button>
                      <div className="h-px bg-white/10 my-1" />
                      <button className="w-full px-3 py-2 text-left text-xs text-red-400 font-medium hover:text-red-300 hover:bg-red-500/20 flex items-center gap-2 transition-colors whitespace-nowrap">
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Delete tracker</span>
                      </button>
                    </div>
                  </div>

                  {/* Menu Specimen 3: Game / Library Actions */}
                  <div className="flex flex-col items-start gap-2">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Game Library Menu</span>
                    <div 
                      style={customGlassStyle}
                      className="w-full min-w-[160px] overflow-hidden py-1"
                    >
                      <button className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:text-amber-300 hover:bg-white/10 flex items-center gap-2 transition-colors font-semibold whitespace-nowrap">
                        <RefreshCw className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span>Sync with IGDB</span>
                      </button>
                      <button className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:text-white hover:bg-white/10 flex items-center gap-2 transition-colors whitespace-nowrap">
                        <LayoutGrid className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                        <span>Swap Box Art</span>
                      </button>
                      <div className="h-px bg-white/10 my-1" />
                      <button className="w-full px-3 py-2 text-left text-xs text-red-400 font-medium hover:text-red-300 hover:bg-red-500/20 flex items-center gap-2 transition-colors whitespace-nowrap">
                        <Trash2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Delete game</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* Bottom Specs Pill */}
              <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-white/10 mt-6">
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-300 bg-black/50 px-3 py-1.5 rounded-lg border border-white/10">
                  <span>blur({blurRadius}px)</span>
                  <span className="text-zinc-600">•</span>
                  <span>alpha: {(surfaceAlpha * 100).toFixed(0)}%</span>
                  <span className="text-zinc-600">•</span>
                  <span>radius: {getBorderRadius()}</span>
                </div>

                <button
                  onClick={handleCopyCSS}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg text-xs font-semibold border border-cyan-500/30 transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied CSS!' : 'Copy CSS Snippet'}</span>
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Side-by-Side Comparison Matrix */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
          <Layers className="w-6 h-6 text-indigo-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">Visual Paradigm Comparison</h2>
            <p className="text-zinc-400 text-sm">Evaluating the evolution from opaque solid cards to modern optical liquid glass.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Legacy Flat Solid */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Legacy Pattern</span>
              <span className="text-xs text-red-400 font-semibold px-2 py-0.5 bg-red-500/10 rounded-md">Opaque Flat</span>
            </div>
            <h3 className="text-lg font-bold text-zinc-200">Solid Zinc Box</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Used standard <code>bg-zinc-900 border-zinc-800</code>. Blocked all background context, creating heavy dark blocks that felt disjointed from vibrant box art.
            </p>
            <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800 flex justify-center">
              <div className="w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1">
                <div className="px-3 py-2 text-xs text-zinc-300 flex items-center gap-2">
                  <Edit2 className="w-3.5 h-3.5 text-zinc-500" /> Edit Item
                </div>
                <div className="h-px bg-zinc-800 my-1" />
                <div className="px-3 py-2 text-xs text-red-500 flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" /> Delete Item
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Naive Glass */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Naive Glassmorphism</span>
              <span className="text-xs text-amber-400 font-semibold px-2 py-0.5 bg-amber-500/10 rounded-md">Low Contrast</span>
            </div>
            <h3 className="text-lg font-bold text-zinc-200">Uncalibrated Blur</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Standard glass without rim highlights or tailored text contrast. Text becomes muddy over colorful backgrounds, failing accessibility.
            </p>
            <div className="p-4 bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-xl border border-zinc-800 flex justify-center">
              <div className="w-48 bg-zinc-800/40 backdrop-blur-sm border border-zinc-700/50 rounded-lg shadow-lg py-1">
                <div className="px-3 py-2 text-xs text-zinc-400 flex items-center gap-2">
                  <Edit2 className="w-3.5 h-3.5" /> Edit Item
                </div>
                <div className="h-px bg-zinc-700/30 my-1" />
                <div className="px-3 py-2 text-xs text-red-400/80 flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" /> Delete Item
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Production Liquid Glass */}
          <div className="bg-gradient-to-b from-cyan-950/20 to-zinc-900/60 border border-cyan-500/30 rounded-2xl p-6 space-y-4 relative shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Current Production</span>
              <span className="text-xs text-cyan-300 font-semibold px-2 py-0.5 bg-cyan-500/20 rounded-md">Liquid Glass</span>
            </div>
            <h3 className="text-lg font-bold text-white">5-Layer Optical Sheen</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Combines 10% translucent surface, 8px backdrop blur, 20% white highlight rim, ambient 1px indigo specular glow, and <code>8px 8px 20px 20px</code> organic asymmetric radii.
            </p>
            <div className="p-4 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-zinc-950/80 rounded-xl border border-indigo-500/20 flex justify-center">
              <div className="liquid-glass-box w-48 py-1 overflow-hidden">
                <div className="px-3 py-2 text-xs text-zinc-200 hover:text-white flex items-center gap-2">
                  <Edit2 className="w-3.5 h-3.5 text-cyan-400" /> Edit Item
                </div>
                <div className="h-px bg-white/10 my-1" />
                <div className="px-3 py-2 text-xs text-red-400 font-medium flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" /> Delete Item
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Production Deployment Architecture & Component Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Optical Layer Architecture */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">The 5 Optical Layers</h3>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
              <div>
                <strong className="text-zinc-100 text-sm">Translucent Base Sheen (10% Alpha)</strong>
                <p className="text-xs text-zinc-400 mt-0.5"><code>background: rgba(255, 255, 255, 0.10)</code> gives depth while retaining legibility.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
              <div>
                <strong className="text-zinc-100 text-sm">Gaussian Optical Blur (8px)</strong>
                <p className="text-xs text-zinc-400 mt-0.5"><code>backdrop-filter: blur(8px)</code> softens background high-frequency noise without muddying colors.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
              <div>
                <strong className="text-zinc-100 text-sm">Frosted Refraction Border (20% White)</strong>
                <p className="text-xs text-zinc-400 mt-0.5"><code>border: 1px solid rgba(255, 255, 255, 0.20)</code> outlines the physical edge cleanly against dark and light themes.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">4</span>
              <div>
                <strong className="text-zinc-100 text-sm">Ambient Specular Glow Ring</strong>
                <p className="text-xs text-zinc-400 mt-0.5"><code>box-shadow: 0 0 0 1px rgba(132, 131, 200, 0.25)</code> adds subtle violet luminescence on the outer edge.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">5</span>
              <div>
                <strong className="text-zinc-100 text-sm">Organic Asymmetric Curvature (8px / 20px)</strong>
                <p className="text-xs text-zinc-400 mt-0.5"><code>border-radius: 8px 8px 20px 20px</code> creates an ergonomic, teardrop-fluid silhouette that anchors dropdown menus naturally.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Components Using Liquid Glass in Production */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-800">
            <CheckCircle2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-white">Active Production Implementations</h3>
          </div>

          <ul className="space-y-3 text-xs text-zinc-300">
            <li className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="font-semibold text-zinc-200">Note Actions & Tag Context Menus</span>
              <code className="text-[11px] text-cyan-400 font-mono">SortableNote.tsx</code>
            </li>
            <li className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="font-semibold text-zinc-200">Session Tracker Actions & Metrics</span>
              <code className="text-[11px] text-cyan-400 font-mono">TrackerCard.tsx / MetricCard.tsx</code>
            </li>
            <li className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="font-semibold text-zinc-200">Sidebar Sessions & Group Menus</span>
              <code className="text-[11px] text-cyan-400 font-mono">SessionSidebar.tsx</code>
            </li>
            <li className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="font-semibold text-zinc-200">Trackers Panel Tag Action Popover</span>
              <code className="text-[11px] text-cyan-400 font-mono">TrackersPanel.tsx</code>
            </li>
            <li className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="font-semibold text-zinc-200">Add Tracker Preset & Custom Menu</span>
              <code className="text-[11px] text-cyan-400 font-mono">AddTrackerMenu.tsx</code>
            </li>
            <li className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="font-semibold text-zinc-200">Library Game Card Dropdowns (Grid & List)</span>
              <code className="text-[11px] text-cyan-400 font-mono">DashboardView.tsx</code>
            </li>
            <li className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
              <span className="font-semibold text-zinc-200">User Profile Menu Dropdown</span>
              <code className="text-[11px] text-cyan-400 font-mono">ProfileDropdown.tsx</code>
            </li>
          </ul>
        </div>

      </div>

    </div>
  );
}
