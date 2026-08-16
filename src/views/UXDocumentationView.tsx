import React from 'react';
import { ArrowLeft, BookOpen, Database, Layout, Users } from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { useUserJourney } from '../contexts/UserJourneyContext';

export default function UXDocumentationView() {
  const { goBack } = useUI();
  const { totalGames, totalSessions, totalNotes, totalTrackers, hasLoggedAnySession, hasCreatedAnyNote, isPowerUser, isEligibleForGameOnboarding, isEligibleForTrackerOnboarding } = useUserJourney();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      <div className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button 
            onClick={goBack}
            className="w-10 h-10 -ml-2 bg-transparent hover:bg-zinc-900 rounded-full flex items-center justify-center transition-colors text-zinc-400 hover:text-zinc-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 flex justify-between items-center min-w-0">
            <h1 className="text-lg font-bold truncate">UX & Architecture Documentation</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <h2 className="text-2xl font-bold">User Journey Architecture</h2>
            </div>
            
            <div className="prose prose-invert max-w-none text-zinc-300">
              <p className="text-lg leading-relaxed text-zinc-400">
                This document outlines the progressive disclosure UX framework implemented in the application. 
                Our goal is to treat seasoned users differently from brand-new users, making the application feel smarter and more respectful of their time.
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <Database className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-bold">Data Strategy: Firestore COUNT()</h2>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <p className="text-zinc-300 leading-relaxed mb-4">
                To know if a user is "new" or "experienced", we track their global usage using Firestore's <code>getCountFromServer()</code>.
              </p>
              
              <h3 className="font-bold text-zinc-200 mb-2 mt-6">Why COUNT() over a Stats Document?</h3>
              <ul className="list-disc pl-5 space-y-2 text-zinc-400">
                <li><strong className="text-zinc-300">Zero Maintenance:</strong> The database calculates the count on the fly. We never have to worry about a counter getting out of sync if a network request fails mid-write.</li>
                <li><strong className="text-zinc-300">Simpler Code:</strong> We avoid wrapping every write in complex batch or transaction blocks just to keep a secondary counter updated.</li>
                <li><strong className="text-zinc-300">Cost-Effective:</strong> Firestore charges 1 document read for every 1,000 index entries counted. At a personal scale, getting all stats costs almost nothing.</li>
              </ul>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <Users className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-bold">Current User Thresholds</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Games</h3>
                <p className="text-3xl font-bold text-zinc-100">{totalGames}</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Sessions</h3>
                <p className="text-3xl font-bold text-zinc-100">{totalSessions}</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Notes</h3>
                <p className="text-3xl font-bold text-zinc-100">{totalNotes}</p>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-1">Total Trackers</h3>
                <p className="text-3xl font-bold text-zinc-100">{totalTrackers}</p>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden mt-6">
              <table className="w-full text-left text-sm">
                <thead className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                  <tr>
                    <th className="px-6 py-3 font-medium">Flag</th>
                    <th className="px-6 py-3 font-medium">Condition</th>
                    <th className="px-6 py-3 font-medium text-right">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  <tr className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-indigo-400">hasLoggedAnySession</td>
                    <td className="px-6 py-4 text-zinc-400">Total sessions &gt; 0</td>
                    <td className="px-6 py-4 text-right">
                      {hasLoggedAnySession ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider">True</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-wider">False</span>
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-indigo-400">hasCreatedAnyNote</td>
                    <td className="px-6 py-4 text-zinc-400">Total notes &gt; 0</td>
                    <td className="px-6 py-4 text-right">
                      {hasCreatedAnyNote ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider">True</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-wider">False</span>
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-indigo-400">isPowerUser</td>
                    <td className="px-6 py-4 text-zinc-400">Total games &gt;= 5 AND sessions &gt;= 10</td>
                    <td className="px-6 py-4 text-right">
                      {isPowerUser ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider">True</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-wider">False</span>
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-indigo-400">isEligibleForGameOnboarding</td>
                    <td className="px-6 py-4 text-zinc-400">Total games &lt;= 3</td>
                    <td className="px-6 py-4 text-right">
                      {isEligibleForGameOnboarding ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider">True</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-wider">False</span>
                      )}
                    </td>
                  </tr>
                  <tr className="hover:bg-zinc-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-indigo-400">isEligibleForTrackerOnboarding</td>
                    <td className="px-6 py-4 text-zinc-400">Total trackers &lt; 10 AND NOT power user</td>
                    <td className="px-6 py-4 text-right">
                      {isEligibleForTrackerOnboarding ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider">True</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-zinc-800 text-zinc-500 text-xs font-bold uppercase tracking-wider">False</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
              <Layout className="w-6 h-6 text-rose-400" />
              <h2 className="text-2xl font-bold">Progressive Disclosure Implementation</h2>
            </div>
            
            <div className="space-y-4">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <h3 className="font-bold text-zinc-200 mb-2">Sessions Tab</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  <strong className="text-zinc-300">New User:</strong> Sees a "Getting Started" banner that explains what sessions are and how to use them. This is restricted to the first 3 games added to the library (<code>isEligibleForGameOnboarding</code>). Because we use <code>COUNT()</code> for games, if a user adds a game and deletes it without logging data, they naturally regain that onboarding quota.
                  <br /><br /><strong className="text-zinc-300">Experienced User:</strong> The banner is completely hidden once <code>totalGames &gt; 3</code>, reducing visual noise. Additionally, users can dismiss this banner per-game via the X button, which persists their choice to a <code>dismissedSessionBanner</code> field on the specific Game document.
                </p>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <h3 className="font-bold text-zinc-200 mb-2">Notes Tab</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  <strong className="text-zinc-300">New User:</strong> Sees a large, highly visual "Your Journey Begins" placeholder module with an icon and explanatory text.
                  <br /><strong className="text-zinc-300">Experienced User (hasCreatedAnyNote):</strong> Sees a minimalist, space-saving "No notes yet. Start typing below." text prompt.
                </p>
              </div>
              
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                <h3 className="font-bold text-zinc-200 mb-2">Trackers Tab</h3>
                <p className="text-zinc-400 leading-relaxed text-sm">
                  <strong className="text-zinc-300">New User:</strong> Sees a verbose "Stay Quantified" call-to-action module outlining what trackers can do. This module is shown as long as the user is eligible for tracker onboarding (<code>isEligibleForTrackerOnboarding</code>), meaning they have created fewer than 10 trackers across all sessions and are not yet considered a power user.
                  <br /><strong className="text-zinc-300">Experienced User (!isEligibleForTrackerOnboarding):</strong> Sees a subtle ghost state indicating "No trackers added to this session".
                </p>
              </div>
            </div>
          </section>
          
        </div>
      </div>
    </div>
  );
}
