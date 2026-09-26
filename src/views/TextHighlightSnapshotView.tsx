import React, { useState } from 'react';
import { 
  ChevronRight, 
  Archive, 
  AlertTriangle, 
  Highlighter, 
  Code2, 
  Layers, 
  Sparkles, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Smartphone, 
  Eye, 
  FileText,
  Terminal,
  Zap
} from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { HighlightableNoteText, parseNoteSegments } from '../components/HighlightableNoteText';

const INITIAL_DEMO_TEXT = 
  "In ==Elden Ring: Shadow of the Erdtree==, the Scadutree fragment scaling completely shifts the damage curve. When fighting ==Messmer the Impaler==, dodge slightly later than his spear wind-up suggests, and punish after his snake dive animation.";

const PRESETS = [
  {
    label: "Boss Strategy Note",
    text: "In ==Elden Ring: Shadow of the Erdtree==, the Scadutree fragment scaling completely shifts the damage curve. When fighting ==Messmer the Impaler==, dodge slightly later than his spear wind-up suggests, and punish after his snake dive animation."
  },
  {
    label: "RPG Build Note",
    text: "For the ==Netrunner Monowire build== in Cyberpunk 2077, prioritize Intelligence 20 and Reflexes 15. The ==Overclock perk== allows rapid queueing of Synapse Burnout and Cyberware Malfunction."
  },
  {
    label: "Quest Tracker Note",
    text: "Collected 4 of 6 ancient glyphs in the Sunken Ruins. The remaining two require ==Water Breathing ring== or high agility to bypass the drowning tunnels."
  },
  {
    label: "Plain Text (No Highlights)",
    text: "Highlight any section of this sentence with your mouse cursor or keyboard selection to test the floating highlight pill."
  }
];

export default function TextHighlightSnapshotView() {
  const { navigateTo } = useUI();
  const [demoContent, setDemoContent] = useState(INITIAL_DEMO_TEXT);
  const [activeTab, setActiveTab] = useState<'sandbox' | 'architecture' | 'postmortem'>('sandbox');
  const [showTokens, setShowTokens] = useState(true);

  const parsedSegments = parseNoteSegments(demoContent);
  const highlightCount = parsedSegments.filter(s => s.isHighlight).length;

  return (
    <div className="space-y-10 pb-28 max-w-6xl mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase tracking-widest text-xs">
          <button 
            onClick={() => navigateTo('home')}
            className="hover:text-zinc-300 transition-colors"
          >
            Dev Tools
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-zinc-400">Archived Features</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-violet-400">Text Highlight Snapshot</span>
        </div>

        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-mono font-semibold rounded-md">
                PROTOTYPE ARCHIVED
              </span>
              <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-semibold rounded-md">
                REVERTED FROM CORE UI
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Highlighter className="w-8 h-8 text-violet-400" />
              Inline Text Highlight Snapshot & Retrospective
            </h1>
            <p className="text-base sm:text-lg text-zinc-400 mt-2 max-w-3xl leading-relaxed">
              Complete technical specification, archived prototype sandbox, and post-mortem breakdown 
              for the floating-pill gradient text highlighter experiment in Capsule.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setDemoContent(INITIAL_DEMO_TEXT)}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-medium text-zinc-300 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo
            </button>
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800/60 pb-2">
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'sandbox'
                ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Interactive Sandbox
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'architecture'
                ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Technical Architecture
          </button>
          <button
            onClick={() => setActiveTab('postmortem')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'postmortem'
                ? 'bg-violet-500/15 text-violet-300 border border-violet-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            Post-Mortem & Roadblocks
          </button>
        </div>
      </div>

      {/* TAB 1: INTERACTIVE SANDBOX */}
      {activeTab === 'sandbox' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Instructions banner */}
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm text-zinc-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-300 flex items-center justify-center shrink-0">
                <Highlighter className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-zinc-100">Live Test Sandbox</p>
                <p className="text-xs text-zinc-400">
                  Select any text below to summon the floating pill. Click <strong className="text-violet-300">Highlight</strong>. Hover over any highlighted words to trigger the square <strong className="text-red-400">Remove</strong> button.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <span className="text-xs text-zinc-500">Presets:</span>
              {PRESETS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setDemoContent(p.text)}
                  className="px-2.5 py-1 text-xs bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700/60 transition-colors"
                >
                  {p.label.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Sandbox Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Note Preview Canvas */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-violet-400" />
                  Simulated Note Card ({highlightCount} active highlights)
                </label>
                <span className="text-[11px] font-mono text-zinc-500">
                  z-index portal: 99999
                </span>
              </div>

              <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 relative overflow-visible shadow-xl">
                <div className="flex items-center justify-between mb-4 border-b border-zinc-800/60 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    <span className="text-xs font-medium text-zinc-400">Interactive Note Component</span>
                  </div>
                  <span className="text-[11px] font-mono text-zinc-500">Oct 12, 2026 · 14:15</span>
                </div>

                {/* The actual component */}
                <div className="min-h-[120px] select-text py-2">
                  <HighlightableNoteText
                    content={demoContent}
                    onUpdate={(newContent) => setDemoContent(newContent)}
                    className="text-zinc-200 text-base leading-relaxed"
                  />
                </div>

                <div className="mt-6 pt-3 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[10px] font-mono">#strategy</span>
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[10px] font-mono">#boss-tactics</span>
                  </div>
                  <span>Square corners: enabled</span>
                </div>
              </div>

              {/* Direct edit input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                    Direct Raw Text Editor
                  </label>
                  <button 
                    onClick={() => setShowTokens(!showTokens)}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    {showTokens ? "Hide Segment AST" : "View Segment AST"}
                  </button>
                </div>
                <textarea
                  value={demoContent}
                  onChange={(e) => setDemoContent(e.target.value)}
                  rows={3}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-300 focus:outline-none focus:border-violet-500/50 resize-y"
                  placeholder="Type note text or use ==text== for manual highlights..."
                />
              </div>
            </div>

            {/* Live Inspector Panel */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Persistence & State Inspector
                </label>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                  Markdown String
                </span>
              </div>

              {/* Raw Stored String in DB */}
              <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 font-mono text-xs space-y-2">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Underlying Note.content (Stored in Firestore):
                </div>
                <div className="bg-zinc-900/90 p-3 rounded-lg border border-zinc-800 text-zinc-300 break-all select-all leading-normal">
                  {demoContent}
                </div>
                <p className="text-[11px] text-zinc-500 font-sans">
                  Highlights are saved using double-equals syntax (<code className="text-violet-300">==highlighted==</code>), ensuring zero additional Firestore collection queries.
                </p>
              </div>

              {/* Segment AST Inspector */}
              {showTokens && (
                <div className="bg-zinc-950 border border-zinc-800/80 rounded-xl p-4 font-mono text-xs space-y-3 max-h-[340px] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      Parsed AST Segments ({parsedSegments.length})
                    </span>
                    <span className="text-[10px] text-violet-400">
                      {highlightCount} Highlighted
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {parsedSegments.map((seg, idx) => (
                      <div 
                        key={seg.id || idx}
                        className={`p-2 rounded border text-[11px] flex flex-col gap-1 ${
                          seg.isHighlight 
                            ? 'bg-violet-950/40 border-violet-500/40 text-violet-200' 
                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold">
                            {seg.isHighlight ? "🌟 HIGHLIGHT" : "TEXT"} #{idx + 1}
                          </span>
                          <span className="opacity-60">
                            raw: [{seg.rawStart}..{seg.rawEnd}] · visible: [{seg.textStart}..{seg.textEnd}]
                          </span>
                        </div>
                        <div className="truncate font-sans font-medium text-zinc-200">
                          "{seg.text}"
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TECHNICAL ARCHITECTURE */}
      {activeTab === 'architecture' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Layer 1: Markdown Syntax & Storage */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center font-bold">
                1
              </div>
              <h3 className="text-lg font-bold text-white">In-Memory Delimiter Format (<code className="text-violet-400">==...==</code>)</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Rather than creating a secondary Firestore collection or maintaining complex absolute coordinate arrays (which break whenever adjacent text is typed), highlights are serialized directly inside the note’s text string using standard markdown highlight delimiters: <code className="text-zinc-200">==highlighted text==</code>.
              </p>
              <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4">
                <li>Zero database schema migrations required.</li>
                <li>Preserves highlight states across offline caches and network syncs.</li>
                <li>Easily exportable to markdown-compatible systems like Obsidian.</li>
              </ul>
            </div>

            {/* Layer 2: AST Offset Tokenizer */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold">
                2
              </div>
              <h3 className="text-lg font-bold text-white">Two-Pass Offset Tokenizer</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                The parser <code className="text-blue-400">parseNoteSegments(content)</code> generates a flat token stream. Crucially, each segment maintains two sets of coordinate indices:
              </p>
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 font-mono text-xs text-zinc-300 space-y-1">
                <div><span className="text-blue-400">rawStart / rawEnd:</span> Points to indices in the raw <code className="text-zinc-400">==...==</code> string.</div>
                <div><span className="text-emerald-400">textStart / textEnd:</span> Points to visible text without delimiter markers.</div>
              </div>
              <p className="text-xs text-zinc-500">
                This duality allows the browser’s DOM Selection API (which only knows visible characters) to map accurately back to the raw Firestore string.
              </p>
            </div>

            {/* Layer 3: Selection API & Floating Pill */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold">
                3
              </div>
              <h3 className="text-lg font-bold text-white">DOM Range Bridge & High-Z Portal</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                When a user highlights text, <code className="text-purple-400">window.getSelection()</code> calculates bounding rectangles via <code className="text-zinc-200">range.getBoundingClientRect()</code>:
              </p>
              <ul className="text-xs text-zinc-400 space-y-1.5 list-disc pl-4">
                <li><strong className="text-zinc-200">Portal Target:</strong> Rendered to <code className="text-zinc-300">document.body</code> with <code className="text-zinc-300">z-[99999]</code> to break out of overflow and stacking context traps.</li>
                <li><strong className="text-zinc-200">Event Shielding:</strong> Uses <code className="text-zinc-300">{"onMouseDown={(e) => e.preventDefault()}"}</code> on the highlight button so browser focus doesn't collapse the selection before click execution.</li>
                <li><strong className="text-zinc-200">Boundary Aware:</strong> Dynamically flips below the selection if near the top window header.</li>
              </ul>
            </div>

            {/* Layer 4: Inline Flow & Box Break CSS */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold">
                4
              </div>
              <h3 className="text-lg font-bold text-white">Continuous Text Flow & Square Edges</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                To prevent accidental multi-line layout ruptures, the highlight uses a pure inline HTML <code className="text-cyan-400">&lt;mark&gt;</code> element rather than block wrappers:
              </p>
              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/80 font-mono text-xs text-cyan-300">
                box-decoration-break: clone;<br />
                -webkit-box-decoration-break: clone;<br />
                border-radius: 0px; /* square flush edges */
              </div>
              <p className="text-xs text-zinc-500">
                This guarantees multi-line phrases wrap naturally across row boundaries while maintaining continuous gradient styling.
              </p>
            </div>

          </div>

          {/* Code Spec Block */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-mono uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-2">
                <Code2 className="w-4 h-4 text-violet-400" />
                Core Highlight Insertion Logic
              </h4>
              <span className="text-xs font-mono text-zinc-500">HighlightableNoteText.tsx</span>
            </div>

            <pre className="p-4 bg-zinc-900/80 rounded-xl border border-zinc-800/80 text-xs font-mono text-zinc-300 overflow-x-auto leading-relaxed">
{`function applyHighlight(content: string, segments: Segment[], visibleStart: number, visibleEnd: number): string {
  let beforeParts = '';
  let selectedParts = '';
  let afterParts = '';

  for (const seg of segments) {
    if (seg.textEnd <= visibleStart) {
      beforeParts += seg.raw;
    } else if (seg.textStart >= visibleEnd) {
      afterParts += seg.raw;
    } else {
      const segText = seg.text;
      const overlapStart = Math.max(0, visibleStart - seg.textStart);
      const overlapEnd = Math.min(segText.length, visibleEnd - seg.textStart);

      const beforeText = segText.slice(0, overlapStart);
      const selText = segText.slice(overlapStart, overlapEnd);
      const afterText = segText.slice(overlapEnd);

      if (beforeText) beforeParts += seg.isHighlight ? \`==\${beforeText}==\` : beforeText;
      if (selText) selectedParts += selText;
      if (afterText) afterParts += seg.isHighlight ? \`==\${afterText}==\` : afterText;
    }
  }

  const trimmedSel = selectedParts.trim();
  if (!trimmedSel) return content;

  return \`\${beforeParts}==\${trimmedSel}==\${afterParts}\`;
}`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: POST-MORTEM & ROADBLOCKS */}
      {activeTab === 'postmortem' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white">Why This Feature Was Shelved For Now</h3>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  While technically functional in isolated sandboxes, inline drag-to-highlight systems without a rich-text engine (like ProseMirror or Lexical) inevitably hit sharp edge cases in production. Capsule is built on speed, clarity, and zero-friction journaling. The feature introduced subtle UI brittleness that conflicted with that philosophy.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Issue 1 */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <XCircle className="w-4 h-4" />
                Line-Break & DOM Fragmentation
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                When wrapping highlighted phrases inside nested components or <code className="text-zinc-300">inline-block</code> tags, the browser’s text layout engine splits lines at the tag boundary, causing awkward line breaks in the middle of sentences. Even with pure inline <code className="text-zinc-300">&lt;mark&gt;</code>, selecting words with trailing spaces or punctuation caused visible visual stutter during drag.
              </p>
            </div>

            {/* Issue 2 */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <Smartphone className="w-4 h-4" />
                Mobile / Touch OS Context Collisions
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                On iOS Safari and Android Chrome, holding down on text triggers native OS selection handles, magnifying loupes, and contextual menus (Copy / Look Up / Share). The custom floating pill fought with the native callout bar, creating overlapping menus and frustrating dismiss behavior on touch screens.
              </p>
            </div>

            {/* Issue 3 */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <Layers className="w-4 h-4" />
                Partial Overlap & Nested Ranges
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                If a user highlighted a phrase that partially overlapped an existing highlight (e.g., selecting the last word of an existing highlight plus the first word of the next sentence), simple regex replacements risked generating malformed delimiters like <code className="text-zinc-300">====word====</code>, corrupting the note’s visual formatting.
              </p>
            </div>

            {/* Issue 4 */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-semibold text-sm">
                <Zap className="w-4 h-4" />
                Plaintext Editor Leakage
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                When opening a note in edit mode, the raw <code className="text-zinc-300">==highlighted==</code> syntax was exposed in the standard textarea. Unless the editing mode is also a WYSIWYG editor that hides syntax tokens, users were confused seeing raw punctuation markers inside their notes.
              </p>
            </div>

          </div>

          {/* Recommendations for Primetime */}
          <div className="bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              Prerequisites Before Reintroducing for "Primetime"
            </h4>
            <div className="space-y-3 text-xs text-zinc-300 leading-relaxed">
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold">1</span>
                <div>
                  <strong className="text-white">Adopt Headless ProseMirror or TipTap:</strong> Instead of manual regex parsing on top of a plain HTML paragraph, inline annotations require a real document node tree where marks are first-class citizens with built-in selection math and transaction history.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold">2</span>
                <div>
                  <strong className="text-white">Unified WYSIWYG Note Experience:</strong> Reading and editing should share the same document model so users never see raw punctuation delimiters like <code className="text-zinc-400">==</code>.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold">3</span>
                <div>
                  <strong className="text-white">Mobile Bottom-Sheet Annotation Toolbar:</strong> Rather than floating above text where iOS native handles collide, mobile highlights should anchor to a sleek keyboard accessory bar or bottom action sheet.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
