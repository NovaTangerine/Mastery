import React, { useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { ArrowLeft, Sparkles, Globe, Database, ArrowRight, X } from 'lucide-react';

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

function findSimilarTracker(input: string, existingTrackers: string[]) {
  if (input.length < 3) return null;
  const lowerInput = input.toLowerCase();
  for (const t of existingTrackers) {
    const lowerT = t.toLowerCase();
    const dist = levenshteinDistance(lowerInput, lowerT);
    const maxLen = Math.max(lowerInput.length, lowerT.length);
    if (dist <= 2 || (maxLen > 5 && dist <= 3)) {
      return t;
    }
  }
  return null;
}

export default function TrackerSyncMockupView() {
  const { navigateTo } = useUI();
  
  const [trackerName, setTrackerName] = useState('');
  const [suggestedSync, setSuggestedSync] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  
  const existingTrackers = ['Hidden Shrines', 'Gold Coins', 'Health Potions', 'Ether', 'Obolites'];

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTrackerName(val);
    setSuggestedSync(findSimilarTracker(val, existingTrackers));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 sm:p-8 pt-6 flex flex-col relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[800px] pointer-events-none bg-[radial-gradient(ellipse_150%_100%_at_50%_0%,rgba(39,39,42,0.5)_0%,rgba(9,9,11,0)_100%)] z-0" />
      
      <div className="relative z-10 flex items-center justify-between mb-12 max-w-[1200px] mx-auto w-full">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigateTo('dashboard')}
            className="p-2 -ml-2 rounded-xl text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Tracker Sync Mockup</h1>
        </div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto w-full space-y-12">
        {/* Interactive Example */}
        <section className="space-y-6">
          <div className="mb-4">
            <h2 className="text-lg font-bold mb-2">Interactive Demo</h2>
            <p className="text-zinc-400 text-sm">
              Type a tracker name that is similar to an existing one (e.g., "Hiden shrines", "Gold coin", "Ethers").
              Our Levenshtein distance algorithm will detect the typo and offer to sync.
            </p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-8">
            {/* Creation UI part */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">1. During Creation</label>
              </div>
              <input 
                type="text" 
                value={trackerName}
                onChange={handleNameChange}
                placeholder="Type 'Gold coin'..." 
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors"
              />
              
              {/* The Alert UI during creation */}
              {suggestedSync && (
                <div className="mt-4 animate-in slide-in-from-top-2 fade-in duration-200">
                  <button 
                    onClick={() => setShowModal(true)}
                    className="w-full text-left p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 transition-all flex items-center justify-between group shadow-lg shadow-indigo-500/5"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400 shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-indigo-100 group-hover:text-white transition-colors mb-1">Similar Tracker Found</h4>
                        <p className="text-xs text-indigo-300">You already track "<strong className="text-indigo-200">{suggestedSync}</strong>" in another session. Click to sync these together.</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-indigo-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </button>
                </div>
              )}
            </div>
            
            {/* Sidebar Alert UI */}
            <div className="pt-6 border-t border-zinc-800/50 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">2. On The Tracker (Sidebar)</label>
              </div>
              <p className="text-xs text-zinc-500 mb-4">If the user misses the alert during creation, we can show a small indicator on the tracker itself.</p>
              
              <div className="w-full max-w-[300px]">
                <div className="group relative bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3 transition-colors flex items-center justify-between cursor-pointer shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                       <span className="w-4 h-4 rounded-full border-2 border-amber-400" />
                    </div>
                    <span className="text-sm text-zinc-300 font-medium">{trackerName || 'Gold coin'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                     {/* The sync alert icon */}
                     <button 
                       onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                       className="relative w-7 h-7 flex items-center justify-center rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors animate-pulse hover:animate-none"
                     >
                       <Sparkles className="w-3.5 h-3.5" />
                       <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-indigo-400 border border-zinc-900" />
                     </button>
                     <span className="text-sm font-bold bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 shadow-inner min-w-[2.5rem] text-center">0</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-800/50">
              <h4 className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">Existing Trackers in DB</h4>
              <div className="flex flex-wrap gap-2">
                {existingTrackers.map(t => (
                  <span key={t} className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-medium text-zinc-400">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Sync Explanation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
              <h2 className="text-lg font-bold">Sync Tracker</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="relative mb-6">
                  <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 border border-indigo-500/30 relative z-10">
                    <Globe className="w-8 h-8" />
                  </div>
                  <div className="absolute top-1/2 left-full w-8 h-0.5 bg-zinc-800 -translate-y-1/2" />
                  <div className="absolute top-1/2 right-full w-8 h-0.5 bg-zinc-800 -translate-y-1/2" />
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-2">Make this a Global Tracker?</h3>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-[280px]">
                  We noticed you track "<strong>{suggestedSync}</strong>" in a previous session.
                </p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 flex gap-4 items-start">
                  <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800/50 shrink-0">
                    <Globe className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100 mb-1">Available Everywhere</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">This tracker will automatically appear in all your future sessions for this game.</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 flex gap-4 items-start">
                  <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800/50 shrink-0">
                    <Database className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-100 mb-1">Persistent Values (Optional)</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed">You can choose to accumulate its value across all sessions, or let it reset each time.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-800/50 flex items-center justify-between bg-zinc-950/50">
              <button 
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-zinc-400 hover:text-zinc-100 font-medium text-sm transition-colors"
              >
                No Thanks
              </button>

              <button 
                onClick={() => {
                  setTrackerName(suggestedSync || trackerName);
                  setShowModal(false);
                  setSuggestedSync(null);
                }}
                className="px-6 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-sm font-bold transition-colors ml-auto shadow-lg shadow-indigo-500/20"
              >
                Sync & Make Global
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
