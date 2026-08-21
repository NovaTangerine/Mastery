import React, { useState, useMemo } from 'react';
import { useUI } from '../contexts/UIContext';
import { 
  ArrowLeft, Tag as TagIcon, Plus, X, Check, RefreshCw, 
  Sparkles, Layers, Sliders, Info, ShieldCheck, AlertCircle, 
  LayoutGrid, ListOrdered, ArrowRight, BookOpen, Trash2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface PresetScenario {
  id: string;
  name: string;
  description: string;
  tags: string[];
}

const PRESETS: PresetScenario[] = [
  {
    id: 'small',
    name: 'Small Collection (4 tags, 4 letters)',
    description: 'Fewer than 8 tags. Should stay in compact flat mode to avoid sparse 1-item letter sections.',
    tags: ['boss', 'lore', 'quest', 'secret']
  },
  {
    id: 'clustered',
    name: 'High Volume, Few Letters (10 tags, 3 letters)',
    description: '10 tags, but only starting with B, D, Q. Fails the 5-letter threshold, avoiding redundant letter headers.',
    tags: ['boss', 'build', 'bug', 'dungeon', 'drop', 'death', 'dlc', 'quest', 'quick', 'quote']
  },
  {
    id: 'diverse-few',
    name: 'Diverse but Low Count (5 tags, 5 letters)',
    description: '5 different starting letters (A, B, C, D, E), but only 5 tags total. Stays flat.',
    tags: ['armor', 'boss', 'crafting', 'dungeon', 'equipment']
  },
  {
    id: 'boundary-8',
    name: 'Exact Boundary: 8 tags, 5 letters',
    description: 'Boundary test: Exactly 8 tags (needs > 8). Stays flat.',
    tags: ['armor', 'boss', 'build', 'combat', 'crafting', 'dungeon', 'lore', 'magic']
  },
  {
    id: 'threshold-pass',
    name: 'Threshold Met (12 tags, 7 letters)',
    description: 'Meets both rules (> 8 tags AND ≥ 5 letters). Upgrades to structured alphabetical index.',
    tags: ['alchemy', 'armor', 'boss', 'build', 'combat', 'crafting', 'dungeon', 'equipment', 'lore', 'magic', 'quest', 'secrets']
  },
  {
    id: 'large-rpg',
    name: 'Rich RPG Vocabulary (18 tags, 10 letters)',
    description: 'Dense tag library. Alphabetical index creates clean, scannable categorization.',
    tags: [
      'alchemy', 'armor', 'boss', 'build', 'combat', 'crafting', 'dialogue', 
      'dungeon', 'equipment', 'farming', 'lore', 'magic', 'npc', 'puzzle', 
      'quest', 'secrets', 'upgrade', 'vendor'
    ]
  }
];

export default function TagGroupingMockupView() {
  const { navigateTo } = useUI();
  
  // Active tags state
  const [tags, setTags] = useState<string[]>(PRESETS[4].tags);
  const [newTagInput, setNewTagInput] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [renderModeOverride, setRenderModeOverride] = useState<'auto' | 'force-flat' | 'force-alpha' | 'comparison'>('auto');
  
  // Custom threshold parameters (for interactive tweaking)
  const [minTagThreshold, setMinTagThreshold] = useState<number>(8);
  const [minLetterThreshold, setMinLetterThreshold] = useState<number>(5);

  // Computed metrics
  const totalTags = tags.length;
  
  const distinctLettersList = useMemo(() => {
    const letters = new Set<string>();
    tags.forEach(t => {
      const clean = t.trim().replace(/^#/, '');
      if (clean.length > 0) {
        letters.add(clean.charAt(0).toUpperCase());
      }
    });
    return Array.from(letters).sort();
  }, [tags]);

  const distinctLettersCount = distinctLettersList.length;

  // The core heuristic condition
  const meetsCountThreshold = totalTags > minTagThreshold;
  const meetsLetterThreshold = distinctLettersCount >= minLetterThreshold;
  const shouldGroupAlphabetically = meetsCountThreshold && meetsLetterThreshold;

  // Grouped structure
  const groupedTags = useMemo(() => {
    const sorted = [...tags].sort((a, b) => a.localeCompare(b));
    const groups: { letter: string; tags: string[] }[] = [];
    
    sorted.forEach(tag => {
      const clean = tag.trim().replace(/^#/, '');
      const letter = clean.charAt(0).toUpperCase() || '#';
      let group = groups.find(g => g.letter === letter);
      if (!group) {
        group = { letter, tags: [] };
        groups.push(group);
      }
      group.tags.push(clean);
    });

    return groups;
  }, [tags]);

  const handleAddTag = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = newTagInput.trim().toLowerCase().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags(prev => [...prev, clean]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(t => t !== tagToRemove));
    if (selectedTag === tagToRemove) setSelectedTag(null);
  };

  const loadPreset = (preset: PresetScenario) => {
    setTags(preset.tags);
    setSelectedTag(null);
  };

  // Mock note count generator for realistic visual presentation
  const getMockCount = (tag: string) => {
    let hash = 0;
    for (let i = 0; i < tag.length; i++) hash = (hash * 31 + tag.charCodeAt(i)) % 15;
    return (hash % 8) + 1;
  };

  // Render a tag chip
  const renderTagChip = (tag: string) => {
    const count = getMockCount(tag);
    const isSelected = selectedTag === tag;

    return (
      <div 
        key={tag}
        onClick={() => setSelectedTag(isSelected ? null : tag)}
        className={cn(
          "group relative inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-lg text-xs font-mono transition-all select-none cursor-pointer border",
          isSelected 
            ? "bg-indigo-950/80 border-indigo-500/80 text-indigo-200 shadow-sm"
            : "bg-zinc-900/90 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700 hover:text-zinc-100"
        )}
      >
        <span className="text-zinc-500 text-[11px] font-bold">#</span>
        <span className="truncate max-w-[130px]">{tag}</span>
        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/80 px-1 rounded ml-0.5 border border-zinc-700/40">
          {count}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveTag(tag);
          }}
          className="ml-1 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
          title="Remove tag"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 sm:p-8 pt-6 flex flex-col relative overflow-x-hidden">
      {/* Subtle radial ambient background */}
      <div className="absolute inset-x-0 top-0 h-[800px] pointer-events-none bg-[radial-gradient(ellipse_150%_100%_at_50%_0%,rgba(39,39,42,0.4)_0%,rgba(9,9,11,0)_100%)] z-0" />

      {/* Top Navigation Bar */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 max-w-7xl mx-auto w-full pb-6 border-b border-zinc-800/60">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigateTo('dashboard')}
            className="p-2 -ml-2 rounded-xl text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-mono uppercase tracking-wider rounded-md font-bold">
                DevTools Prototype
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                Tag Grouping Logic & Threshold Heuristic
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Rule: Only switch to Alphabetical Sectioned Index when <span className="text-zinc-200 font-mono font-semibold">Total Tags &gt; {minTagThreshold}</span> AND <span className="text-zinc-200 font-mono font-semibold">Starting Letters &ge; {minLetterThreshold}</span>
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900/90 rounded-xl border border-zinc-800 shrink-0 self-start md:self-auto">
          <button
            onClick={() => setRenderModeOverride('auto')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              renderModeOverride === 'auto' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Auto Heuristic
          </button>
          <button
            onClick={() => setRenderModeOverride('force-flat')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              renderModeOverride === 'force-flat' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Force Flat
          </button>
          <button
            onClick={() => setRenderModeOverride('force-alpha')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              renderModeOverride === 'force-alpha' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            Force Alpha
          </button>
          <button
            onClick={() => setRenderModeOverride('comparison')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              renderModeOverride === 'comparison' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            Side-by-Side
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Metrics, Presets & Controls */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Live Heuristic Status Card */}
          <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                Live Heuristic Evaluation
              </h2>
              <span className={cn(
                "px-2.5 py-1 rounded-full text-xs font-bold tracking-wide border flex items-center gap-1.5",
                shouldGroupAlphabetically
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-300 border-amber-500/30"
              )}>
                {shouldGroupAlphabetically ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Alphabetical Index Active
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
                    Flat Chip Flow Active
                  </>
                )}
              </span>
            </div>

            {/* Threshold Checks Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Check 1: Total Tags */}
              <div className={cn(
                "p-3 rounded-xl border flex flex-col justify-between transition-colors",
                meetsCountThreshold 
                  ? "bg-emerald-950/20 border-emerald-800/40" 
                  : "bg-zinc-950/40 border-zinc-800"
              )}>
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span>Tag Volume</span>
                  <span className="font-mono text-[11px]">&gt; {minTagThreshold}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-white">{totalTags}</span>
                  <span className="text-xs text-zinc-500 font-medium">tags</span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[11px] font-medium">
                  {meetsCountThreshold ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Met ({totalTags} &gt; {minTagThreshold})
                    </span>
                  ) : (
                    <span className="text-zinc-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-400" /> Need {minTagThreshold + 1 - totalTags} more
                    </span>
                  )}
                </div>
              </div>

              {/* Check 2: Starting Letters */}
              <div className={cn(
                "p-3 rounded-xl border flex flex-col justify-between transition-colors",
                meetsLetterThreshold 
                  ? "bg-emerald-950/20 border-emerald-800/40" 
                  : "bg-zinc-950/40 border-zinc-800"
              )}>
                <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
                  <span>Starting Letters</span>
                  <span className="font-mono text-[11px]">&ge; {minLetterThreshold}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-white">{distinctLettersCount}</span>
                  <span className="text-xs text-zinc-500 font-medium">letters</span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-[11px] font-medium">
                  {meetsLetterThreshold ? (
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Met ({distinctLettersCount} &ge; {minLetterThreshold})
                    </span>
                  ) : (
                    <span className="text-zinc-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-400" /> Need {minLetterThreshold - distinctLettersCount} more
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Active Letters Array */}
            <div className="bg-zinc-950/50 border border-zinc-800/60 rounded-xl p-3">
              <div className="text-[11px] text-zinc-400 font-medium mb-1.5 flex items-center justify-between">
                <span>Unique Letters Present ({distinctLettersCount}):</span>
                <span className="font-mono text-[10px] text-zinc-500">{distinctLettersList.join(', ') || 'None'}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(letter => {
                  const isPresent = distinctLettersList.includes(letter);
                  return (
                    <span
                      key={letter}
                      className={cn(
                        "w-5 h-5 rounded text-[10px] font-mono flex items-center justify-center font-bold transition-colors",
                        isPresent 
                          ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40" 
                          : "text-zinc-700 bg-zinc-900/30"
                      )}
                    >
                      {letter}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Preset Scenarios */}
          <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              Test Scenario Presets
            </h2>
            <div className="space-y-2">
              {PRESETS.map((preset) => {
                const isSelected = JSON.stringify(tags) === JSON.stringify(preset.tags);
                return (
                  <button
                    key={preset.id}
                    onClick={() => loadPreset(preset)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 group",
                      isSelected 
                        ? "bg-zinc-800/90 border-zinc-700 text-white shadow-sm" 
                        : "bg-zinc-950/40 border-zinc-800/60 text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold group-hover:text-white transition-colors">{preset.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500">{preset.tags.length} tags</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed group-hover:text-zinc-400 transition-colors">
                      {preset.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Tag Management */}
          <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-emerald-400" />
                Add &amp; Manage Tags
              </h2>
              <button 
                onClick={() => setTags([])}
                className="text-[10px] text-zinc-500 hover:text-red-400 transition-colors flex items-center gap-1"
                title="Clear all tags"
              >
                <Trash2 className="w-3 h-3" /> Clear All
              </button>
            </div>

            {/* Input Form */}
            <form onSubmit={handleAddTag} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-mono">#</span>
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  placeholder="Type new tag name..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-7 pr-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
                />
              </div>
              <button
                type="submit"
                disabled={!newTagInput.trim()}
                className="px-4 bg-zinc-100 text-zinc-950 hover:bg-white disabled:opacity-40 text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </form>

            {/* Quick Add Suggestions */}
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold block mb-1.5">
                Quick Add Suggestions:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['alchemy', 'build', 'crafting', 'dialogue', 'farming', 'lore', 'magic', 'npc', 'quest', 'secret', 'stealth', 'upgrade', 'vendor', 'weapon', 'zone']
                  .filter(t => !tags.includes(t))
                  .slice(0, 8)
                  .map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTags(prev => [...prev, t])}
                      className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800/80 hover:border-zinc-700 text-zinc-400 hover:text-zinc-200 text-[10px] font-mono transition-colors"
                    >
                      + #{t}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Realistic Sidebar Panel Simulation */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Main Simulated Panel */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800/60">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TagIcon className="w-4 h-4 text-indigo-400" />
                  Simulated Game Tags Panel
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Rendering mode: <span className="font-bold text-zinc-200">
                    {renderModeOverride === 'auto' 
                      ? (shouldGroupAlphabetically ? 'Alphabetical Sectioned Index (Auto)' : 'Flat Flow (Auto)')
                      : renderModeOverride === 'force-alpha' ? 'Forced Alphabetical'
                      : renderModeOverride === 'force-flat' ? 'Forced Flat Flow'
                      : 'Side-by-Side Mode'}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-400">
                  {totalTags} tags · {distinctLettersCount} letters
                </span>
              </div>
            </div>

            {/* Side-by-Side Comparison Mode */}
            {renderModeOverride === 'comparison' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Flat Flow Column */}
                <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/50">
                    <span className="text-xs font-bold text-zinc-300">1. Flat Flow Layout</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Simple flex-wrap</span>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[140px] content-start">
                    {tags.length === 0 ? (
                      <p className="text-xs text-zinc-600 italic py-4">No tags present.</p>
                    ) : (
                      tags.map(tag => renderTagChip(tag))
                    )}
                  </div>
                </div>

                {/* Alphabetical Section Column */}
                <div className="bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/50">
                    <span className="text-xs font-bold text-zinc-300">2. Alphabetical Index Layout</span>
                    <span className="text-[10px] text-zinc-500 font-mono">Grouped A-Z</span>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[140px] content-start">
                    {tags.length === 0 ? (
                      <p className="text-xs text-zinc-600 italic py-4">No tags present.</p>
                    ) : (
                      groupedTags.map(group => (
                        <React.Fragment key={group.letter}>
                          <div className="w-full flex items-center mt-2 first:mt-0">
                            <span className="text-[10px] font-bold text-zinc-500 w-4 shrink-0 text-center">{group.letter}</span>
                            <div className="h-px bg-zinc-800/60 flex-1 ml-2" />
                          </div>
                          {group.tags.map(tag => renderTagChip(tag))}
                        </React.Fragment>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Single Simulated Active View */
              <div className="bg-zinc-950/70 border border-zinc-800/70 rounded-xl p-5 min-h-[220px]">
                {tags.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-12">
                    <TagIcon className="w-8 h-8 text-zinc-700 mb-2" />
                    <p className="text-xs text-zinc-500">No tags to display. Use presets or add tags on the left.</p>
                  </div>
                ) : (
                  (renderModeOverride === 'force-alpha' || (renderModeOverride === 'auto' && shouldGroupAlphabetically)) ? (
                    /* Alphabetical Grouped Rendering */
                    <div className="flex flex-wrap gap-2 items-center">
                      {groupedTags.map(group => (
                        <React.Fragment key={group.letter}>
                          <div className="w-full flex items-center mt-3 first:mt-0 mb-1">
                            <span className="text-[10px] font-mono font-bold text-zinc-500 w-4 shrink-0 text-center">{group.letter}</span>
                            <div className="h-px bg-zinc-800/80 flex-1 ml-2" />
                          </div>
                          {group.tags.map(tag => renderTagChip(tag))}
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    /* Flat Flow Rendering */
                    <div className="flex flex-wrap gap-2 items-center">
                      {tags.map(tag => renderTagChip(tag))}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Architectural Notes & Heuristic Explanation */}
          <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" />
              Why this threshold heuristic works
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-400 leading-relaxed">
              <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-xl p-3.5">
                <span className="font-bold text-zinc-200 block mb-1">1. Prevents 1-Item Header Clutter</span>
                <p>
                  In early gameplay or games with few tags (e.g. 4 tags: #boss, #lore, #quest, #secret), an alphabetical list generates 4 separate letter dividers with only one tag per divider. This creates vertical noise without indexing value.
                </p>
              </div>

              <div className="bg-zinc-950/40 border border-zinc-800/50 rounded-xl p-3.5">
                <span className="font-bold text-zinc-200 block mb-1">2. Prevents Monolithic Grouping</span>
                <p>
                  Requiring &ge; 5 distinct letters ensures that a player who has 10 tags starting with just two letters (e.g. B and D) isn't given excessive letter chrome for an un-diversified vocabulary.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
