// First-time user flow — wireframes 02-first-time-user.html, S1–S6.

import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { Game, MOCK_GAMES, POPULAR_PICKS, RatingScale, findGame } from '../data';
import { useCapsuleStore } from '../store';
import { useGameSearch } from '../useGameSearch';
import {
  Avatar,
  Btn,
  Chip,
  Collectible,
  FieldLabel,
  Flash,
  H1,
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

function SignInLink() {
  const { user } = useCapsuleStore();
  return (
    <Link to={`/capsule/u/${user.handle}`} className="text-[13px] font-semibold text-[#555] hover:text-[#222]">
      Already have a Capsule? Sign in
    </Link>
  );
}

const StepCount = ({ n }: { n: number }) => <p className="text-[13px] font-semibold text-[#888]">Step {n} of 3</p>;

// S1 ------------------------------------------------------------------------

export function Landing() {
  return (
    <Page className="min-h-screen gap-14">
      <TopBar right={<SignInLink />} />
      <div className="flex flex-col items-center gap-12 md:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <h1 className="text-[40px] font-extrabold leading-[48px] sm:text-[48px] sm:leading-[58px]">
            Your games.
            <br />
            Your taste.
            <br />
            One link.
          </h1>
          <p className="text-[16px] leading-[22px] text-[#555]">
            Capsule is where you keep the games that made you, and say what you thought of them.
          </p>
          <div className="flex flex-col gap-2">
            <GoogleButton to="/capsule/signin" />
            <Note>One tap. No passwords. More sign-in options later.</Note>
          </div>
        </div>
        <div className="flex flex-col items-center gap-[10px]">
          <div className="flex gap-[14px]">
            <Collectible className="w-[150px]" />
            <Collectible className="w-[150px]" />
          </div>
          <Note>Example Capsule: a friend’s shelf, or the one that shared link came from</Note>
        </div>
      </div>
    </Page>
  );
}

function GoogleButton({ to, onClick }: { to?: string; onClick?: () => void }) {
  const inner = (
    <>
      <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#DADADA] text-[11px] font-bold text-[#555]">G</span>
      <span className="text-[15px] font-semibold leading-5">Continue with Google</span>
    </>
  );
  const cls =
    'flex w-full max-w-[340px] items-center justify-center gap-[10px] rounded-[10px] border-[1.5px] border-[#222] bg-white px-5 py-[13px] hover:bg-[#F6F6F6]';
  return to ? (
    <Link to={to} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" className={cls} onClick={onClick}>
      {inner}
    </button>
  );
}

// S2 ------------------------------------------------------------------------
// Real popup arrives in pass 2 (src/firebase.ts signInWithGoogle). For now the
// Google-hosted chooser is a placeholder with a mock account.

export function GoogleSignIn() {
  const navigate = useNavigate();
  const { resetAsNewUser } = useCapsuleStore();
  return (
    <Page className="min-h-screen gap-10">
      <TopBar right={<SignInLink />} />
      <div className="flex flex-col items-center gap-[14px]">
        <Ph className="h-[360px] w-full max-w-[420px] flex-col gap-4" label={null}>
          <span className="px-6">Google account chooser — opens in a popup / redirect, Google-hosted UI</span>
          <button
            type="button"
            onClick={() => {
              resetAsNewUser();
              navigate('/capsule/claim');
            }}
            className="flex items-center gap-3 rounded-lg border border-[#CFCFCF] bg-white px-4 py-3 text-left hover:border-[#888]"
          >
            <Avatar size={32} />
            <span className="flex flex-col">
              <span className="text-[13px] font-semibold text-[#222]">Alex Rivera</span>
              <span className="text-[12px] text-[#888]">mock account (prototype)</span>
            </span>
          </button>
          <button type="button" onClick={() => navigate('/capsule')} className="text-[12px] font-semibold text-[#777] hover:text-[#222]">
            Cancel
          </button>
        </Ph>
        <p className="text-center text-[15px] font-semibold">Choose an account to continue to Capsule</p>
        <Note>We only ask for name, email and profile photo. Cancel → back to S1 with no error.</Note>
      </div>
    </Page>
  );
}

// S3 ------------------------------------------------------------------------

const TAKEN_HANDLES = ['admin', 'capsule', 'settings', 'u', 'new', 'jess', 'sam'];
const HANDLE_RE = /^[a-z0-9_]{3,20}$/;

export const SCALE_CHOICES: { value: RatingScale; label: string }[] = [
  { value: 'stars', label: '★ Stars' },
  { value: 'ten', label: '1–10' },
  { value: 'percent', label: '%' },
  { value: 'none', label: 'No scores, just words' },
];

export function Claim() {
  const navigate = useNavigate();
  const { user, updateUser } = useCapsuleStore();
  const [name, setName] = useState(user.displayName);
  const [handle, setHandle] = useState(user.handle);
  const [scale, setScale] = useState<RatingScale>(user.ratingScale);

  const handleState = useMemo(() => {
    if (!handle) return { ok: false, msg: 'Pick a handle for your link' };
    if (!HANDLE_RE.test(handle)) return { ok: false, msg: '3–20 characters: letters, numbers, underscores' };
    if (TAKEN_HANDLES.includes(handle)) return { ok: false, msg: `${publicUrl(handle)} is taken` };
    return { ok: true, msg: `${publicUrl(handle)} is yours` };
  }, [handle]);

  return (
    <Page className="min-h-screen gap-7">
      <TopBar right={<StepCount n={1} />} />
      <form
        className="flex flex-col items-center gap-[14px]"
        onSubmit={(e) => {
          e.preventDefault();
          if (!handleState.ok || !name.trim()) return;
          updateUser({ displayName: name.trim(), handle, ratingScale: scale });
          navigate('/capsule/start');
        }}
      >
        <H1 className="text-center">Claim your Capsule</H1>
        <p className="text-center text-[15px] leading-5 text-[#555]">We pulled a few things from Google. Change anything you like.</p>
        <div className="flex items-center gap-4">
          <Avatar size={88} src={user.photoURL} label="photo" />
          <div className="flex flex-col gap-1">
            <p className="text-[13px] font-semibold">Profile photo from Google</p>
            <button type="button" className="text-left text-[13px] font-semibold text-[#555] hover:text-[#222]">
              Change
            </button>
          </div>
        </div>
        <div className="flex w-full max-w-[480px] flex-col gap-[6px]">
          <FieldLabel htmlFor="claim-name">Display name</FieldLabel>
          <input id="claim-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="flex w-full max-w-[480px] flex-col gap-[6px]">
          <FieldLabel htmlFor="claim-handle">Your link (handle)</FieldLabel>
          <div className={cx(inputCls, 'flex items-center gap-1 focus-within:border-[#222]')}>
            <span className="text-[#9A9A9A]">capsule.gg/</span>
            <input
              id="claim-handle"
              className="min-w-0 flex-1 bg-transparent outline-none"
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/\s/g, ''))}
              autoComplete="off"
            />
          </div>
        </div>
        <p className={cx('text-[12px] font-semibold', handleState.ok ? 'text-[#3A7A3A]' : 'text-[#9A3A3A]')}>{handleState.msg}</p>
        <p className="text-[13px] font-semibold text-[#555]">How do you like to rate games?</p>
        <div className="flex flex-wrap justify-center gap-2">
          {SCALE_CHOICES.map((s) => (
            <Chip key={s.value} selected={scale === s.value} onClick={() => setScale(s.value)}>
              {s.label}
            </Chip>
          ))}
        </div>
        <Note>You can change this anytime. Rating is always optional.</Note>
        <Btn type="submit" disabled={!handleState.ok || !name.trim()}>
          Continue →
        </Btn>
      </form>
    </Page>
  );
}

// S4 ------------------------------------------------------------------------

export function StartCapsule() {
  const navigate = useNavigate();
  const { user, startDraft } = useCapsuleStore();
  const first = user.displayName.split(' ')[0];
  return (
    <Page className="min-h-screen gap-7">
      <TopBar right={<StepCount n={2} />} />
      <div className="flex flex-col items-center gap-[18px]">
        <Ph className="h-[190px] w-[140px]" label="empty collectible" />
        <H1 className="text-center">Let’s start your Capsule, {first}</H1>
        <p className="text-center text-[15px] text-[#555]">A place for the games that made you.</p>
        <div className="flex w-full flex-col items-stretch justify-center gap-5 sm:flex-row">
          <Panel className="w-full gap-[10px] p-5 sm:w-[320px]">
            <p className="text-[16px] font-bold leading-[22px]">Review a game I just finished</p>
            <p className="text-[13px] leading-[18px] text-[#555]">Write your first capsule. Takes a minute.</p>
            <Btn
              className="mt-auto"
              onClick={() => {
                startDraft();
                navigate('/capsule/new/game?from=onboarding');
              }}
            >
              Start here
            </Btn>
          </Panel>
          <Panel className="w-full gap-[10px] p-5 sm:w-[320px]">
            <p className="text-[16px] font-bold leading-[22px]">Build my all-time favorites</p>
            <p className="text-[13px] leading-[18px] text-[#555]">Pick a Top 3, 5 or 10 to fill your shelf fast.</p>
            <div className="mt-auto flex gap-[6px]">
              {[3, 5, 10].map((n) => (
                <Chip key={n} onClick={() => navigate(`/capsule/favorites?size=${n}`)}>
                  Top {n}
                </Chip>
              ))}
            </div>
          </Panel>
        </div>
        <Btn variant="quiet" to="/capsule/live">
          Skip for now
        </Btn>
      </div>
    </Page>
  );
}

// S5 ------------------------------------------------------------------------

export function FillTop() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const size = [3, 5, 10].includes(Number(params.get('size'))) ? Number(params.get('size')) : 5;
  // Same screen serves onboarding (S5) and "Edit" on the profile's Top 5.
  const fromProfile = params.get('from') === 'profile';
  const { user, updateUser } = useCapsuleStore();
  const profilePath = `/capsule/u/${user.handle}`;
  const [slots, setSlots] = useState<(Game | null)[]>(() =>
    Array.from({ length: size }, (_, i) => (user.top5[i] ? findGame(user.top5[i]) ?? null : null)),
  );
  const [query, setQuery] = useState('');
  const { results } = useGameSearch(query);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const filled = slots.filter(Boolean).length;

  const add = (g: Game) => {
    setSlots((prev) => {
      if (prev.some((s) => s?.id === g.id)) return prev;
      const i = prev.findIndex((s) => !s);
      if (i === -1) return prev;
      return prev.map((s, j) => (j === i ? g : s));
    });
    setQuery('');
  };
  const remove = (i: number) => setSlots((prev) => prev.map((s, j) => (j === i ? null : s)));
  const move = (from: number, to: number) => {
    if (from === to) return;
    setSlots((prev) => {
      const next = [...prev];
      [next[from], next[to]] = [next[to], next[from]];
      return next;
    });
  };

  const picks = POPULAR_PICKS.map((id) => MOCK_GAMES.find((g) => g.id === id)!).filter(Boolean);

  return (
    <Page className="min-h-screen gap-[18px]">
      <TopBar logoTo={fromProfile ? profilePath : undefined} right={fromProfile ? undefined : <StepCount n={3} />} />
      <div className="flex items-center gap-[14px]">
        <h1 className="text-[28px] font-extrabold leading-[38px]">{fromProfile ? `Edit your Top ${size}` : `Your Top ${size}`}</h1>
        <p className="text-[15px] font-semibold text-[#888]">
          {filled} / {size}
        </p>
      </div>
      <div className={cx('grid gap-[14px]', size === 10 ? 'grid-cols-2 sm:grid-cols-5' : size === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-5')}>
        {slots.map((g, i) => (
          // Plain div on purpose: motion.div treats onDragStart as its own
          // gesture prop and never attaches the native HTML5 handler.
          <div
            key={i}
            draggable={!!g}
            onDragStart={() => setDragFrom(i)}
            onDragEnd={() => setDragFrom(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragFrom != null) move(dragFrom, i);
              setDragFrom(null);
            }}
            className={cx('group relative flex h-[200px] items-center justify-center rounded-md text-center text-[11px] text-[#9A9A9A]', g ? 'cursor-grab bg-[#DDDDDD]' : 'bg-[#ECECEC]')}
          >
            {g ? (
              <motion.span initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="px-2 font-semibold text-[#555]">
                #{i + 1} · {g.title}
              </motion.span>
            ) : (
              <span>#{i + 1} · empty slot</span>
            )}
            {g && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute right-2 top-2 hidden rounded-full bg-white px-2 text-[12px] font-bold text-[#555] group-hover:block"
                aria-label={`Remove ${g.title}`}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <Note>Games drop into slots like cartridges clicking in. Drag to reorder.</Note>
      <div className="relative w-full max-w-[520px]">
        <input className={cx(inputCls, 'py-[10px]')} placeholder="Search for a favorite" value={query} onChange={(e) => setQuery(e.target.value)} />
        {query && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 flex flex-col rounded-xl border border-[#E2E2E2] bg-white p-2 shadow-sm">
            {results.length === 0 && <p className="p-2 text-[12px] text-[#888]">No matches yet…</p>}
            {results.map((g) => (
              <button key={g.id} type="button" onClick={() => add(g)} className="rounded-lg p-2 text-left text-[13px] hover:bg-[#F6F6F6]">
                <span className="font-semibold">{g.title}</span> {g.year && <span className="text-[#888]">· {g.year}</span>}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-[14px] font-bold">Popular picks</p>
      <div className="grid grid-cols-4 gap-[10px] sm:grid-cols-8">
        {picks.map((g) => {
          const used = slots.some((s) => s?.id === g.id);
          return (
            <Ph key={g.id} onClick={used ? undefined : () => add(g)} className={cx('h-[150px]', used && 'opacity-40')} label={g.title} />
          );
        })}
      </div>
      <div className="flex items-center justify-end gap-5">
        <Btn variant="link" to={fromProfile ? profilePath : '/capsule/start'}>
          {fromProfile ? 'Cancel' : 'Back'}
        </Btn>
        <Btn
          onClick={() => {
            const picked = slots.filter(Boolean).map((g) => g!.id);
            // Keep any favorites beyond this list's size (e.g. a Top 10 edited as a Top 5).
            const beyond = user.top5.slice(size).filter((id) => !picked.includes(id));
            updateUser({ top5: [...picked, ...beyond] });
            navigate(fromProfile ? profilePath : '/capsule/live');
          }}
        >
          {fromProfile ? `Save Top ${size}` : 'Finish → see my Capsule'}
        </Btn>
      </div>
    </Page>
  );
}

// S6 ------------------------------------------------------------------------

export function CapsuleLive() {
  const navigate = useNavigate();
  const { user, setOnboarded, startDraft } = useCapsuleStore();
  const [msg, flash] = useFlash();
  const top = Array.from({ length: 5 }, (_, i) => (user.top5[i] ? findGame(user.top5[i]) : undefined));
  const url = publicUrl(user.handle);

  React.useEffect(() => setOnboarded(true), [setOnboarded]);

  return (
    <Page className="min-h-screen gap-10">
      <Note>Last slot fills → shelf ‘powers on’ → camera pulls back to the full Capsule page</Note>
      <div className="flex flex-col items-center gap-[18px]">
        <div className="flex flex-wrap justify-center gap-3">
          {top.map((g, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0.3, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 * i, duration: 0.5, ease: 'easeOut' }}
            >
              <Ph className="h-[150px] w-[108px] sm:h-[210px] sm:w-[150px]" label={g?.title} />
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.6 }} className="flex flex-col items-center gap-[18px]">
          <H1 className="text-center">Your Capsule is live</H1>
          <p className="text-[18px] font-semibold text-[#555]">{url}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Btn
              onClick={() => {
                copyText(`https://${url}`);
                flash('Link copied');
              }}
            >
              Copy my link
            </Btn>
            <Btn
              variant="secondary"
              onClick={() => {
                startDraft();
                navigate('/capsule/new/game');
              }}
            >
              Write my first capsule
            </Btn>
          </div>
          <Btn variant="link" to={`/capsule/u/${user.handle}`}>
            Go to my Capsule →
          </Btn>
        </motion.div>
      </div>
      <Flash msg={msg} />
    </Page>
  );
}
