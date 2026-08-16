import React, { useState } from 'react';
import { useUI } from '../contexts/UIContext';
import { useAuth } from '../contexts/AuthContext';
import { useUserJourney } from '../contexts/UserJourneyContext';
import { 
  User, 
  Menu, 
  LayoutGrid, 
  Maximize2, 
  Sidebar, 
  Sparkles, 
  Check, 
  ChevronRight, 
  Shield, 
  ArrowLeft,
  MousePointerClick
} from 'lucide-react';
import ProfileDropdown from '../components/ProfileDropdown';
import ProfileDrawer from '../components/ProfileDrawer';
import ProfileModal from '../components/ProfileModal';
import ProfileHoverCard from '../components/ProfileHoverCard';
import ProfileView from './ProfileView';

export default function ProfileMockupView() {
  const { navigateTo } = useUI();
  const { user } = useAuth();
  const { totalGames, totalSessions, totalNotes } = useUserJourney();

  // Active option demo state
  const [activeTab, setActiveTab] = useState<number>(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHoverCardOpen, setIsHoverCardOpen] = useState(false);

  // Stored preference in local storage for default navbar action
  const [savedDefaultOption, setSavedDefaultOption] = useState<number>(() => {
    return parseInt(localStorage.getItem('cartridge_profile_ux_option') || '1', 10);
  });

  const saveOptionAsDefault = (optionNum: number) => {
    localStorage.setItem('cartridge_profile_ux_option', optionNum.toString());
    setSavedDefaultOption(optionNum);
  };

  const displayName = user?.displayName || (user?.isAnonymous ? 'Guest Gamer' : user?.email?.split('@')[0] || 'Player');

  return (
    <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto py-8 px-4 text-zinc-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20 uppercase tracking-wider">
              UX Showcase
            </span>
            <span className="text-xs text-zinc-500">• 5 Implementations</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Profile Interaction Options</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Choose how clicking or interacting with the user profile avatar in the header should behave.
          </p>
        </div>

        <button 
          onClick={() => navigateTo('dashboard')}
          className="flex items-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm font-semibold transition-colors self-start shrink-0 border border-zinc-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
      </div>

      {/* Tabs for 5 Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { id: 1, name: '1. Dropdown Menu', desc: 'Classic compact popover' },
          { id: 2, name: '2. Slide Drawer', desc: 'Full slide-over sheet' },
          { id: 3, name: '3. Centered Modal', desc: 'Focus passport dialog' },
          { id: 4, name: '4. Floating Badge', desc: 'Gamified level pill' },
          { id: 5, name: '5. Live Full View', desc: 'Full profile page' },
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => setActiveTab(opt.id)}
            className={`p-3.5 rounded-2xl border text-left transition-all ${
              activeTab === opt.id 
                ? 'bg-zinc-800/90 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.15)] text-white' 
                : 'bg-zinc-900/50 border-zinc-800/80 text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-zinc-100">{opt.name}</span>
              {savedDefaultOption === opt.id && (
                <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-bold uppercase">
                  Default
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">{opt.desc}</p>
          </button>
        ))}
      </div>

      {/* Active Demo Area */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 sm:p-8 min-h-[480px] relative overflow-hidden flex flex-col justify-between">
        {/* Top bar with trigger & set default button */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span>
                {activeTab === 1 && 'Option 1: Modern Dropdown Menu'}
                {activeTab === 2 && 'Option 2: Slide-Over Profile Drawer'}
                {activeTab === 3 && 'Option 3: Centered User Passport Modal'}
                {activeTab === 4 && 'Option 4: Floating Gamer Level Badge'}
                {activeTab === 5 && 'Option 5: Live Full-Page Profile Experience'}
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-1">
              {activeTab === 1 && 'Click the avatar below to open the dropdown menu. Features quick links, stats bar, and log out.'}
              {activeTab === 2 && 'Click the avatar below to trigger the fluid slide-in drawer from the right edge.'}
              {activeTab === 3 && 'Click the avatar below to present a centered focus dialog with user ID copying and stats.'}
              {activeTab === 4 && 'Click the avatar below to reveal a compact, gamified player card showing calculated gamer level.'}
              {activeTab === 5 && 'Loads the full profile page with live stats and user library info.'}
            </p>
          </div>

          <button
            onClick={() => saveOptionAsDefault(activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              savedDefaultOption === activeTab
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                : 'bg-amber-400 hover:bg-amber-300 text-zinc-950 shadow-md active:scale-95'
            }`}
          >
            {savedDefaultOption === activeTab ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Active Navbar Default</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Set as Navbar Action</span>
              </>
            )}
          </button>
        </div>

        {/* Interactive Trigger Sandbox */}
        <div className="flex-1 py-12 flex flex-col items-center justify-center">
          {activeTab === 1 && (
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-16 h-16 rounded-full border-2 border-amber-400/60 hover:border-amber-400 bg-zinc-800 flex items-center justify-center shadow-xl hover:scale-105 transition-all text-xl font-bold text-amber-400 group"
                >
                  {displayName.charAt(0).toUpperCase()}
                </button>
                <ProfileDropdown isOpen={isDropdownOpen} onClose={() => setIsDropdownOpen(false)} />
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-950/60 px-4 py-2 rounded-full border border-zinc-800">
                <MousePointerClick className="w-4 h-4 text-amber-400" />
                <span>Click avatar to toggle Dropdown Menu</span>
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="flex flex-col items-center gap-6">
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-3 px-6 py-3.5 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-2xl shadow-xl hover:scale-105 transition-all active:scale-95"
              >
                <Sidebar className="w-5 h-5" />
                <span>Open Slide-Over Drawer</span>
              </button>
              <ProfileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
              <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-950/60 px-4 py-2 rounded-full border border-zinc-800">
                <MousePointerClick className="w-4 h-4 text-amber-400" />
                <span>Slides smoothly from right with live stats & shortcuts</span>
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="flex flex-col items-center gap-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-3 px-6 py-3.5 bg-zinc-100 hover:bg-white text-zinc-950 font-bold rounded-2xl shadow-xl hover:scale-105 transition-all active:scale-95"
              >
                <Maximize2 className="w-5 h-5" />
                <span>Open Passport Modal</span>
              </button>
              <ProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
              <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-950/60 px-4 py-2 rounded-full border border-zinc-800">
                <MousePointerClick className="w-4 h-4 text-amber-400" />
                <span>Centered dialog with clean backdrop blur</span>
              </div>
            </div>
          )}

          {activeTab === 4 && (
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <button
                  onClick={() => setIsHoverCardOpen(!isHoverCardOpen)}
                  className="w-16 h-16 rounded-full border-2 border-amber-400/60 hover:border-amber-400 bg-zinc-800 flex items-center justify-center shadow-xl hover:scale-105 transition-all text-xl font-bold text-amber-400"
                >
                  {displayName.charAt(0).toUpperCase()}
                </button>
                <ProfileHoverCard isOpen={isHoverCardOpen} onClose={() => setIsHoverCardOpen(false)} />
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-950/60 px-4 py-2 rounded-full border border-zinc-800">
                <MousePointerClick className="w-4 h-4 text-amber-400" />
                <span>Click avatar to toggle Level Badge Popover</span>
              </div>
            </div>
          )}

          {activeTab === 5 && (
            <div className="w-full max-h-[400px] overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950/50 p-4">
              <ProfileView />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
