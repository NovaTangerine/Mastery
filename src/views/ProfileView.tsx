import React, { useState } from 'react';
import { motion } from 'motion/react';
import { PenLine, X, Plus, ArrowUpRight, LayoutGrid, Star, Trophy, Gamepad2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { useGameLibrary } from '../contexts/GameContext';
import { useUserProfile } from '../hooks/useUserProfile';
import { useResumeGame } from '../hooks/useResumeGame';
import BlurRevealImage from '../components/BlurRevealImage';
import { Game } from '../types';

const MAX_BIO_LENGTH = 160;
const MAX_LINKS = 5;

const PLATFORM_NAMES: Record<string, string> = {
  'x.com': 'X',
  'twitter.com': 'X',
  'bsky.app': 'Bluesky',
  'twitch.tv': 'Twitch',
  'youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
  'instagram.com': 'Instagram',
  'tiktok.com': 'TikTok',
  'threads.net': 'Threads',
  'discord.gg': 'Discord',
  'discord.com': 'Discord',
  'steamcommunity.com': 'Steam',
  'psnprofiles.com': 'PSN',
  'xbox.com': 'Xbox',
  'backloggd.com': 'Backloggd',
  'github.com': 'GitHub',
};

/** Returns a normalized http(s) URL, or null if the input isn't a usable link. */
const normalizeUrl = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (!url.hostname.includes('.')) return null;
    return url.toString();
  } catch {
    return null;
  }
};

const getLinkLabel = (href: string) => {
  try {
    const host = new URL(href).hostname.replace(/^www\./, '');
    return PLATFORM_NAMES[host] || host;
  } catch {
    return href;
  }
};

const Stars = ({ rating, className }: { rating: number; className?: string }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(value => (
      <Star
        key={value}
        className={`${className || 'w-3 h-3'} ${value <= rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'}`}
      />
    ))}
  </div>
);

export default function ProfileView() {
  const { user } = useAuth();
  const { navigateTo } = useUI();
  const { games, gamesLimit, loadMoreGames } = useGameLibrary();
  const { profile, isLoading, saveProfile } = useUserProfile();
  const resumeGame = useResumeGame();

  const [activeTab, setActiveTab] = useState<'library' | 'reviews'>('library');
  const [isEditing, setIsEditing] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [linkInputs, setLinkInputs] = useState<string[]>([]);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const displayName = user?.displayName || user?.email?.split('@')[0] || (user?.isAnonymous ? 'Guest Gamer' : 'Player');
  const bio = profile.bio || '';
  const socialLinks = profile.socialLinks || [];

  const reviewedGames = React.useMemo(
    () => games
      .filter(g => g.status === 'completed' && g.completion)
      .sort((a, b) => (b.completion!.completedAt || 0) - (a.completion!.completedAt || 0)),
    [games]
  );

  const openEditor = () => {
    setBioInput(bio);
    setLinkInputs(socialLinks.length > 0 ? socialLinks : ['']);
    setLinkError(null);
    setIsEditing(true);
  };

  const closeEditor = () => {
    setIsEditing(false);
    setLinkError(null);
  };

  const handleSave = async () => {
    const filledLinks = linkInputs.map(l => l.trim()).filter(Boolean);
    const normalized = filledLinks.map(normalizeUrl);
    const invalidIndex = normalized.findIndex(l => l === null);
    if (invalidIndex !== -1) {
      setLinkError(`"${filledLinks[invalidIndex]}" isn't a valid link.`);
      return;
    }

    setIsSaving(true);
    try {
      await saveProfile({
        bio: bioInput.trim().slice(0, MAX_BIO_LENGTH),
        socialLinks: Array.from(new Set(normalized as string[])).slice(0, MAX_LINKS)
      });
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      console.error(err);
      toast.error("Couldn't save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const renderCover = (game: Game, index: number) => (
    <div className="absolute inset-0 bg-zinc-900 rounded-md overflow-hidden">
      <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)] rounded-md z-20 pointer-events-none" />
      {game.coverUrl && game.coverUrl !== 'null' ? (
        <BlurRevealImage
          url={game.coverUrl.replace('t_cover_big', 't_720p')}
          alt={game.title}
          className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-[1.03]"
          revealDelay={index * 40}
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 text-zinc-500 p-3 text-center">
          <Gamepad2 className="w-6 h-6 mb-2 opacity-30" />
          <span className="text-[11px] leading-tight opacity-70">{game.title}</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto pb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profile Header */}
      <section className="relative flex flex-col items-center text-center pt-8 sm:pt-12 pb-8 px-4">
        <button
          onClick={isEditing ? closeEditor : openEditor}
          className="absolute top-4 right-0 p-1.5 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
          title={isEditing ? 'Cancel editing' : 'Edit profile'}
        >
          {isEditing ? <X className="w-4 h-4" /> : <PenLine className="w-4 h-4" />}
        </button>

        <div className="p-1 rounded-full border border-zinc-800">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-3xl font-bold text-amber-400">{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
        </div>

        <h1 className="mt-4 text-[22px] lg:text-[26px] font-normal tracking-tight text-white">
          {displayName}
        </h1>

        {!isEditing && !isLoading && (
          <>
            {bio ? (
              <p className="mt-2 max-w-md text-sm text-zinc-400 leading-relaxed">{bio}</p>
            ) : (
              <button
                onClick={openEditor}
                className="mt-2 text-sm text-zinc-600 italic hover:text-zinc-400 transition-colors"
              >
                Add a short bio
              </button>
            )}

            {socialLinks.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                {socialLinks.map(link => (
                  <a
                    key={link}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
                  >
                    {getLinkLabel(link)}
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                ))}
              </div>
            )}
          </>
        )}

        {/* Edit form — same expand pattern and field styles as the session details editor */}
        <div className={`grid w-full transition-all duration-300 ease-in-out ${isEditing ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
          <div className="overflow-hidden min-h-0">
            <div className="flex flex-col w-full max-w-sm mx-auto gap-4 sm:gap-5 pt-5 pb-1 text-left">
              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center justify-between min-h-[16px]">
                  <label className="text-[11px] font-normal text-zinc-500 uppercase tracking-[.072em]">Bio</label>
                  <span className="text-[10px] text-zinc-500">{bioInput.length} / {MAX_BIO_LENGTH}</span>
                </div>
                <textarea
                  value={bioInput}
                  onChange={(e) => setBioInput(e.target.value.slice(0, MAX_BIO_LENGTH))}
                  rows={3}
                  placeholder="What kind of player are you?"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-600 rounded-xl px-3 py-2.5 text-[16px] sm:text-sm text-white leading-relaxed placeholder:text-zinc-600 focus:outline-none transition-colors resize-none"
                />
              </div>

              <div className="flex flex-col space-y-1.5">
                <div className="flex items-center min-h-[16px]">
                  <label className="text-[11px] font-normal text-zinc-500 uppercase tracking-[.072em]">Links</label>
                </div>
                {linkInputs.map((link, i) => (
                  <div key={i} className="flex items-center gap-2 h-[42px]">
                    <input
                      type="url"
                      value={link}
                      onChange={(e) => {
                        const next = [...linkInputs];
                        next[i] = e.target.value;
                        setLinkInputs(next);
                        setLinkError(null);
                      }}
                      placeholder="twitch.tv/yourname"
                      className="flex-1 h-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-[16px] sm:text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                    />
                    <button
                      onClick={() => setLinkInputs(linkInputs.filter((_, idx) => idx !== i))}
                      className="w-[42px] h-[42px] flex items-center justify-center shrink-0 text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-zinc-800 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {linkError && <p className="text-xs text-red-400">{linkError}</p>}
                {linkInputs.length < MAX_LINKS && (
                  <button
                    onClick={() => setLinkInputs([...linkInputs, ''])}
                    className="self-start flex items-center gap-1.5 pt-1 text-xs text-zinc-500 hover:text-zinc-100 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add link
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-3 sm:pt-4 border-t border-zinc-800/50 w-full">
                <button
                  onClick={closeEditor}
                  className="px-4 py-2 bg-transparent text-zinc-400 hover:text-zinc-100 rounded-xl text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-zinc-100 text-zinc-950 rounded-xl text-sm font-bold hover:bg-white disabled:opacity-50 transition-colors"
                >
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={`transition-opacity duration-300 ${isEditing ? 'opacity-50 pointer-events-none select-none' : 'opacity-100'}`}>
        {/* Navigation */}
        <nav className="flex justify-center pt-6 border-t border-zinc-800/50">
          <div className="bg-zinc-900/90 border border-zinc-800/80 p-1 rounded-full flex items-center gap-1">
            {([
              { id: 'library', label: 'Library', icon: LayoutGrid, count: games.length },
              { id: 'reviews', label: 'Reviews', icon: Star, count: reviewedGames.length },
            ] as const).map(tab => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors ${isActive ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeProfileTab"
                      className="absolute inset-0 bg-zinc-800 rounded-full"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <TabIcon className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold leading-none pt-[1px]">{tab.label}</span>
                    <span className="text-[10px] text-zinc-500 leading-none pt-[1px] tabular-nums">{tab.count}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Library */}
        {activeTab === 'library' && (
          <div className="pt-8">
            {games.length === 0 ? (
              <div className="py-16 flex flex-col items-center text-center">
                <p className="text-zinc-600 text-sm font-medium italic">No games in your library yet.</p>
                <button
                  onClick={() => navigateTo('dashboard')}
                  className="mt-3 text-sm text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  Go to your library
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-2 sm:gap-x-3 gap-y-5 sm:gap-y-6">
                  {games.map((game, index) => (
                    <button
                      key={game.id}
                      onClick={() => resumeGame(game)}
                      className="group text-left min-w-0"
                    >
                      <div className="relative aspect-[264/374] rounded-md shadow-[0_1px_3px_rgba(0,0,0,0.35)]">
                        {renderCover(game, index)}
                        <div className="absolute inset-0 z-30 rounded-md pointer-events-none transition-all duration-[150ms] ease-out shadow-[inset_0_0_0_0px_rgba(255,255,255,1)] group-hover:shadow-[inset_0_0_0_2.5px_rgba(255,255,255,1)]" />
                        {game.status === 'completed' && (
                          <span className="absolute top-2 right-2 z-30 flex items-center justify-center w-7 h-7 bg-black/50 backdrop-blur-md rounded-full border border-amber-400/30 text-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.3)]">
                            <Trophy className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[13px] text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">{game.title}</p>
                      {game.completion?.rating ? (
                        <div className="mt-1"><Stars rating={game.completion.rating} /></div>
                      ) : null}
                    </button>
                  ))}
                </div>
                {games.length >= gamesLimit && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={loadMoreGames}
                      className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-6 py-3 rounded-full font-bold text-sm hover:text-zinc-100 hover:bg-zinc-800 transition-all"
                    >
                      Load More Games
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Reviews */}
        {activeTab === 'reviews' && (
          <div className="pt-4 max-w-3xl mx-auto">
            {reviewedGames.length === 0 ? (
              <div className="py-16 flex flex-col items-center text-center">
                <p className="text-zinc-600 text-sm font-medium italic">No reviews yet.</p>
                <p className="mt-1 text-xs text-zinc-600">Mark a game as completed from its session to write one.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-800/50">
                {reviewedGames.map((game, index) => {
                  const completion = game.completion!;
                  return (
                    <article key={game.id} className="flex gap-4 sm:gap-5 py-6">
                      <button
                        onClick={() => resumeGame(game)}
                        className="group relative w-16 sm:w-20 aspect-[264/374] rounded-md shrink-0 self-start shadow-[0_1px_3px_rgba(0,0,0,0.35)]"
                      >
                        {renderCover(game, index)}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                          <h3 className="text-base sm:text-lg font-medium text-zinc-100 truncate">{game.title}</h3>
                          <span className="text-xs text-zinc-500 shrink-0">
                            Completed {format(completion.completedAt, 'MMM d, yyyy')}
                          </span>
                        </div>
                        <div className="mt-1.5"><Stars rating={completion.rating} className="w-3.5 h-3.5" /></div>
                        {completion.tags.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {completion.tags.map(tag => (
                              <span key={tag} className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-400 text-[11px]">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {completion.review && (
                          <p className="mt-3 text-sm text-zinc-300 leading-relaxed whitespace-pre-line">{completion.review}</p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
