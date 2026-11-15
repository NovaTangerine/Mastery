// Capsule page (A1), All games (B), public capsule (F), Settings (H)
// from 01-lofi-set.html.
//
// A1 vs A2 is undecided. The page is built from section components
// (ProfileHeader, HeadlineGame, TopFive, Showcase) so A2 is a different
// arrangement of the same parts: see CapsulePageA1 below.

import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Capsule,
  CapsuleStatus,
  CapsuleUser,
  RatingScale,
  SCALE_LABEL,
  SHELF_FILLER,
  STATUS_LABEL,
  ShowcaseSize,
  findGame,
  formatDate,
  shortScore,
} from '../data';
import { useCapsuleStore, useHeadlineCapsule } from '../store';
import {
  Avatar,
  Btn,
  Chip,
  Collectible,
  Divider,
  FieldLabel,
  Flash,
  Note,
  Page,
  Panel,
  Ph,
  TopBar,
  copyText,
  cx,
  inputCls,
  publicUrl,
  useFlash,
} from '../ui';
import { ShareModal } from './Share';

// Shared bits -----------------------------------------------------------------

function ScoreLine({ capsule, scale, big }: { capsule: Capsule; scale: RatingScale; big?: boolean }) {
  const score = shortScore(capsule, scale);
  if (score) return <p className={cx(big ? 'text-[22px] tracking-[0.08em]' : 'text-[13px] font-semibold text-[#555]')}>{score}</p>;
  if (capsule.headline) return <p className={cx('font-bold', big ? 'text-[20px] leading-[26px]' : 'text-[13px] text-[#555]')}>“{capsule.headline}”</p>;
  return null;
}

function NotFound({ handle }: { handle?: string }) {
  return (
    <Page className="min-h-screen gap-8">
      <TopBar right={<Btn to="/capsule">Make your own Capsule</Btn>} />
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <p className="text-[24px] font-extrabold">No Capsule at {publicUrl(handle ?? '')} yet</p>
        <Note>Only the prototype’s own user exists in pass 1.</Note>
      </div>
    </Page>
  );
}

function useOwner() {
  const { handle } = useParams();
  const store = useCapsuleStore();
  return { handle, isOwner: handle === store.user.handle, ...store };
}

function OwnerTopBar() {
  const navigate = useNavigate();
  const { user, startDraft } = useCapsuleStore();
  const [msg, flash] = useFlash();
  return (
    <>
      <TopBar
        logoTo={`/capsule/u/${user.handle}`}
        right={
          <>
            <Btn
              variant="secondary"
              className="hidden sm:inline-flex"
              onClick={() => {
                copyText(`https://${publicUrl(user.handle)}`);
                flash('Link copied');
              }}
            >
              Copy link
            </Btn>
            {/* Experiment: the same review flow inside a modal (ReviewModal.tsx). */}
            <Btn
              variant="secondary"
              className="hidden sm:inline-flex"
              onClick={() => {
                startDraft();
                navigate(`/capsule/u/${user.handle}/review`);
              }}
            >
              + Review in modal
            </Btn>
            <Btn
              onClick={() => {
                startDraft();
                navigate('/capsule/new/game');
              }}
            >
              + New capsule
            </Btn>
            <Link to="/capsule/settings" aria-label="Settings">
              <Avatar size={32} src={user.photoURL} />
            </Link>
          </>
        }
      />
      <Flash msg={msg} />
    </>
  );
}

// A1 sections -------------------------------------------------------------------

function ProfileHeader({ user, capsuleCount }: { user: CapsuleUser; capsuleCount: number }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
      <Avatar size={88} src={user.photoURL} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-[26px] font-extrabold leading-8">{user.displayName.split(' ')[0]}</p>
        {user.bio ? <p className="text-[14px] text-[#555]">{user.bio}</p> : <Note>No bio yet. Add one in Edit profile.</Note>}
        <div className="flex flex-wrap items-center gap-2">
          {user.socialLinks.map((s) => (
            <Chip key={s.label}>{s.label}</Chip>
          ))}
          <Btn variant="link" to="/capsule/settings#profile" className="ml-1">
            Edit profile
          </Btn>
        </div>
      </div>
      <p className="text-[13px] font-semibold text-[#555]">
        {Math.max(user.stats.games, capsuleCount)} games · {capsuleCount} capsules · {user.stats.followers} followers
      </p>
    </div>
  );
}

function HeadlinePicker({ user, capsule }: { user: CapsuleUser; capsule?: Capsule }) {
  const { capsules, updateUser } = useCapsuleStore();
  const pinned = !!capsule && user.headlinePinned && user.headlineGameId === capsule.gameId;
  return (
    <select
      aria-label="Pin a headline game"
      className="rounded-md border border-[#DDD] bg-white px-2 py-[2px] text-[11px] text-[#555]"
      value={pinned ? capsule!.gameId : ''}
      onChange={(e) =>
        updateUser(e.target.value ? { headlinePinned: true, headlineGameId: e.target.value } : { headlinePinned: false, headlineGameId: undefined })
      }
    >
      <option value="">{user.autoHeadline ? 'Auto (most recent)' : 'None (auto-pick is off)'}</option>
      {capsules.map((c) => (
        <option key={c.id} value={c.gameId}>
          Pin: {c.gameTitle}
        </option>
      ))}
    </select>
  );
}

function HeadlineGame({ capsule, user }: { capsule?: Capsule; user: CapsuleUser }) {
  const { capsules, startDraft } = useCapsuleStore();
  const navigate = useNavigate();
  if (!capsule && capsules.length > 0) {
    // Auto-pick is off in Settings and nothing is pinned.
    return (
      <Panel className="items-start gap-3 p-6">
        <p className="text-[16px] font-bold">No headline game</p>
        <p className="text-[13px] text-[#555]">Auto-pick is off. Pin one of your capsules to headline your page.</p>
        <HeadlinePicker user={user} />
      </Panel>
    );
  }
  if (!capsule) {
    return (
      <Panel className="items-start gap-3 p-6">
        <p className="text-[16px] font-bold">Your headline game shows up here</p>
        <p className="text-[13px] text-[#555]">It’s picked from what you capsuled most recently, and you can pin over it.</p>
        <Btn
          onClick={() => {
            startDraft();
            navigate('/capsule/new/game');
          }}
        >
          Write your first capsule
        </Btn>
      </Panel>
    );
  }
  return (
    <div className="flex flex-col gap-6 md:flex-row md:items-center">
      <Ph className="h-[200px] w-full md:h-[240px] md:w-[420px]" label="headline cover" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#888]">
            Headline · {user.headlinePinned && user.headlineGameId === capsule.gameId ? 'pinned' : 'auto-picked'}
          </p>
          <HeadlinePicker user={user} capsule={capsule} />
        </div>
        <p className="text-[28px] font-extrabold leading-[34px]">{capsule.gameTitle}</p>
        <ScoreLine capsule={capsule} scale={user.ratingScale} big />
        <p className="text-[16px] leading-[22px] text-[#333]">“{capsule.text}”</p>
        <Btn variant="link" to={`/capsule/u/${user.handle}/${capsule.id}`} className="self-start">
          Open capsule →
        </Btn>
      </div>
    </div>
  );
}

function TopFive({ user }: { user: CapsuleUser }) {
  const slots = Array.from({ length: 5 }, (_, i) => (user.top5[i] ? findGame(user.top5[i]) : undefined));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <p className="text-[18px] font-extrabold">Top 5</p>
        <Note>set manually</Note>
        <Btn variant="link" to="/capsule/favorites?size=5&from=profile" className="ml-auto">
          Edit
        </Btn>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 sm:gap-[14px]">
        {slots.map((g, i) => (
          <Ph key={i} className="h-[150px] sm:h-[230px]" label={g ? `#${i + 1} · ${g.title}` : `#${i + 1}`} />
        ))}
      </div>
    </div>
  );
}

function Showcase({ user, capsules }: { user: CapsuleUser; capsules: Capsule[] }) {
  const items = useMemo(() => {
    const fromCapsules = [...capsules].sort((a, b) => b.updatedAt - a.updatedAt).map((c) => ({ key: c.id, label: c.gameTitle, to: `/capsule/u/${user.handle}/${c.id}` }));
    // Pass 1: pad with library games so the grid reads at its real size.
    const filler = capsules.length
      ? SHELF_FILLER.map((id) => ({ key: id, label: findGame(id)?.title ?? '', to: undefined as string | undefined }))
      : [];
    return [...fromCapsules, ...filler].slice(0, user.showcaseSize);
  }, [capsules, user.handle, user.showcaseSize]);
  const total = Math.max(user.stats.games, capsules.length);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-4">
        <p className="text-[18px] font-extrabold">Showcase · {user.showcaseSize}</p>
        <Link to={`/capsule/u/${user.handle}/games`} className="text-[14px] font-semibold text-[#888] hover:text-[#222]">
          All games · {total}
        </Link>
        <Btn variant="link" to={`/capsule/u/${user.handle}/games`} className="ml-auto">
          See all games →
        </Btn>
      </div>
      {items.length === 0 ? (
        <Note>Finished games land here automatically.</Note>
      ) : (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {items.map((it) =>
            it.to ? (
              <Link key={it.key} to={it.to}>
                <Ph className="h-[110px] w-full hover:bg-[#E2E2E2] sm:h-[150px]" label={it.label} />
              </Link>
            ) : (
              <Ph key={it.key} className="h-[110px] sm:h-[150px]" label={it.label} />
            ),
          )}
        </div>
      )}
    </div>
  );
}

// A1 · Capsule page (profile = home) ------------------------------------------

export function CapsulePageA1() {
  const { handle, isOwner, user, capsules } = useOwner();
  const headline = useHeadlineCapsule();
  if (!isOwner) return <NotFound handle={handle} />;
  return (
    <Page className="gap-8">
      <OwnerTopBar />
      <Divider />
      <ProfileHeader user={user} capsuleCount={capsules.length} />
      <HeadlineGame capsule={headline} user={user} />
      <TopFive user={user} />
      <Showcase user={user} capsules={capsules} />
    </Page>
  );
}

// B · All games -----------------------------------------------------------------

type Row = { key: string; title: string; status: CapsuleStatus; capsule?: Capsule; date: number };
const PAGE = 10;

export function AllGames() {
  const { handle, isOwner, user, capsules, startDraft } = useOwner();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | CapsuleStatus>('all');
  const [rated, setRated] = useState<'any' | 'rated' | 'unrated'>('any');
  const [sort, setSort] = useState<'recent' | 'title'>('recent');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [shown, setShown] = useState(PAGE);

  const rows = useMemo(() => {
    const base: Row[] = [
      ...capsules.map((c) => ({ key: c.id, title: c.gameTitle, status: c.status, capsule: c, date: c.updatedAt })),
      ...SHELF_FILLER.map((id, i) => ({
        key: id,
        title: findGame(id)?.title ?? id,
        status: 'finished' as CapsuleStatus,
        date: Date.UTC(2026, 8, 20) - i * 6 * 864e5,
      })),
    ];
    return base
      .filter((r) => !q || r.title.toLowerCase().includes(q.toLowerCase()))
      .filter((r) => status === 'all' || r.status === status)
      .filter((r) => rated === 'any' || (rated === 'rated' ? !!r.capsule?.rating : !r.capsule?.rating))
      .sort((a, b) => (sort === 'title' ? a.title.localeCompare(b.title) : b.date - a.date));
  }, [capsules, q, status, rated, sort]);

  if (!isOwner) return <NotFound handle={handle} />;
  const first = user.displayName.split(' ')[0];
  const sel = 'rounded-[10px] border-[1.5px] border-[#CFCFCF] bg-white px-3 py-2 text-[13px] text-[#444]';

  return (
    <Page className="gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to={`/capsule/u/${user.handle}`} className="text-[18px] font-bold text-[#555] hover:text-[#222]" aria-label="Back">
            ←
          </Link>
          <p className="text-[22px] font-extrabold">
            {first}’s games · {Math.max(user.stats.games, rows.length)}
          </p>
        </div>
        <input className={cx(inputCls, 'w-full py-2 sm:w-[300px]')} placeholder="Search this list" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select className={sel} value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label="Status">
          <option value="all">Status: All</option>
          <option value="finished">Finished</option>
          <option value="dropped">Dropped</option>
          <option value="favorite">All-time favorite</option>
        </select>
        <select className={sel} value={rated} onChange={(e) => setRated(e.target.value as typeof rated)} aria-label="Rating">
          <option value="any">Rating: Any</option>
          <option value="rated">Rated</option>
          <option value="unrated">Unrated</option>
        </select>
        <select className={sel} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Sort">
          <option value="recent">Sort: Recent</option>
          <option value="title">Sort: Title</option>
        </select>
        <div className="ml-auto flex gap-2">
          <Chip selected={view === 'list'} onClick={() => setView('list')}>
            List
          </Chip>
          <Chip selected={view === 'grid'} onClick={() => setView('grid')}>
            Grid
          </Chip>
        </div>
      </div>
      <Divider />
      {view === 'list' ? (
        <div className="flex flex-col">
          {rows.slice(0, shown).map((r) => (
            <div key={r.key} className="flex items-center gap-4 border-b border-[#EFEFEF] py-3">
              <Ph className="h-[80px] w-[60px]" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[15px] font-bold">{r.title}</p>
                  <Chip>{STATUS_LABEL[r.status]}</Chip>
                </div>
                {r.capsule ? (
                  <>
                    <p className="text-[12px] font-semibold text-[#555]">
                      {shortScore(r.capsule, user.ratingScale) ?? 'Unrated'}
                      {r.capsule.verdict && ` · ${r.capsule.verdict}`}
                    </p>
                    <Link to={`/capsule/u/${user.handle}/${r.capsule.id}`} className="truncate text-[13px] text-[#555] hover:text-[#222]">
                      {!r.capsule.rating && r.capsule.headline ? `HEADLINE: “${r.capsule.headline}”` : `“${r.capsule.text}”`}
                    </Link>
                  </>
                ) : (
                  <button
                    type="button"
                    className="self-start text-[13px] text-[#888] hover:text-[#222]"
                    onClick={() => {
                      const g = findGame(r.key);
                      startDraft({ game: g, status: r.status });
                      navigate('/capsule/new/words');
                    }}
                  >
                    No capsule yet · Write one →
                  </button>
                )}
              </div>
              <p className="hidden text-[12px] text-[#888] sm:block">{formatDate(r.date, true)}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {rows.slice(0, shown).map((r) => (
            <Ph key={r.key} className="h-[150px] sm:h-[200px]" label={`${r.title}${r.capsule ? '' : ' · no capsule'}`} />
          ))}
        </div>
      )}
      {rows.length === 0 && <Note>Nothing matches those filters.</Note>}
      {shown < rows.length && (
        <Btn variant="secondary" className="self-center" onClick={() => setShown((n) => n + PAGE)}>
          Load more
        </Btn>
      )}
    </Page>
  );
}

// F · Public capsule (what a shared link opens) --------------------------------

export function PublicCapsule() {
  const { handle, capsuleId } = useParams();
  const { user, capsules } = useCapsuleStore();
  const capsule = capsules.find((c) => c.id === capsuleId);
  const [liked, setLiked] = useState(false);
  const [following, setFollowing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  if (handle !== user.handle || !capsule) return <NotFound handle={handle} />;
  const first = user.displayName.split(' ')[0];

  return (
    <Page className="gap-6">
      <TopBar
        right={
          <>
            <Btn variant="secondary" className="hidden sm:inline-flex" onClick={() => setShareOpen(true)}>
              Share
            </Btn>
            <Btn to="/capsule">Make your own Capsule</Btn>
          </>
        }
      />
      <Divider />
      <div className="flex flex-col gap-10 md:flex-row md:items-start">
        <Collectible className="w-full max-w-[320px] self-center md:self-start" title={capsule.gameTitle} />
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar size={36} src={user.photoURL} />
            <p className="text-[14px] font-semibold">{first}’s capsule</p>
            <Chip selected={following} onClick={() => setFollowing(!following)}>
              {following ? 'Following' : 'Follow'}
            </Chip>
          </div>
          <p className="text-[30px] font-extrabold uppercase leading-9 tracking-[-0.01em]">{capsule.gameTitle}</p>
          <ScoreLine capsule={capsule} scale={user.ratingScale} big />
          {capsule.verdict && (
            <span className="self-start rounded-full border border-[#222] px-[10px] py-[3px] text-[11px] font-bold uppercase tracking-wide">
              Verdict · {capsule.verdict}
            </span>
          )}
          <p className="text-[12px] font-medium text-[#888]">
            {STATUS_LABEL[capsule.status]} · {formatDate(capsule.updatedAt, true)}
          </p>
          <p className="text-[17px] leading-6 text-[#333]">“{capsule.text}”</p>
          {capsule.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {capsule.tags.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-5 pt-2">
            <Btn variant={liked ? 'primary' : 'secondary'} onClick={() => setLiked(!liked)}>
              {liked ? '♥' : '♡'} Like · {capsule.likeCount + (liked ? 1 : 0)}
            </Btn>
            <Btn variant="link" to={`/capsule/u/${user.handle}`}>
              See {first}’s full Capsule →
            </Btn>
          </div>
        </div>
      </div>
      <ShareModal capsule={capsule} handle={user.handle} scale={user.ratingScale} open={shareOpen} onClose={() => setShareOpen(false)} />
    </Page>
  );
}

// H · Settings --------------------------------------------------------------------

const SECTIONS = [
  { id: 'profile', label: 'Profile' },
  { id: 'display', label: 'Capsule display' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'account', label: 'Account' },
];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 text-[14px] text-[#333]">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cx('relative h-6 w-10 shrink-0 rounded-full transition-colors', checked ? 'bg-[#222]' : 'bg-[#D5D5D5]')}
      >
        <span className={cx('absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all', checked ? 'left-[19px]' : 'left-[3px]')} />
      </button>
    </label>
  );
}

export function Settings() {
  const navigate = useNavigate();
  const { user, updateUser, resetToMockData, resetAsNewUser } = useCapsuleStore();
  const [form, setForm] = useState<CapsuleUser>(user);
  const [msg, flash] = useFlash();
  const set = <K extends keyof CapsuleUser>(k: K, v: CapsuleUser[K]) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Page className="gap-6">
      <TopBar
        logoTo={`/capsule/u/${user.handle}`}
        right={
          <Btn variant="link" to={`/capsule/u/${user.handle}`}>
            ← Back to my Capsule
          </Btn>
        }
      />
      <h1 className="text-[28px] font-extrabold">Settings</h1>
      <div className="flex flex-col gap-10 md:flex-row">
        <nav className="flex gap-4 overflow-x-auto md:w-[200px] md:shrink-0 md:flex-col md:gap-3">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="whitespace-nowrap text-[14px] font-semibold text-[#555] hover:text-[#222]">
              {s.label}
            </a>
          ))}
        </nav>
        <div className="flex w-full max-w-[620px] flex-col gap-8">
          <section id="profile" className="flex scroll-mt-6 flex-col gap-3">
            <p className="text-[18px] font-extrabold">Profile</p>
            <FieldLabel htmlFor="s-name">Display name</FieldLabel>
            <input id="s-name" className={inputCls} value={form.displayName} onChange={(e) => set('displayName', e.target.value)} />
            <FieldLabel htmlFor="s-bio">Bio</FieldLabel>
            <textarea id="s-bio" className={cx(inputCls, 'h-20 resize-none')} maxLength={160} value={form.bio} onChange={(e) => set('bio', e.target.value)} />
            <FieldLabel>Social links</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {form.socialLinks.map((s) => (
                <Chip key={s.label} onClick={() => set('socialLinks', form.socialLinks.filter((x) => x.label !== s.label))}>
                  {s.label} ×
                </Chip>
              ))}
              {['Twitch', 'Reddit', 'Discord', 'YouTube', 'Bluesky']
                .filter((l) => !form.socialLinks.some((s) => s.label === l))
                .map((l) => (
                  <Chip key={l} dashed onClick={() => set('socialLinks', [...form.socialLinks, { label: l, url: '#' }])}>
                    + {l}
                  </Chip>
                ))}
            </div>
            <Note>Your link: {publicUrl(form.handle)} (changing your handle comes with real accounts in pass 2)</Note>
          </section>

          <Divider />

          <section id="display" className="flex scroll-mt-6 flex-col gap-3">
            <p className="text-[18px] font-extrabold">Capsule display</p>
            <p className="text-[13px] font-semibold text-[#555]">Main rating scale (shown on your profile and cards)</p>
            <div className="flex flex-col gap-2">
              {(['stars', 'ten', 'percent', 'none'] as RatingScale[]).map((s) => (
                <label key={s} className="flex cursor-pointer items-center gap-3 text-[14px]">
                  <input type="radio" name="scale" className="accent-[#222]" checked={form.ratingScale === s} onChange={() => set('ratingScale', s)} />
                  {SCALE_LABEL[s]}
                </label>
              ))}
            </div>
            <Note>You can still fill in other scales on any capsule. Rating is always optional.</Note>
            <FieldLabel htmlFor="s-showcase">Showcase size on your profile (10 / 16 / 25)</FieldLabel>
            <select
              id="s-showcase"
              className={cx(inputCls, 'w-[160px]')}
              value={form.showcaseSize}
              onChange={(e) => set('showcaseSize', Number(e.target.value) as ShowcaseSize)}
            >
              {[10, 16, 25].map((n) => (
                <option key={n} value={n}>
                  {n} games
                </option>
              ))}
            </select>
            <Toggle
              label="Let Capsule auto-pick my headline game (you can pin over it)"
              checked={form.autoHeadline}
              onChange={(v) => set('autoHeadline', v)}
            />
            <Note>Top 5 is set manually from your profile.</Note>
          </section>

          <Divider />

          <section id="privacy" className="flex scroll-mt-6 flex-col gap-3">
            <p className="text-[18px] font-extrabold">Privacy</p>
            <Toggle label="Hide dropped games from discovery (default on)" checked={form.hideDroppedFromDiscovery} onChange={(v) => set('hideDroppedFromDiscovery', v)} />
            <FieldLabel htmlFor="s-follow">Who can follow you</FieldLabel>
            <select id="s-follow" className={cx(inputCls, 'w-[200px]')} value={form.whoCanFollow} onChange={(e) => set('whoCanFollow', e.target.value as CapsuleUser['whoCanFollow'])}>
              <option value="anyone">Anyone</option>
              <option value="friends">Mutual friends only</option>
            </select>
          </section>

          <Divider />

          <section id="account" className="flex scroll-mt-6 flex-col items-start gap-3">
            <p className="text-[18px] font-extrabold">Account</p>
            <Note>Prototype controls (real sign-out arrives with Google sign-in in pass 2).</Note>
            <div className="flex flex-wrap gap-3">
              <Btn
                variant="secondary"
                onClick={() => {
                  resetToMockData();
                  navigate('/capsule/u/alex');
                }}
              >
                Reset to sample data
              </Btn>
              <Btn
                variant="secondary"
                onClick={() => {
                  resetAsNewUser();
                  navigate('/capsule');
                }}
              >
                Start over as a new user
              </Btn>
            </div>
          </section>

          <div className="sticky bottom-0 flex justify-end bg-white py-4">
            <Btn
              onClick={() => {
                updateUser(form);
                flash('Saved');
              }}
            >
              Save
            </Btn>
          </div>
        </div>
      </div>
      <Flash msg={msg} />
    </Page>
  );
}
