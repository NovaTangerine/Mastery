import React, { useState } from 'react';
import { mockUser, mockLogs } from '../lib/mockData';
import { Settings, Calendar, Shield, BookOpen, Gamepad2, ChevronRight } from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileView() {
  const [activeTab, setActiveTab] = useState<'logs' | 'reviews' | 'cards'>('logs');
  const { navigateTo } = useUI();
  const { user } = useAuth();

  // Use the real user's display name and photo if available, fallback to mock
  const displayName = user?.displayName || mockUser.displayName;
  const avatarUrl = user?.photoURL || mockUser.avatarUrl;
  const email = user?.email || `@${mockUser.username}`;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Profile Header */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:p-8 relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-emerald-900/40 to-transparent" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-zinc-950 overflow-hidden shadow-xl shrink-0 bg-zinc-800">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={displayName} 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-500">
                <Shield className="w-12 h-12" />
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-50">{displayName}</h1>
              <p className="text-zinc-400 font-medium mt-1">{email}</p>
            </div>
            
            <p className="text-zinc-300 max-w-lg mx-auto md:mx-0 leading-relaxed">
              {mockUser.bio}
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-medium text-zinc-500">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                Joined {new Date(mockUser.joinDate).getFullYear()}
              </span>
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                Level 42
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button className="flex-1 md:flex-none bg-zinc-100 hover:bg-white text-zinc-900 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-sm">
              Edit Profile
            </button>
            <button className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <nav className="flex items-center gap-6 border-b border-zinc-800">
        <button 
          onClick={() => setActiveTab('logs')}
          className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'logs' ? 'text-zinc-50' : 'text-zinc-400 hover:text-zinc-300'}`}
        >
          Logs
          {activeTab === 'logs' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('reviews')}
          className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'reviews' ? 'text-zinc-50' : 'text-zinc-400 hover:text-zinc-300'}`}
        >
          Reviews
          {activeTab === 'reviews' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full" />
          )}
        </button>
        <button 
          onClick={() => setActiveTab('cards')}
          className={`pb-4 text-sm font-medium transition-colors relative ${activeTab === 'cards' ? 'text-zinc-50' : 'text-zinc-400 hover:text-zinc-300'}`}
        >
          Cards
          {activeTab === 'cards' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full" />
          )}
        </button>
      </nav>

      {/* Tab Content */}
      <div className="py-4">
        {activeTab === 'logs' && (
          <div className="space-y-6">
            {/* Header for logs section */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-100">Recent Logs</h2>
              <button 
                onClick={() => navigateTo('dashboard')}
                className="text-sm text-emerald-500 hover:text-emerald-400 font-medium flex items-center gap-1"
              >
                Go to Capsule <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockLogs.map((log) => (
                <article key={log.log_id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-5 hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <img 
                      src={log.game_cover_url} 
                      alt={log.game_title} 
                      className="w-16 h-24 object-cover rounded-lg shadow-md group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-zinc-100 truncate">{log.game_title}</h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        {new Date(log.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </p>
                      
                      <div className="mt-3 text-sm text-zinc-300 line-clamp-2 leading-relaxed">
                        {log.content.blocks[0]?.text}
                      </div>

                      {log.ai_analysis && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {log.ai_analysis.topics_detected.slice(0, 2).map(topic => (
                            <span key={topic} className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-400 text-[10px] uppercase tracking-wider font-medium">
                              {topic.replace('_', ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-zinc-300">No reviews yet</h3>
            <p className="text-sm text-zinc-500 mt-2 max-w-sm mx-auto">
              When you finish a game, your AI assistant will help you draft a review based on your logs.
            </p>
          </div>
        )}

        {activeTab === 'cards' && (
          <div className="py-12 text-center">
            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gamepad2 className="w-8 h-8 text-zinc-600" />
            </div>
            <h3 className="text-lg font-medium text-zinc-300">No collectible cards</h3>
            <p className="text-sm text-zinc-500 mt-2 max-w-sm mx-auto">
              Complete a playthrough to generate a beautiful commemorative card of your journey.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
