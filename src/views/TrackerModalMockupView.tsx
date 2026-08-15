import React, { useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Plus, X, TagIcon, Crosshair, Package, Shield, Key, Loader2, Sparkles } from 'lucide-react';

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

export default function TrackerModalMockupView() {
  const { navigateTo } = useUI();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'v1' | 'v2'>('v2');
  const [isOpen, setIsOpen] = useState(true);
  
  // V1 State
  const [step, setStep] = useState<'details' | 'category-select' | 'category-config' | 'sync-explanation'>('details');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [isGlobal, setIsGlobal] = useState(false);
  const [isPersistent, setIsPersistent] = useState(false);

  const [trackerName, setTrackerName] = useState('');
  const [suggestedSync, setSuggestedSync] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [committedGroup, setCommittedGroup] = useState<string | null>(null);

  const [isLoadingReturnal, setIsLoadingReturnal] = useState(false);
  const [mockContext, setMockContext] = useState<'default' | 'returnal'>('default');
  const [returnalTrackerNames, setReturnalTrackerNames] = useState<string[]>([]);
  const [returnalGroups, setReturnalGroups] = useState<string[]>([]);

  const defaultGroups = ['Combat', 'Exploration', 'Story'];
  const commonGroups = ['Objectives', 'Weapons', 'Equipment', 'Bosses', 'Collectibles', 'Points of Interest'];
  
  const suggestedGroups = mockContext === 'returnal' ? [...returnalGroups] : [...defaultGroups];
  if (suggestedGroups.length < 5) {
    const remaining = commonGroups.filter(g => !suggestedGroups.includes(g));
    suggestedGroups.push(...remaining.slice(0, 5 - suggestedGroups.length));
  }

  const handleLoadReturnalContext = async () => {
    if (!user) return;
    setIsLoadingReturnal(true);
    try {
      const gamesQ = query(collection(db, 'games'), where('uid', '==', user.uid));
      const gamesSnap = await getDocs(gamesQ);
      const returnalGame = gamesSnap.docs.find(d => d.data().title.toLowerCase() === 'returnal');
      
      if (returnalGame) {
        const sessionsQ = query(collection(db, 'sessions'), where('gameId', '==', returnalGame.id), where('uid', '==', user!.uid));
        const sessionsSnap = await getDocs(sessionsQ);
        
        const uniqueGroups = new Set<string>();
        const uniqueTrackers = new Set<string>();
        
        sessionsSnap.docs.forEach(doc => {
          const data = doc.data();
          if (data.metrics && Array.isArray(data.metrics)) {
            data.metrics.forEach((m: any) => {
              if (m.group) uniqueGroups.add(m.group);
              if (m.title) uniqueTrackers.add(m.title);
            });
          }
        });
        
        setReturnalGroups(Array.from(uniqueGroups));
        setReturnalTrackerNames(Array.from(uniqueTrackers));
        setMockContext('returnal');
      } else {
        alert("Returnal game not found in your library");
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoadingReturnal(false);
    setIsOpen(true);
  };

  const categories = [
    { id: 'objective', name: 'Objectives', icon: <Crosshair className="w-5 h-5 text-rose-400" /> },
    { id: 'collectibles', name: 'Collectibles', icon: <Package className="w-5 h-5 text-amber-400" /> },
    { id: 'equipment', name: 'Equipment', icon: <Shield className="w-5 h-5 text-blue-400" /> },
    { id: 'codes', name: 'Codes', icon: <Key className="w-5 h-5 text-emerald-400" /> }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 sm:p-8 pt-6 flex flex-col relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[800px] pointer-events-none bg-[radial-gradient(ellipse_150%_100%_at_50%_0%,rgba(39,39,42,0.5)_0%,rgba(9,9,11,0)_100%)] z-0" />
      
      <div className="relative z-10 flex items-center justify-between mb-4 max-w-[1600px] mx-auto w-full">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigateTo('dashboard')}
            className="p-2 -ml-2 rounded-xl text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight">Tracker Modal UI Prototype</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button
             onClick={handleLoadReturnalContext}
             disabled={isLoadingReturnal}
             className="px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {isLoadingReturnal ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Load Returnal Context
          </button>
          <button
             onClick={() => setIsOpen(true)}
             className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg text-sm font-bold transition-colors"
          >
            Open Modal
          </button>
        </div>
      </div>

      <div className="relative z-10 flex border-b border-zinc-800/50 mb-8 max-w-[1600px] mx-auto w-full">
        <button
          onClick={() => { setActiveTab('v1'); setIsOpen(true); }}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'v1' ? 'border-zinc-100 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          Trackers V1 (Current)
        </button>
        <button
          onClick={() => { setActiveTab('v2'); setIsOpen(true); }}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'v2' ? 'border-zinc-100 text-zinc-100' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
        >
          Trackers V2 (Flexible Data)
        </button>
      </div>

      {isOpen && activeTab === 'v1' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
              <h2 className="text-lg font-bold">
                {step === 'details' && 'Create Tracker'}
                {step === 'category-config' && 'Configure Tracker'}
                {step === 'sync-explanation' && 'Sync Tracker'}
              </h2>
              <button 
                onClick={() => { setIsOpen(false); setStep('details'); }}
                className="p-1 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
              {step === 'details' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Tracker Name</label>
                    <input 
                      type="text" 
                      list="tracker-suggestions"
                      value={trackerName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setTrackerName(val);
                        const existing = mockContext === 'returnal' ? returnalTrackerNames : ['Hidden Shrines', 'Gold Coins', 'Health Potions'];
                        const similar = findSimilarTracker(val, existing);
                        setSuggestedSync(similar);
                      }}
                      placeholder="e.g., Hidden Shrines" 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors"
                    />
                    {mockContext === 'returnal' && returnalTrackerNames.length > 0 && (
                      <datalist id="tracker-suggestions">
                        {returnalTrackerNames.map(name => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    )}
                    {suggestedSync && (
                      <div className="mt-3 animate-in slide-in-from-top-2 fade-in duration-200">
                        <button 
                          onClick={() => setStep('sync-explanation')}
                          className="w-full text-left p-3 rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors flex items-start gap-3 group"
                        >
                          <div className="p-1.5 bg-indigo-500/20 rounded-lg text-indigo-400">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-indigo-100 group-hover:text-white transition-colors">Similar Tracker Found</h4>
                            <p className="text-xs text-indigo-300 mt-0.5">You track "<strong>{suggestedSync}</strong>" in another session. Click to sync.</p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Group (Optional)</label>
                    <div className="relative">
                      {committedGroup ? (
                        <div className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 flex items-center justify-between min-h-[46px] transition-colors">
                          <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400">
                            {committedGroup}
                          </span>
                          <button
                            onClick={() => { setCommittedGroup(null); setGroupName(''); }}
                            className="p-1 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors mr-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <input 
                          type="text" 
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          onBlur={() => { if (groupName.trim()) setCommittedGroup(groupName.trim()); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' && groupName.trim()) setCommittedGroup(groupName.trim()); }}
                          placeholder="e.g., Combat, Exploration" 
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors min-h-[46px]"
                        />
                      )}
                    </div>
                    <div 
                      className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-out ${committedGroup ? 'grid-rows-[0fr] opacity-0 mt-0' : 'grid-rows-[1fr] opacity-100 mt-2'}`}
                    >
                      <div className="overflow-hidden flex flex-wrap gap-2 items-start pt-1">
                        {suggestedGroups.map(cg => (
                          <button
                            key={cg}
                            onMouseDown={(e) => {
                              e.preventDefault(); 
                              setGroupName(cg);
                              setCommittedGroup(cg);
                            }}
                            className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors shrink-0"
                          >
                            {cg}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-zinc-800/50">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Measurement Type</label>
                    
                    {selectedCategory ? (
                      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800/50">
                            {categories.find(c => c.id === selectedCategory)?.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-zinc-100 text-sm">{categories.find(c => c.id === selectedCategory)?.name}</h3>
                            <p className="text-xs text-zinc-500 mt-0.5">Configured</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => { setSelectedCategory(null); }}
                          className="px-3 py-1.5 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {categories.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => { setSelectedCategory(cat.id); setStep('category-config'); }}
                            className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/30 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all flex flex-col items-center justify-center text-center gap-2 group"
                          >
                            <div className="p-2 bg-zinc-900 rounded-xl group-hover:bg-zinc-950 border border-zinc-800/50 transition-all duration-200 group-hover:scale-110 shadow-sm">
                              {cat.icon}
                            </div>
                            <div className="space-y-1">
                              <h3 className="font-bold text-zinc-100 text-[10px] sm:text-xs tracking-wide">{cat.name}</h3>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-4 border-t border-zinc-800/50">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Advanced Behavior</label>
                    
                    <div className="space-y-3">
                      <label className="flex items-start gap-4 p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 cursor-pointer group hover:border-zinc-700 transition-colors">
                        <div className="flex-1">
                          <h3 className="font-bold text-zinc-100 text-sm mb-1">Global Tracker</h3>
                          <p className="text-xs text-zinc-500 leading-relaxed">Automatically include this tracker in every new session you create. Great for game-wide collectibles.</p>
                        </div>
                        <div className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isGlobal ? 'bg-indigo-500' : 'bg-zinc-800'}`}>
                          <input type="checkbox" className="sr-only" checked={isGlobal} onChange={(e) => {
                            setIsGlobal(e.target.checked);
                            if (!e.target.checked) setIsPersistent(false);
                          }} />
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isGlobal ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </label>

                      <label className={`flex items-start gap-4 p-4 rounded-xl border border-zinc-800 cursor-pointer group transition-colors ${!isGlobal ? 'opacity-50 grayscale bg-zinc-950/20' : 'bg-zinc-950/50 hover:border-zinc-700'}`}>
                        <div className="flex-1">
                          <h3 className="font-bold text-zinc-100 text-sm mb-1">Persistent Value</h3>
                          <p className="text-xs text-zinc-500 leading-relaxed">Accumulate values across all sessions instead of resetting. This tracker must be Global to persist values.</p>
                        </div>
                        <div className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isPersistent ? 'bg-indigo-500' : 'bg-zinc-800'}`}>
                          <input type="checkbox" className="sr-only" checked={isPersistent} disabled={!isGlobal} onChange={(e) => setIsPersistent(e.target.checked)} />
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${isPersistent ? 'translate-x-4' : 'translate-x-0'}`} />
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}



              {step === 'category-config' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 flex gap-4 items-center">
                     <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800/50">
                       {categories.find(c => c.id === selectedCategory)?.icon}
                     </div>
                     <div>
                       <h3 className="font-bold text-zinc-100">{categories.find(c => c.id === selectedCategory)?.name}</h3>
                     </div>
                  </div>

                  {/* Mock configuration options based on selected category */}
                  {selectedCategory === 'objective' && (
                    <div className="space-y-4">
                       <div className="space-y-2">
                         <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Target Value</label>
                         <input type="number" placeholder="e.g., 100" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors" />
                       </div>
                    </div>
                  )}

                  {selectedCategory === 'collectibles' && (
                    <div className="space-y-4">
                       <div className="space-y-2">
                         <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Unit Name</label>
                         <input type="text" placeholder="e.g., Coins, Fragments" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors" />
                       </div>
                       <label className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors">
                          <input type="checkbox" className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900" />
                          <span className="text-sm font-medium text-zinc-300">Has maximum capacity</span>
                       </label>
                    </div>
                  )}

                  {selectedCategory === 'equipment' && (
                    <div className="space-y-4">
                       <label className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors">
                          <input type="radio" name="equip_type" className="w-4 h-4 border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900" defaultChecked />
                          <span className="text-sm font-medium text-zinc-300">Durability (Percentage)</span>
                       </label>
                       <label className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors">
                          <input type="radio" name="equip_type" className="w-4 h-4 border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900" />
                          <span className="text-sm font-medium text-zinc-300">Level/Rank (Numeric)</span>
                       </label>
                    </div>
                  )}

                  {selectedCategory === 'codes' && (
                    <div className="space-y-4">
                       <p className="text-sm text-zinc-400">Stores alphanumeric values with an option to hide/reveal.</p>
                       <label className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors">
                          <input type="checkbox" className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900" defaultChecked />
                          <span className="text-sm font-medium text-zinc-300">Hide value by default</span>
                       </label>
                    </div>
                  )}
                </div>
              )}

              {step === 'sync-explanation' && (
                <div className="space-y-6">
                  <div className="flex flex-col items-center text-center p-4 pt-6">
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mb-4 border border-indigo-500/30">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-100 mb-2">Sync as Global Tracker?</h3>
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      We noticed you track "<strong>{suggestedSync}</strong>" in a previous session.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/50">
                      <h4 className="font-bold text-sm text-zinc-100 mb-1">What happens when you sync?</h4>
                      <ul className="text-sm text-zinc-400 space-y-2 mt-3 list-disc list-inside">
                        <li>This tracker will become a <strong>Global Tracker</strong>.</li>
                        <li>It will automatically appear in all your future sessions for this game.</li>
                        <li>You can optionally choose to accumulate its value across all sessions.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-zinc-800/50 flex items-center justify-between bg-zinc-950/50">
              {step !== 'details' ? (
                 <button 
                   onClick={() => {
                     setStep('details');
                   }}
                   className="px-4 py-2 text-zinc-400 hover:text-zinc-100 font-medium text-sm transition-colors"
                 >
                   {step === 'sync-explanation' ? 'No Thanks' : 'Back'}
                 </button>
              ) : <div></div>}

              <button 
                onClick={() => {
                  if (step === 'details') setIsOpen(false);
                  if (step === 'category-config') setStep('details');
                  if (step === 'sync-explanation') {
                    setIsGlobal(true);
                    setTrackerName(suggestedSync || trackerName);
                    setStep('details');
                    setSuggestedSync(null);
                  }
                }}
                className="px-6 py-2 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg text-sm font-bold transition-colors ml-auto"
              >
                {step === 'details' ? 'Save Tracker' : step === 'sync-explanation' ? 'Sync & Make Global' : 'Confirm'}
              </button>
            </div>
            
          </div>
        </div>
      )}

      {isOpen && activeTab === 'v2' && <TrackerModalV2 onClose={() => setIsOpen(false)} />}
    </div>
  );
}

function TrackerModalV2({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<'details' | 'category-config'>('details');
  const [trackerName, setTrackerName] = useState('');
  const [groupName, setGroupName] = useState('');
  
  // V2 Specific State
  const [dataPoints, setDataPoints] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: 'objective', name: 'Objectives', icon: <Crosshair className="w-5 h-5 text-rose-400" />, desc: 'Track progress toward a specific number' },
    { id: 'collectibles', name: 'Collectibles', icon: <Package className="w-5 h-5 text-amber-400" />, desc: 'Track items with an optional maximum' },
    { id: 'equipment', name: 'Equipment', icon: <Shield className="w-5 h-5 text-blue-400" />, desc: 'Track durability or level' },
    { id: 'codes', name: 'Codes', icon: <Key className="w-5 h-5 text-emerald-400" />, desc: 'Store alphanumeric secrets' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-[24px] w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800/50">
          <h2 className="text-lg font-bold">
            {step === 'details' && 'Create Tracker'}
            {step === 'category-config' && 'Configure Data Point'}
          </h2>
          <button 
            onClick={onClose}
            className="p-1 text-zinc-500 hover:text-zinc-300 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
          {step === 'details' && (
            <div className="space-y-6">
              {/* Core Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Tracker Name</label>
                  <input 
                    type="text" 
                    value={trackerName}
                    onChange={(e) => setTrackerName(e.target.value)}
                    placeholder="e.g., Hidden Shrines" 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Group (Optional)</label>
                  <input 
                    type="text" 
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g., Exploration" 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>
              </div>

              {/* Data Points Section */}
              <div className="space-y-3 pt-4 border-t border-zinc-800/50">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Data Points</label>
                  <span className="text-[10px] text-zinc-500 font-medium bg-zinc-800/50 px-2 py-0.5 rounded-full">{dataPoints.length} / 1 (MVP)</span>
                </div>
                
                {dataPoints.length > 0 ? (
                  <div className="space-y-2">
                    {dataPoints.map((dp, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-zinc-700 bg-zinc-800/50 flex items-center justify-between group relative overflow-hidden">
                        {idx === 0 && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                        )}
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800/50">
                            {categories.find(c => c.id === dp.category)?.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-zinc-100 text-sm">{categories.find(c => c.id === dp.category)?.name}</h3>
                              {idx === 0 && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">Primary</span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 mt-0.5">Configured successfully</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            // MVP: just remove it so they can add another
                            setDataPoints([]);
                          }}
                          className="px-2 py-1 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => { setSelectedCategory(cat.id); setStep('category-config'); }}
                        className="p-3 rounded-xl border border-zinc-800 bg-zinc-950/30 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all flex items-start text-left gap-3 group"
                      >
                        <div className="p-2 bg-zinc-900 rounded-lg group-hover:bg-zinc-950 border border-zinc-800/50 transition-all duration-200 shadow-sm shrink-0">
                          {cat.icon}
                        </div>
                        <div className="space-y-0.5 mt-0.5">
                          <h3 className="font-bold text-zinc-100 text-xs">{cat.name}</h3>
                          <p className="text-[10px] text-zinc-500 leading-tight">{cat.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'category-config' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/50 flex gap-4 items-center">
                 <div className="p-2 bg-zinc-900 rounded-lg border border-zinc-800/50">
                   {categories.find(c => c.id === selectedCategory)?.icon}
                 </div>
                 <div>
                   <h3 className="font-bold text-zinc-100">{categories.find(c => c.id === selectedCategory)?.name}</h3>
                 </div>
              </div>

              {selectedCategory === 'objective' && (
                <div className="space-y-4">
                   <div className="space-y-2">
                     <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Target Value</label>
                     <input type="number" placeholder="e.g., 100" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors" />
                   </div>
                </div>
              )}

              {selectedCategory === 'collectibles' && (
                <div className="space-y-4">
                   <div className="space-y-2">
                     <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Unit Name</label>
                     <input type="text" placeholder="e.g., Coins, Fragments" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors" />
                   </div>
                   <label className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors">
                      <input type="checkbox" className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900" />
                      <span className="text-sm font-medium text-zinc-300">Has maximum capacity</span>
                   </label>
                </div>
              )}

              {selectedCategory === 'equipment' && (
                <div className="space-y-4">
                   <label className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors">
                      <input type="radio" name="equip_type" className="w-4 h-4 border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900" defaultChecked />
                      <span className="text-sm font-medium text-zinc-300">Durability (Percentage)</span>
                   </label>
                   <label className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors">
                      <input type="radio" name="equip_type" className="w-4 h-4 border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900" />
                      <span className="text-sm font-medium text-zinc-300">Level/Rank (Numeric)</span>
                   </label>
                </div>
              )}

              {selectedCategory === 'codes' && (
                <div className="space-y-4">
                   <p className="text-sm text-zinc-400">Stores alphanumeric values with an option to hide/reveal.</p>
                   <label className="flex items-center gap-3 p-3 rounded-xl border border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors">
                      <input type="checkbox" className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-zinc-900" defaultChecked />
                      <span className="text-sm font-medium text-zinc-300">Hide value by default</span>
                   </label>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800/50 flex items-center justify-between bg-zinc-950/50">
          {step !== 'details' ? (
             <button 
               onClick={() => setStep('details')}
               className="px-4 py-2 text-zinc-400 hover:text-zinc-100 font-medium text-sm transition-colors"
             >
               Back
             </button>
          ) : <div></div>}

          <button 
            onClick={() => {
              if (step === 'details') {
                onClose();
              } else if (step === 'category-config') {
                setDataPoints([...dataPoints, { category: selectedCategory }]);
                setStep('details');
              }
            }}
            className="px-6 py-2 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg text-sm font-bold transition-colors ml-auto"
          >
            {step === 'details' ? 'Save Tracker' : 'Confirm & Add'}
          </button>
        </div>
        
      </div>
    </div>
  );
}
