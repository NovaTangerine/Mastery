import React, { useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { 
  ArrowLeft, Plus, ChevronDown, ChevronRight, Target, Component, LayoutTemplate,
  TagIcon, Activity, Key, Flame
} from 'lucide-react';

export default function TrackersSidebarMockupView() {
  const { navigateTo } = useUI();
  const [activeTab, setActiveTab] = useState<'component' | 'full-page'>('component');

  // Some mock metrics data
  const groupedMetrics = {
    'Combat': [
      { id: '1', name: 'Bosses Defeated', type: 'counter', value: 3, icon: <Flame className="w-4 h-4 text-orange-400" /> },
      { id: '2', name: 'Deaths', type: 'counter', value: 24, icon: <Activity className="w-4 h-4 text-rose-400" /> }
    ],
    'Exploration': [
      { id: '3', name: 'Shrines Found', type: 'counter', value: 12, icon: <Target className="w-4 h-4 text-emerald-400" /> },
      { id: '4', name: 'Keys Collected', type: 'counter', value: 2, icon: <Key className="w-4 h-4 text-amber-400" /> }
    ]
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans p-4 sm:p-8 pt-6 flex flex-col relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[800px] pointer-events-none bg-[radial-gradient(ellipse_150%_100%_at_50%_0%,rgba(39,39,42,0.5)_0%,rgba(9,9,11,0)_100%)] z-0" />
      
      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between mb-8 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigateTo('dashboard')}
              className="p-2 -ml-2 rounded-xl text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight">Trackers & Tags UI Prototype</h1>
          </div>
          <p className="text-sm text-zinc-400 font-medium ml-11">Experimenting with the right-side panel</p>
        </div>
        
        {/* Toggle Controls */}
        <div className="flex items-center gap-2 p-1 bg-zinc-900/80 rounded-full border border-zinc-800">
          <button
             onClick={() => setActiveTab('component')}
             className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'component' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Component className="w-4 h-4" />
            Component
          </button>
          <button
             onClick={() => setActiveTab('full-page')}
             className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'full-page' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <LayoutTemplate className="w-4 h-4" />
            Full Page View
          </button>
        </div>
      </div>
      
      {activeTab === 'component' && (
        <div className="flex-1 w-full max-w-[1600px] mx-auto flex items-center justify-center relative z-10 min-h-0">
          <div className="w-[320px] h-[75vh] flex-col flex relative">
            
            {/* Decorative container */}
            <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md rounded-[32px] border border-zinc-800/60 pointer-events-none [-webkit-mask-image:linear-gradient(to_bottom,black_20%,transparent_95%)] [mask-image:linear-gradient(to_bottom,black_20%,transparent_95%)] -z-10" />
            
            <SidebarContent groupedMetrics={groupedMetrics} />

          </div>
        </div>
      )}

      {activeTab === 'full-page' && (
        <div className="flex flex-1 gap-6 max-w-[1600px] mx-auto w-full relative z-10 font-sans h-[calc(100vh-140px)] min-h-0">
          {/* Main Feed area */}
          <div className="flex-1 overflow-y-auto bg-zinc-900/20 border border-zinc-800/40 rounded-[32px] hidden lg:flex flex-col relative p-8">
            <div className="max-w-2xl mx-auto w-full">
               <h2 className="text-2xl font-bold tracking-tight mb-8 text-zinc-100">Main Play Session Content</h2>
               
               <div className="space-y-6">
                 {[1,2,3].map(i => (
                    <div key={i} className="p-6 bg-zinc-900/60 border border-zinc-800/80 rounded-2xl">
                      <div className="h-4 bg-zinc-800/50 rounded w-1/3 mb-4"></div>
                      <div className="h-3 bg-zinc-800/30 rounded w-full mb-2"></div>
                      <div className="h-3 bg-zinc-800/30 rounded w-5/6"></div>
                    </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Trackers Sidebar */}
          <div className="w-[320px] shrink-0 flex-col flex relative">
            
            {/* Decorative container */}
            <div className="absolute inset-0 bg-zinc-900/40 backdrop-blur-md rounded-[32px] border border-zinc-800/60 pointer-events-none [-webkit-mask-image:linear-gradient(to_bottom,black_20%,transparent_95%)] [mask-image:linear-gradient(to_bottom,black_20%,transparent_95%)] -z-10" />

            <SidebarContent groupedMetrics={groupedMetrics} />

          </div>
        </div>
      )}
    </div>
  );
}

function SidebarContent({ groupedMetrics }: { groupedMetrics: any }) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-5 z-10">
         <div className="flex items-center gap-3 text-zinc-100">
          <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20">
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">Trackers</h2>
        </div>
        <button className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all focus:scale-95 border border-zinc-800/50">
           <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 custom-scrollbar">
        <div className="space-y-6 pb-20">
          
          {/* Grouped Metrics */}
          {Object.entries(groupedMetrics).map(([group, metrics]: [string, any]) => (
            <div key={group} className="bg-zinc-950/30 border border-zinc-800/50 rounded-2xl p-2 space-y-1">
              <div className="flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-zinc-900/30 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">{group}</h4>
                </div>
              </div>
              
              <div className="space-y-1">
                {metrics.map((m: any) => (
                  <div key={m.id} className="group relative bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/30 hover:border-zinc-700/50 rounded-xl p-3 transition-colors flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      {user_icon(m)}
                      <span className="text-sm text-zinc-300 font-medium">{m.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-sm font-bold bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 shadow-inner min-w-[2.5rem] text-center">{m.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

           {/* Tags section */}
           <div className="px-2 mt-8">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TagIcon className="w-4 h-4 text-zinc-500" />
                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400">Session Tags</h4>
                </div>
               <button className="w-6 h-6 rounded-md flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors">
                 <Plus className="w-3.5 h-3.5" />
               </button>
             </div>
             <div className="flex flex-wrap gap-2">
               <div className="group cursor-pointer">
                 <span className="px-3 py-1.5 rounded-full bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-colors text-xs font-bold inline-flex items-center gap-1.5">
                   <span>Story Progress</span>
                 </span>
               </div>
               <div className="group cursor-pointer">
                 <span className="px-3 py-1.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 transition-colors text-xs font-bold inline-flex items-center gap-1.5">
                   <span>Exploration</span>
                 </span>
               </div>
               <div className="group cursor-pointer">
                 <span className="px-3 py-1.5 rounded-full bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-400 border border-zinc-700/50 transition-colors text-xs font-bold inline-flex items-center gap-1.5">
                   <span>Co-op</span>
                 </span>
               </div>
             </div>
           </div>
        </div>
      </div>
    </>
  );
}

function user_icon(m: any) {
  return m.icon;
}
