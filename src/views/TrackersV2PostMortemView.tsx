import React from 'react';
import { ChevronRight, Archive, CheckCircle2, AlertTriangle, ListTodo, Database, Paintbrush } from 'lucide-react';
import { useUI } from '../contexts/UIContext';

export default function TrackersV2PostMortemView() {
  const { navigateTo } = useUI();

  return (
    <div className="space-y-12 pb-24">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-zinc-500 font-bold uppercase tracking-widest text-xs">
          <button 
            onClick={() => navigateTo('home')}
            className="hover:text-zinc-300 transition-colors"
          >
            Dev Tools
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-zinc-300">Trackers V2 Post-Mortem</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white mb-4">
            Trackers V2 Post-Mortem & Implementation Guide
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl leading-relaxed">
            The initial attempt to integrate Trackers V2 directly into the legacy UI structure was unsuccessful due to significant structural and conceptual misalignments. 
            This document outlines the comprehensive requirements for a successful, manual migration of the UI and backend logic moving forward.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Core Concepts */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Archive className="w-24 h-24" />
            </div>
            
            <h2 className="text-xl font-bold text-white mb-4 relative z-10">Why the integration failed</h2>
            <ul className="space-y-4 text-zinc-400 relative z-10">
              <li className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span><strong className="text-zinc-200">State Conflict:</strong> Legacy <code>trackers</code> array vs. V2 flattened <code>metrics</code> collection. The UI components were expecting nested Tracker data, but we fed them flattened SessionMetrics.</span>
              </li>
              <li className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span><strong className="text-zinc-200">Component Props mismatch:</strong> <code>TrackerCard</code> relies on <code>TrackerItem</code> and an entire <code>SessionTracker</code> object, while V2 creates individual <code>SessionMetric</code> objects that only group by a string <code>group</code> property.</span>
              </li>
              <li className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span><strong className="text-zinc-200">Design Drift:</strong> The V2 mockups introduced an entirely different UX paradigm (Pill Nav, Grid Layout) that clashed with the legacy vertical accordion flow.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Requirements Grid */}
        <div className="lg:col-span-2 space-y-8">
          
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Backend & Data Model Requirements</h2>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="font-bold text-zinc-100 mb-2 text-lg">Flattened Architecture</div>
                <p className="text-sm text-zinc-400">
                  Trackers must transition from nested arrays (<code>SessionTracker</code> {'->'} <code>TrackerItem</code>) to a flat array of <code>SessionMetric</code> documents.
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="font-bold text-zinc-100 mb-2 text-lg">Measurement Types</div>
                <p className="text-sm text-zinc-400">
                  Standardize quantifiers into: <code>checkbox</code>, <code>visual_counter</code>, <code>numeric_counter</code>, <code>progress</code>, and <code>none</code>.
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="font-bold text-zinc-100 mb-2 text-lg">Implicit Grouping</div>
                <p className="text-sm text-zinc-400">
                  Groups are no longer explicit entities. They are implicitly created when one or more metrics share the same <code>group</code> string.
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
                <div className="font-bold text-zinc-100 mb-2 text-lg">Global & Session Scope</div>
                <p className="text-sm text-zinc-400">
                  Metrics must be defined globally at the <code>Game</code> level, and instances are instantiated and tracked within individual <code>Session</code> documents.
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                <Paintbrush className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Interface & UX Requirements</h2>
            </div>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="divide-y divide-zinc-800/50">
                <div className="p-5 flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  <div>
                    <h3 className="font-bold text-zinc-100 mb-1">Pill Navigation Integration</h3>
                    <p className="text-sm text-zinc-400">The "Trackers" tab in the session view must be separated out into its own dedicated view state or modal, utilizing the pill-shaped segmented control developed in the mockups.</p>
                  </div>
                </div>
                <div className="p-5 flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  <div>
                    <h3 className="font-bold text-zinc-100 mb-1">MetricCard Components</h3>
                    <p className="text-sm text-zinc-400">Replace the legacy <code>TrackerCard</code> with individual <code>MetricCard</code> instances. These cards should be capable of rendering inside a CSS Grid rather than a strict vertical stack.</p>
                  </div>
                </div>
                <div className="p-5 flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  <div>
                    <h3 className="font-bold text-zinc-100 mb-1">Modal-based Editing</h3>
                    <p className="text-sm text-zinc-400">Instead of inline editing, clicking a metric should open the <code>EditMetricModal</code> to allow changing targets, types, and groupings.</p>
                  </div>
                </div>
                <div className="p-5 flex gap-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0" />
                  <div>
                    <h3 className="font-bold text-zinc-100 mb-1">Streamlined Creation Flow</h3>
                    <p className="text-sm text-zinc-400">Use the <code>AddMetricForm</code> inline. When creating a metric, users can assign it to an existing group or type a new group name directly into the form.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
                <ListTodo className="w-5 h-5" />
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Migration Plan Outline</h2>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
              <ol className="list-decimal list-inside space-y-3 text-zinc-300">
                <li className="pl-2"><strong className="text-white">Step 1:</strong> Completely rewrite <code>TrackerCard.tsx</code> to support both Legacy and V2 objects, OR maintain a strict visual split until migration is complete.</li>
                <li className="pl-2"><strong className="text-white">Step 2:</strong> Implement a one-way database migration script that takes all `trackers` arrays in active sessions and converts them into the `metrics` array structure on the Game and Session documents.</li>
                <li className="pl-2"><strong className="text-white">Step 3:</strong> Replace the <code>AddTrackerMenu</code> in the Session View with the new <code>AddMetricForm</code> component.</li>
                <li className="pl-2"><strong className="text-white">Step 4:</strong> Implement the <code>EditMetricModal</code> globally or within the Session context.</li>
                <li className="pl-2"><strong className="text-white">Step 5:</strong> Transition the Session View layout from an accordion stack to a grid-based visualization utilizing <code>MetricCard</code>s grouped by their `group` string.</li>
              </ol>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
