import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TagIcon, Image as ImageIcon, MapPin, Search } from 'lucide-react';
import Markdown from 'react-markdown';

// Sample data for the mockup
const MOCK_TAGS = [
  { id: '1', name: 'Lore', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
  { id: '2', name: 'Boss Fight', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
  { id: '3', name: 'Quest', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  { id: '4', name: 'Loot', color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' }
];

const MOCK_NOTES = [
  {
    id: 'n1',
    content: '**Malenia, Blade of Miquella**\n\nFound at the bottom of the Haligtree. She heals on every hit, even if blocked. Need to perfect dodge the Waterfowl Dance or use a shield with barricade ash of war.\n\nPhase 2 starts with Scarlet Aeonia. Run underneath and roll behind to punish.',
    tags: [MOCK_TAGS[1], MOCK_TAGS[0]],
    timestamp: new Date().getTime() - 1000 * 60 * 60 * 2, // 2 hours ago
  },
  {
    id: 'n2',
    content: 'Found a secret path behind the illusionary wall in the Volcano Manor drawing room. Leads to the Prison Town Church. Lots of serpent men here.',
    tags: [MOCK_TAGS[2]],
    timestamp: new Date().getTime() - 1000 * 60 * 60 * 24, // 1 day ago
  },
  {
    id: 'n3',
    content: 'Need to collect 3 more Deathroot to give to Gurranq for the Beast Claw incantation. Check the catacombs in Mountaintops of the Giants.',
    tags: [MOCK_TAGS[3], MOCK_TAGS[2]],
    timestamp: new Date().getTime() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
  }
];

export default function NoteVisualsMockupView() {
  const [activeVariant, setActiveVariant] = useState(0);

  const VARIANTS = [
    { name: 'Variant 1: Angled Corner & Gradient Hover', id: 'v1' },
    { name: 'Variant 2: Organic Blob Shift & Outline', id: 'v2' },
    { name: 'Variant 3: Pill/Card Hybrid & Elevated Lightness', id: 'v3' },
    { name: 'Variant 4: The "Datapad" (Tech-forward geometry)', id: 'v4' }
  ];

  return (
    <div className="min-h-[100dvh] bg-zinc-950 text-zinc-100 p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Header */}
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Note Visuals Exploration</h1>
          <p className="text-zinc-400">Exploring organic shapes, subtle gradients, color-coded tags, and elevated visual hierarchy for the notes feed.</p>
          
          <div className="flex flex-wrap gap-2 mt-4">
            {VARIANTS.map((variant, idx) => (
              <button
                key={variant.id}
                onClick={() => setActiveVariant(idx)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeVariant === idx ? 'bg-zinc-100 text-zinc-900 shadow-md' : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'}`}
              >
                {variant.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="mt-12 bg-[#0c0c0e] rounded-3xl p-8 min-h-[600px] border border-zinc-800/50 shadow-2xl relative overflow-hidden flex flex-col items-center">
            {/* Ambient Background Noise */}
            <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}></div>

            <div className="w-full max-w-2xl space-y-8 relative z-10">
                {MOCK_NOTES.map((note) => (
                    <NoteVariant key={note.id} note={note} variant={VARIANTS[activeVariant].id} />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}

function NoteVariant({ note, variant }: { note: any, variant: string }) {
  // Format the date (simple mock format)
  const dateObj = new Date(note.timestamp);
  const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (variant === 'v1') {
    // Variant 1: Angled Corner & Gradient Hover
    // - Angled top-right corner using clip-path
    // - Subtle gradient background that intensifies on hover
    // - Border outline on hover
    return (
      <motion.div
        whileHover="hover"
        initial="initial"
        className="relative group cursor-pointer"
      >
        {/* Glow/Gradient behind for hover */}
        <motion.div 
            variants={{
                initial: { opacity: 0 },
                hover: { opacity: 1 }
            }}
            className="absolute -inset-[2px] bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 blur-sm rounded-2xl transition-opacity duration-300"
            style={{ clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)' }}
        />
        
        {/* Main Note Body */}
        <div 
            className="relative bg-zinc-900/80 backdrop-blur-sm border border-zinc-800/80 p-5 shadow-sm transition-all duration-300 group-hover:bg-zinc-800/90 group-hover:border-zinc-700/80"
            style={{ 
                // Creating the angled corner effect top-right
                clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)',
                borderTopRightRadius: 0,
                borderTopLeftRadius: '16px',
                borderBottomLeftRadius: '16px',
                borderBottomRightRadius: '16px'
            }}
        >
            {/* The folded corner piece */}
            <div className="absolute top-0 right-0 w-[20px] h-[20px] bg-zinc-800/50 border-b border-l border-zinc-700/30" />

            {/* Header: Tags & Time */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex flex-wrap gap-2">
                    {note.tags.map((tag: any) => (
                        <span key={tag.id} className={`px-2 py-0.5 rounded-md text-[11px] font-bold tracking-wider uppercase border ${tag.color}`}>
                            {tag.name}
                        </span>
                    ))}
                </div>
                <span className="text-xs text-zinc-500 font-mono">{timeString}</span>
            </div>

            {/* Content: Slightly larger font */}
            <div className="prose prose-invert prose-zinc max-w-none text-[15px] leading-relaxed text-zinc-300">
                <Markdown>{note.content}</Markdown>
            </div>
        </div>
      </motion.div>
    );
  }

  if (variant === 'v2') {
    // Variant 2: Organic Blob Shift & Outline
    // - Very subtle, shifting gradient background (simulated with radial gradient)
    // - Asymmetrical border radii to feel organic
    // - Lighter background color for elevation
    return (
      <div className="relative group cursor-pointer rounded-[24px] p-[1px] transition-all duration-300 overflow-hidden">
        {/* Animated border gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-800 group-hover:from-zinc-500 group-hover:to-zinc-800 transition-colors duration-500 opacity-50" />
        
        <div 
            className="relative bg-zinc-800/50 hover:bg-zinc-800/80 backdrop-blur-md p-6 transition-all duration-300 z-10"
            style={{ 
                // Organic, slightly irregular shape
                borderRadius: '24px 24px 20px 24px',
                background: 'radial-gradient(circle at top left, rgba(255,255,255,0.03), transparent 70%)'
            }}
        >
            {/* Header: Tags & Time */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-wrap gap-1.5">
                    {note.tags.map((tag: any) => (
                        <span key={tag.id} className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase flex items-center gap-1.5 ${tag.color.replace('rounded-md', 'rounded-full')}`}>
                            <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                            {tag.name}
                        </span>
                    ))}
                </div>
                <span className="text-xs text-zinc-500">{timeString}</span>
            </div>

            {/* Content */}
            <div className="prose prose-invert prose-zinc max-w-none text-base leading-[1.7] text-zinc-200">
                <Markdown>{note.content}</Markdown>
            </div>
        </div>
      </div>
    );
  }

  if (variant === 'v3') {
    // Variant 3: Pill/Card Hybrid & Elevated Lightness
    // - Lighter gray background, distinctly elevated
    // - Smooth, large border radius, almost pill-like for the header
    // - Stronger border outline on hover
    return (
      <div className="group cursor-pointer bg-[#1c1c1f] rounded-[28px] border border-transparent hover:border-zinc-600 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-0.5">
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-800/50">
                <div className="flex flex-wrap gap-2">
                    {note.tags.map((tag: any) => {
                        // Extract just the colors
                        const textMatch = tag.color.match(/text-([a-z]+-[0-9]+)/);
                        const textColorClass = textMatch ? textMatch[0] : 'text-zinc-300';
                        const bgColorClass = textMatch ? `bg-${textMatch[1].split('-')[0]}-500/10` : 'bg-zinc-800';
                        return (
                        <span key={tag.id} className={`px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide ${textColorClass} ${bgColorClass}`}>
                            #{tag.name.toLowerCase().replace(' ', '')}
                        </span>
                    )})}
                </div>
                <span className="text-xs text-zinc-500 font-medium">{timeString}</span>
            </div>

            {/* Content */}
            <div className="prose prose-invert prose-zinc max-w-none text-[15px] sm:text-base leading-relaxed text-zinc-100 font-medium">
                <Markdown>{note.content}</Markdown>
            </div>
        </div>
      </div>
    );
  }

  if (variant === 'v4') {
    // Variant 4: The "Datapad"
    // - Subtle sci-fi UI feel, chamfered corners, distinct border left
    // - Gradient highlight on left border
    return (
      <div className="group cursor-pointer relative pl-1 transition-all duration-300 hover:pl-2">
        {/* Colored left indicator matching primary tag */}
        <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-full opacity-50 group-hover:opacity-100 transition-all duration-300 ${note.tags[0]?.color.split(' ')[0] || 'bg-zinc-600'}`} />
        
        <div 
            className="bg-zinc-900/60 border border-zinc-800/50 p-5 transition-all duration-300 group-hover:bg-zinc-800/80 group-hover:border-zinc-600/50"
            style={{
                borderRadius: '4px 16px 16px 16px'
            }}
        >
            <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] text-zinc-500 font-mono border border-zinc-800 px-1.5 py-0.5 rounded">LOG_{note.id.toUpperCase()}</span>
                <div className="flex flex-wrap gap-1.5">
                    {note.tags.map((tag: any) => (
                        <span key={tag.id} className={`text-[10px] font-bold tracking-widest uppercase ${tag.color.match(/text-([a-z]+-[0-9]+)/)?.[0] || 'text-zinc-400'}`}>
                            [{tag.name}]
                        </span>
                    ))}
                </div>
                <span className="ml-auto text-xs text-zinc-500 font-mono">{timeString}</span>
            </div>

            <div className="prose prose-invert prose-zinc max-w-none text-[15px] leading-relaxed text-zinc-300 font-mono tracking-tight">
                <Markdown>{note.content}</Markdown>
            </div>
        </div>
      </div>
    );
  }

  return null;
}
