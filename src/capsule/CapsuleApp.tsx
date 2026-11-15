// Capsule — the rebooted experience, mounted at /capsule/* next to the
// existing Mastery app (see CLAUDE.md). Pass 1: routes + gray-box screens
// on mock data.

import React, { useEffect } from 'react';
import { Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { CapsuleStoreProvider, useCapsuleStore } from './store';
import { CapsuleShell, Btn, Note, Page, TopBar } from './ui';
import { CapsuleLive, Claim, FillTop, GoogleSignIn, Landing, StartCapsule } from './screens/Onboarding';
import { ReviewFlow } from './screens/ReviewFlow';
import { RevealScreen } from './screens/Reveal';
import { AllGames, CapsulePageA1, PublicCapsule, Settings } from './screens/Profile';

/** Every screen in the wireframes, with where it lives. Handy for review. */
const SCREENS: { flow: string; items: [string, string, string][] }[] = [
  {
    flow: 'First-time user (02)',
    items: [
      ['S1', 'Landing', '/capsule'],
      ['S2', 'Google sign-in (mock)', '/capsule/signin'],
      ['S3', 'Claim your Capsule', '/capsule/claim'],
      ['S4', 'Start your Capsule', '/capsule/start'],
      ['S5', 'Fill your favorites (Top 3 / 5 / 10)', '/capsule/favorites'],
      ['S6', 'Your Capsule is live', '/capsule/live'],
    ],
  },
  {
    flow: 'Review a game (03)',
    items: [
      ['R1', 'Pick the game', '/capsule/new/game'],
      ['New', 'Status: where are you with it?', '/capsule/new/status'],
      ['R2', 'Words + tags', '/capsule/new/words'],
      ['R3', 'Score / no-score headline', '/capsule/new/score'],
      ['New', 'Review before the reveal (replaces R4 Extras)', '/capsule/new/review'],
      ['R5–R6', 'Reveal + after the reveal (sample capsule)', '/capsule/reveal/c-ds2'],
      ['R5–R6', 'Reveal, unrated (sample capsule)', '/capsule/reveal/c-hk'],
    ],
  },
  {
    flow: 'Profile and the rest (01)',
    items: [
      ['A1', 'Capsule page', '/capsule/u/alex'],
      ['B', 'All games', '/capsule/u/alex/games'],
      ['F', 'Public capsule (shared link)', '/capsule/u/alex/c-ds2'],
      ['G', 'Share modal (open from F or the reveal)', '/capsule/u/alex/c-ds2'],
      ['H', 'Settings', '/capsule/settings'],
    ],
  },
];

function ScreenIndex() {
  const { resetToMockData, resetAsNewUser, startDraft, user, capsules, onboarded } = useCapsuleStore();
  return (
    <Page className="gap-8">
      <TopBar right={<Note>Prototype screen map</Note>} />
      <div className="flex flex-col gap-2">
        <h1 className="text-[28px] font-extrabold">Capsule · pass 1</h1>
        <p className="text-[14px] text-[#555]">
          Gray-box routes for every wireframe, on mock data. Currently: <b>{user.displayName}</b> ({user.ratingScale} scale), {capsules.length} capsules,{' '}
          {onboarded ? 'onboarded' : 'new user'}.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Btn variant="secondary" onClick={resetToMockData}>
            Reset to sample data
          </Btn>
          <Btn variant="secondary" onClick={resetAsNewUser}>
            Start as a new user
          </Btn>
        </div>
      </div>
      <div className="grid gap-8 md:grid-cols-3">
        {SCREENS.map((s) => (
          <div key={s.flow} className="flex flex-col gap-2">
            <p className="text-[13px] font-bold uppercase tracking-wide text-[#888]">{s.flow}</p>
            {s.items.map(([id, label, to]) => (
              <Link
                key={id + label}
                to={to}
                onClick={() => to.startsWith('/capsule/new/game') && startDraft()}
                className="flex items-baseline gap-3 rounded-lg px-2 py-[6px] text-[14px] hover:bg-[#F6F6F6]"
              >
                <span className="w-12 shrink-0 text-[12px] font-bold text-[#888]">{id}</span>
                <span className="font-semibold">{label}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>
      <Note>Status, R2–R4 need a game picked in R1 first and redirect back if there isn’t one. M1–M3 are these same routes at phone width.</Note>
    </Page>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Signed-in users land on their Capsule; first-timers see the landing page. */
function Home() {
  const { onboarded, user } = useCapsuleStore();
  return onboarded ? <Navigate to={`/capsule/u/${user.handle}`} replace /> : <Landing />;
}

export default function CapsuleApp() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'Capsule';
    return () => {
      document.title = prev;
    };
  }, []);

  return (
    <CapsuleStoreProvider>
      <CapsuleShell>
        <ScrollToTop />
        <Routes>
          <Route index element={<Home />} />
          <Route path="welcome" element={<Landing />} />
          <Route path="screens" element={<ScreenIndex />} />
          <Route path="signin" element={<GoogleSignIn />} />
          <Route path="claim" element={<Claim />} />
          <Route path="start" element={<StartCapsule />} />
          <Route path="favorites" element={<FillTop />} />
          <Route path="live" element={<CapsuleLive />} />
          <Route path="new" element={<Navigate to="/capsule/new/game" replace />} />
          <Route path="new/:step" element={<ReviewFlow />} />
          <Route path="reveal/:capsuleId" element={<RevealScreen />} />
          <Route path="settings" element={<Settings />} />
          <Route path="u/:handle" element={<CapsulePageA1 />} />
          <Route path="u/:handle/games" element={<AllGames />} />
          <Route path="u/:handle/:capsuleId" element={<PublicCapsule />} />
          <Route path="*" element={<Navigate to="/capsule" replace />} />
        </Routes>
      </CapsuleShell>
    </CapsuleStoreProvider>
  );
}
