/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Gamepad2, 
  LogOut, 
  ChevronRight,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  WifiOff,
  Home,
  Archive,
  BookOpen,
  Package
} from 'lucide-react';

import { Toaster } from 'sonner';

import { signInWithGoogle, signOut } from './firebase';

import { ErrorBoundary } from './components/ErrorBoundary';

import { GameProvider, useGameContext } from './contexts/GameContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UIProvider, useUI } from './contexts/UIContext';
import { UserJourneyProvider } from './contexts/UserJourneyContext';
import { useNetworkStatus } from './hooks/useNetworkStatus';

import HomeView from './views/HomeView';
import DashboardView from './views/DashboardView';
import SessionView from './views/SessionView';
import { NoteEditorView } from './views/NoteEditorView';
import AllInsightsView from './views/AllInsightsView';
import AllNotesView from './views/AllNotesView';
import ProfileView from './views/ProfileView';
import IGDBGameView from './views/IGDBGameView';

import PrototypeLandingView from './views/PrototypeLandingView';
import TransitionMockupView from './views/TransitionMockupView';
import ImageLoadingMockupView from './views/ImageLoadingMockupView';
import HoverEffectMockupView from './views/HoverEffectMockupView';
import BackgroundTextureMockupView from './views/BackgroundTextureMockupView';
import PillNavMockupView from './views/PillNavMockupView';
import ImageRevealLogicMockupView from './views/ImageRevealLogicMockupView';
import LightModeLibraryMockupView from './views/LightModeLibraryMockupView';
import SessionListMockupView from './views/SessionListMockupView';
import TrackersSidebarMockupView from './views/TrackersSidebarMockupView';
import TrackerModalMockupView from './views/TrackerModalMockupView';
import TrackerSyncMockupView from './views/TrackerSyncMockupView';
import NoteVisualsMockupView from './views/NoteVisualsMockupView';

import TrackersV2PostMortemView from './views/TrackersV2PostMortemView';
import UXDocumentationView from './views/UXDocumentationView';
import ProfileMockupView from './views/ProfileMockupView';

import ProfileDropdown from './components/ProfileDropdown';
import ProfileDrawer from './components/ProfileDrawer';
import ProfileModal from './components/ProfileModal';
import ProfileHoverCard from './components/ProfileHoverCard';

// --- Components ---

function MainApp() {
  const [isBackBarVisible, setIsBackBarVisible] = useState(true);
  const [secretNavClickCount, setSecretNavClickCount] = useState(0);
  const [secretNavUnlocked, setSecretNavUnlocked] = useState(false);
  const [headerBlur, setHeaderBlur] = useState('24px');

  // Profile UX States (5 Options)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isProfileHoverCardOpen, setIsProfileHoverCardOpen] = useState(false);

  const mainRef = useRef<HTMLElement>(null);
  const isOnline = useNetworkStatus();
  const { user, isAuthReady } = useAuth();

  const isAdmin = useMemo(() => {
    if (!user?.email) return false;
    const allowedEmails = [
      'kyledk05@gmail.com',
      'kyle@shadowpuppet.io',
      'kyl3dk05@gmail.com'
    ];
    return allowedEmails.includes(user.email.toLowerCase());
  }, [user?.email]);

  // Reset unlocked state if user changes to a non-admin
  useEffect(() => {
    if (!isAdmin) {
      setSecretNavUnlocked(false);
      setSecretNavClickCount(0);
    }
  }, [isAdmin]);

  const {
    view,
    navigateTo,
    goBack,
    clearHistory
  } = useUI();
  const { selectedGame, activeSession } = useGameContext();

  useEffect(() => {
    let t: NodeJS.Timeout;
    const handleScroll = () => {
      // Reduce blur while scrolling for better performance
      setHeaderBlur('8px');
      clearTimeout(t);
      t = setTimeout(() => {
        // Restore higher blur when scrolling stops
        setHeaderBlur('24px');
      }, 120);
    };

    const mainElement = mainRef.current;
    if (mainElement) {
      mainElement.addEventListener('scroll', handleScroll, { passive: true });
    }

    return () => {
      if (mainElement) {
        mainElement.removeEventListener('scroll', handleScroll);
      }
      clearTimeout(t);
    };
  }, []);

  // --- Render Helpers ---

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-zinc-100 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <PrototypeLandingView onCompleteSignUp={() => {}} />;
  }

  return (
    <ErrorBoundary>
      <div className="h-[100dvh] overflow-hidden flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-100 selection:text-zinc-950 relative">
        {(view === 'dashboard' || view === 'session-view') && (
          <div className="absolute inset-x-0 top-0 h-[800px] pointer-events-none bg-[radial-gradient(ellipse_150%_100%_at_50%_0%,rgba(39,39,42,0.5)_0%,rgba(9,9,11,0)_100%)] z-0" />
        )}
        <Toaster position="top-center" theme="dark" />
        
        {/* Offline Banner */}
        {!isOnline && (
          <div className="shrink-0 z-40 bg-amber-900/20 border-b border-amber-900/30 px-6 py-2 flex items-center justify-center text-amber-500 text-xs font-medium text-center relative">
            ⚠️ Offline Mode: Changes are saved locally. Reconnect to sync and prevent data loss.
          </div>
        )}

        {/* Navigation Rail / Header & Back Bar */}
        {view !== 'note-editor' && (
          <div className="shrink-0 z-50 flex flex-col relative">
            <header 
              className={`border-b ${view === 'dashboard' ? 'border-transparent' : 'border-zinc-900'} px-4 sm:px-6 py-4 relative flex items-center min-h-[73px] transition-all duration-300 ease-out`}
            >
              
              {/* Standard Navbar (Hidden on mobile/tablet in session-view) */}
              <div className={`flex items-center justify-between w-full ${view === 'session-view' ? 'hidden lg:flex' : 'flex'}`}>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => { clearHistory(); navigateTo('dashboard', null, null); }}
                    className="flex items-center gap-2 group"
                  >
                    <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center group-hover:rotate-6 transition-transform">
                      <Package className="w-5 h-5 text-zinc-950" />
                    </div>
                    <span className="font-bold text-xl tracking-tight hidden sm:block">Capsule</span>
                  </button>

                  <div className="h-6 w-px bg-zinc-800 mx-1 hidden sm:block"></div>

                  <button 
                    onClick={() => { clearHistory(); navigateTo('dashboard', null, null); }}
                    className={`flex items-center gap-2 transition-colors ${view === 'dashboard' ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
                    title="Home"
                  >
                    <Home className="w-5 h-5" />
                    <span className="hidden sm:block font-medium text-sm">Home</span>
                  </button>

                  {isAdmin && secretNavUnlocked && (
                    <div className="relative group">
                      <button 
                        className="flex items-center gap-2 text-amber-500 hover:text-amber-400 transition-colors"
                        title="Dev Tools"
                      >
                        <Archive className="w-5 h-5" />
                        <span className="hidden sm:block font-medium text-sm">Dev Tools</span>
                        <ChevronDown className="w-4 h-4 opacity-70" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      <div className="absolute top-full left-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden z-50">
                        <button 
                          onClick={() => { clearHistory(); navigateTo('home', null, null); }}
                          className={`px-4 py-2 text-left text-sm transition-colors ${view === 'home' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50'}`}
                        >
                          Cartridge Home
                        </button>
                        <button 
                          onClick={() => { clearHistory(); navigateTo('transition-mockups', null, null); }}
                          className={`px-4 py-2 text-left text-sm transition-colors ${view === 'transition-mockups' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50'}`}
                        >
                          Transition Mockups
                        </button>
                        <button 
                          onClick={() => { clearHistory(); navigateTo('image-loading-mockups', null, null); }}
                          className={`px-4 py-2 text-left text-sm transition-colors border-t border-zinc-800/50 ${view === 'image-loading-mockups' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50'}`}
                        >
                          Box Art Mockups
                        </button>
                        <button 
                          onClick={() => { clearHistory(); navigateTo('hover-effect-mockups', null, null); }}
                          className={`px-4 py-2 text-left text-sm transition-colors border-t border-zinc-800/50 ${view === 'hover-effect-mockups' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50'}`}
                        >
                          Hover Effect Mockups
                        </button>
                        <button 
                          onClick={() => { clearHistory(); navigateTo('texture-mockups', null, null); }}
                          className={`px-4 py-2 text-left text-sm transition-colors border-t border-zinc-800/50 ${view === 'texture-mockups' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50'}`}
                        >
                          Background Textures
                        </button>
                        <button 
                          onClick={() => { clearHistory(); navigateTo('pill-nav-mockups', null, null); }}
                          className={`px-4 py-2 text-left text-sm transition-colors border-t border-zinc-800/50 ${view === 'pill-nav-mockups' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50'}`}
                        >
                          Pill Nav Bar
                        </button>
                        <button 
                          onClick={() => { clearHistory(); navigateTo('image-reveal-logic', null, null); }}
                          className={`px-4 py-2 text-left text-sm transition-colors border-t border-zinc-800/50 ${view === 'image-reveal-logic' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50'}`}
                        >
                          Image Reveal Logic
                        </button>
                        <button 
                          onClick={() => { clearHistory(); navigateTo('light-mode-library-mockup', null, null); }}
                          className={`px-4 py-2 text-left text-sm transition-colors border-t border-zinc-800/50 ${view === 'light-mode-library-mockup' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50'}`}
                        >
                          Light Theme Library
                        </button>
                        <button 
                          onClick={() => { clearHistory(); navigateTo('session-list-mockup', null, null); }}
                          className={`px-4 py-2 text-left text-sm transition-colors border-t border-zinc-800/50 ${view === 'session-list-mockup' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50'}`}
                        >
                          Session List UI
                        </button>
                        <button 
                          onClick={() => { clearHistory(); navigateTo('trackers-sidebar-mockup', null, null); }}
                          className={`px-4 py-2 text-left text-sm transition-colors border-t border-zinc-800/50 ${view === 'trackers-sidebar-mockup' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50'}`}
                        >
                          Trackers UI
                        </button>
                        <button 
                          onClick={() => { clearHistory(); navigateTo('tracker-modal-mockup', null, null); }}
                          className={`px-4 py-2 text-left text-sm transition-colors border-t border-zinc-800/50 ${view === 'tracker-modal-mockup' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50'}`}
                        >
                          Tracker Modal UI
                        </button>
                        <button 
                          onClick={() => { clearHistory(); navigateTo('tracker-sync-mockup', null, null); }}
                          className={`px-4 py-2 text-left text-sm transition-colors border-t border-zinc-800/50 ${view === 'tracker-sync-mockup' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50'}`}
                        >
                          Tracker Sync UI
                        </button>
                        <button 
                          onClick={() => { clearHistory(); navigateTo('note-visuals-mockup', null, null); }}
                          className={`px-4 py-2 text-left text-sm transition-colors border-t border-zinc-800/50 ${view === 'note-visuals-mockup' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50'}`}
                        >
                          Note Visuals UI
                        </button>
                        <button 
                          onClick={() => { clearHistory(); navigateTo('profile-mockups', null, null); }}
                          className={`px-4 py-2 text-left text-sm transition-colors border-t border-zinc-800/50 text-amber-400/90 font-medium ${view === 'profile-mockups' ? 'bg-zinc-800 text-amber-300' : 'hover:text-amber-300 hover:bg-amber-400/10'}`}
                        >
                          Profile Mockups (5 UX)
                        </button>
                        <button 
                          onClick={() => { clearHistory(); navigateTo('trackers-v2-post-mortem', null, null); }}
                          className={`px-4 py-2 text-left text-sm transition-colors border-t border-zinc-800/50 rounded-b-xl ${view === 'trackers-v2-post-mortem' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50'}`}
                        >
                          Trackers V2 Post-Mortem
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {isAdmin && secretNavUnlocked && (
                    <div className="relative group">
                      <button 
                        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
                        title="Documentation"
                      >
                        <BookOpen className="w-5 h-5" />
                        <span className="hidden sm:block font-medium text-sm">Documentation</span>
                        <ChevronDown className="w-4 h-4 opacity-70" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      <div className="absolute top-full left-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all flex flex-col overflow-hidden z-50">
                        <button 
                          onClick={() => { clearHistory(); navigateTo('ux-documentation', null, null); }}
                          className={`px-4 py-2 text-left text-sm transition-colors rounded-lg ${view === 'ux-documentation' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/50'}`}
                        >
                          User Journey Architecture
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedGame && (
                    <button 
                      onClick={() => navigateTo('session-view')}
                      className="flex items-center gap-2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                      <span className="text-zinc-100 font-medium truncate max-w-[150px] sm:max-w-none">
                        {selectedGame.title}
                      </span>
                    </button>
                  )}
                </div>

                <div 
                  className="flex-1 self-stretch cursor-default"
                  onClick={() => {
                    if (!isAdmin) return;
                    const newCount = secretNavClickCount + 1;
                    if (newCount === 5) {
                      setSecretNavUnlocked(true);
                    } else if (newCount >= 10) {
                      setSecretNavUnlocked(false);
                      setSecretNavClickCount(0);
                      return;
                    }
                    setSecretNavClickCount(newCount);
                  }}
                />

                <div className="flex items-center gap-3">
                  {!isOnline && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/30 border border-amber-900/50 rounded-full text-amber-500 text-xs font-medium" title="Offline Mode: Changes are saved locally. Reconnect to sync and prevent data loss.">
                      <WifiOff className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Offline Mode</span>
                    </div>
                  )}
                  {view === 'profile' && (
                    <button
                      onClick={() => setIsBackBarVisible(!isBackBarVisible)}
                      className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors"
                      title={isBackBarVisible ? "Hide back bar" : "Show back bar"}
                    >
                      {isBackBarVisible ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  )}
                  <button 
                    onClick={signOut}
                    className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>

                  <div className="relative">
                    <button 
                      onClick={() => {
                        const currentOption = parseInt(localStorage.getItem('cartridge_profile_ux_option') || '1', 10);
                        if (currentOption === 1) {
                          setIsProfileDropdownOpen(prev => !prev);
                          setIsProfileHoverCardOpen(false);
                        } else if (currentOption === 2) {
                          setIsProfileDrawerOpen(true);
                        } else if (currentOption === 3) {
                          setIsProfileModalOpen(true);
                        } else if (currentOption === 4) {
                          setIsProfileHoverCardOpen(prev => !prev);
                          setIsProfileDropdownOpen(false);
                        } else {
                          navigateTo('profile');
                        }
                      }}
                      className="rounded-full border border-zinc-800 hover:border-amber-400/80 transition-all overflow-hidden bg-zinc-900 flex items-center justify-center w-8 h-8 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/40"
                      title={user?.displayName || user?.email || (user?.isAnonymous ? 'Guest User' : 'Profile (Click to view)')}
                    >
                      {user?.photoURL ? (
                        <img src={user.photoURL} className="w-full h-full object-cover" alt="Profile" />
                      ) : (
                        <span className="text-xs font-bold text-amber-400">
                          {user?.isAnonymous ? 'D' : (user?.email?.[0]?.toUpperCase() || 'U')}
                        </span>
                      )}
                    </button>

                    <ProfileDropdown isOpen={isProfileDropdownOpen} onClose={() => setIsProfileDropdownOpen(false)} />
                    <ProfileHoverCard isOpen={isProfileHoverCardOpen} onClose={() => setIsProfileHoverCardOpen(false)} />
                  </div>
                </div>
              </div>

              {/* Mobile/Tablet Session View Navbar */}
              {view === 'session-view' && (
                <div className="flex lg:hidden items-center justify-between w-full gap-2">
                  <button 
                    onClick={goBack}
                    className="p-2 -ml-2 text-zinc-500 hover:text-zinc-100 transition-colors shrink-0"
                  >
                    <ChevronRight className="w-6 h-6 rotate-180" />
                  </button>
                  <button 
                    onClick={() => {
                      // Trigger an event that SessionView listens for
                      window.dispatchEvent(new CustomEvent('open-session-details'));
                    }}
                    className="flex-1 min-w-0 flex flex-col items-center justify-center p-1 hover:bg-zinc-900/50 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center gap-1.5 w-full justify-center">
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate max-w-[120px]">{selectedGame?.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 w-full justify-center text-zinc-100">
                      <span className="font-bold text-sm truncate">{activeSession?.name || activeSession?.chapter || activeSession?.progressMarker || 'Current Session'}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0" />
                    </div>
                  </button>
                  <div className="w-10 shrink-0" /> {/* Spacer to balance the back button */}
                </div>
              )}
            </header>

          {/* Back Bar */}
          {view === 'profile' && (
            <div 
              className={`w-full transition-all duration-300 ease-in-out overflow-hidden ${isBackBarVisible ? 'max-h-16 border-b border-zinc-900 opacity-100' : 'max-h-0 border-transparent opacity-0'}`}
            >
              <div className="px-6 py-2">
                <div className="mx-auto flex items-center justify-between max-w-6xl">
                  <button 
                    onClick={goBack}
                    className="text-left hover:bg-zinc-900/80 transition-colors group cursor-pointer py-1 px-2 -ml-2 rounded-lg"
                  >
                    <div className="flex items-center gap-2 text-zinc-500 group-hover:text-zinc-100 transition-colors text-xs font-bold uppercase tracking-widest">
                      <ChevronRight className="w-4 h-4 rotate-180" />
                      Back
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

        <main 
          ref={mainRef}
          className={`flex-1 min-h-0 w-full relative ${['session-view', 'note-editor'].includes(view) ? 'flex flex-col' : 'overflow-y-auto'}`}
        >
          <div className={`mx-auto w-full relative ${['session-view', 'note-editor'].includes(view) ? (view === 'note-editor' ? 'p-0 flex-1 min-h-0 flex flex-col' : 'p-2 sm:p-6 flex-1 min-h-0 flex flex-col max-w-[1440px]') : 'p-4 sm:p-6 max-w-6xl'}`}>
            {view === 'home' && <HomeView />}
            {view === 'dashboard' && <DashboardView />}
            {view === 'all-insights' && <AllInsightsView />}
            {view === 'all-notes' && <AllNotesView />}
            {view === 'session-view' && <SessionView />}
            {view === 'note-editor' && <NoteEditorView />}
            {view === 'profile' && <ProfileView />}
            {view === 'igdb-game' && <IGDBGameView />}
            {view === 'transition-mockups' && <TransitionMockupView />}
            {view === 'image-loading-mockups' && <ImageLoadingMockupView />}
            {view === 'hover-effect-mockups' && <HoverEffectMockupView />}
            {view === 'texture-mockups' && <BackgroundTextureMockupView />}
            {view === 'pill-nav-mockups' && <PillNavMockupView />}
            {view === 'image-reveal-logic' && <ImageRevealLogicMockupView />}
            {view === 'light-mode-library-mockup' && <LightModeLibraryMockupView />}
            {view === 'session-list-mockup' && <SessionListMockupView />}
            {view === 'trackers-sidebar-mockup' && <TrackersSidebarMockupView />}
            {view === 'tracker-modal-mockup' && <TrackerModalMockupView />}
            {view === 'tracker-sync-mockup' && <TrackerSyncMockupView />}
            {view === 'note-visuals-mockup' && <NoteVisualsMockupView />}
            {view === 'trackers-v2-post-mortem' && <TrackersV2PostMortemView />}
            {view === 'ux-documentation' && <UXDocumentationView />}
            {view === 'profile-mockups' && <ProfileMockupView />}
          </div>
        </main>

        <ProfileDrawer isOpen={isProfileDrawerOpen} onClose={() => setIsProfileDrawerOpen(false)} />
        <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #27272a;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #3f3f46;
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary><AuthProvider>
      <UserJourneyProvider>
        <UIProvider>
          <GameProvider>
            <MainApp />
          </GameProvider>
        </UIProvider>
      </UserJourneyProvider>
    </AuthProvider></ErrorBoundary>
  );
}
