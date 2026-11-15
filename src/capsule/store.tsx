// In-memory prototype store (persisted to localStorage so a refresh keeps
// your place). Pass 2/3 replace this with AuthContext + Firestore.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Capsule,
  CapsuleStatus,
  CapsuleUser,
  Game,
  MOCK_CAPSULES,
  MOCK_UID,
  MOCK_USER,
  Rating,
  newId,
} from './data';

export interface Draft {
  editingId?: string; // set when editing an existing capsule
  game?: Game;
  /** Unset until the user answers "Where are you with it?" on the Words step. */
  status?: CapsuleStatus;
  text: string;
  noScore: boolean; // R3b path
  /** Set once the user explicitly picks the score or headline path in R3. */
  scoreChoice?: 'score' | 'headline';
  /** Date shown on the game chip: the capsule's own date when editing. */
  createdAt?: number;
  rating: Rating;
  headline: string;
  verdict: string;
  tags: string[];
  /** Optional; drafts saved before these existed won't have them. */
  hoursPlayed?: string;
  difficulty?: string;
}

export const emptyDraft = (): Draft => ({
  text: '',
  noScore: false,
  rating: {},
  headline: '',
  verdict: '',
  tags: [],
});

interface State {
  user: CapsuleUser;
  capsules: Capsule[];
  draft: Draft;
  /** Set once the user has been through S1–S6 at least once. */
  onboarded: boolean;
}

interface Store extends State {
  updateUser: (patch: Partial<CapsuleUser>) => void;
  updateDraft: (patch: Partial<Draft>) => void;
  startDraft: (from?: Partial<Draft>) => void;
  editCapsule: (id: string) => void;
  /** Saves the draft as a capsule; returns its id and whether it was the user's first. */
  publishDraft: () => { id: string; isFirst: boolean };
  /** Clears the draft once its capsule has been revealed, so a later pick in R1 starts a new capsule. */
  releaseDraft: (capsuleId: string) => void;
  setOnboarded: (v: boolean) => void;
  /** Starts the first-time flow with an empty Capsule (no mock capsules). */
  resetAsNewUser: () => void;
  resetToMockData: () => void;
  lastSavedAt: number | null;
}

const KEY = 'capsule-prototype-v1';

const initialMock = (): State => ({
  user: MOCK_USER,
  capsules: MOCK_CAPSULES,
  draft: emptyDraft(),
  onboarded: true,
});

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...initialMock(), ...JSON.parse(raw) };
  } catch {
    /* storage blocked or corrupt: fall back to mock */
  }
  return initialMock();
}

const Ctx = createContext<Store | null>(null);

export function CapsuleStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(load);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const first = useRef(true);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
    if (first.current) {
      first.current = false;
      return;
    }
    setLastSavedAt(Date.now());
  }, [state]);

  const updateUser = useCallback((patch: Partial<CapsuleUser>) => {
    setState((s) => ({ ...s, user: { ...s.user, ...patch } }));
  }, []);

  const updateDraft = useCallback((patch: Partial<Draft>) => {
    setState((s) => ({ ...s, draft: { ...s.draft, ...patch } }));
  }, []);

  const startDraft = useCallback((from?: Partial<Draft>) => {
    setState((s) => ({ ...s, draft: { ...emptyDraft(), ...from } }));
  }, []);

  const editCapsule = useCallback((id: string) => {
    setState((s) => {
      const c = s.capsules.find((x) => x.id === id);
      if (!c) return s;
      const draft: Draft = {
        editingId: c.id,
        game: { id: c.gameId, title: c.gameTitle, coverUrl: c.coverUrl },
        status: c.status,
        text: c.text,
        noScore: !c.rating && !!c.headline,
        scoreChoice: c.rating ? 'score' : c.headline ? 'headline' : undefined,
        createdAt: c.createdAt,
        rating: c.rating ?? {},
        headline: c.headline ?? '',
        verdict: c.verdict ?? '',
        tags: c.tags,
        hoursPlayed: c.hoursPlayed,
        difficulty: c.difficulty,
      };
      return { ...s, draft };
    });
  }, []);

  const publishDraft = useCallback(() => {
    // Computed from the latest state (not inside a setState updater) so the
    // caller can navigate to the new capsule straight away.
    const s = stateRef.current;
    {
      const d = s.draft;
      const now = Date.now();
      const existing = d.editingId ? s.capsules.find((c) => c.id === d.editingId) : undefined;
      const hasRating = !d.noScore && Object.values(d.rating).some((v) => v != null);
      const capsule: Capsule = {
        id: existing?.id ?? newId(),
        uid: MOCK_UID,
        gameId: d.game?.id ?? 'unknown',
        gameTitle: d.game?.title ?? 'Untitled game',
        coverUrl: d.game?.coverUrl,
        status: d.status ?? 'finished',
        text: d.text.trim(),
        rating: hasRating ? d.rating : undefined,
        headline: d.headline.trim() || undefined,
        verdict: d.verdict.trim() || undefined,
        tags: d.tags,
        hoursPlayed: d.hoursPlayed?.trim() || undefined,
        difficulty: d.difficulty?.trim() || undefined,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        likeCount: existing?.likeCount ?? 0,
      };
      const capsules = existing
        ? s.capsules.map((c) => (c.id === existing.id ? capsule : c))
        : [capsule, ...s.capsules];
      // The draft isn't cleared here: react-router runs navigation as a
      // transition, so an empty draft would render first and the review-flow
      // guards would redirect to R1. The reveal screen releases it on mount
      // (releaseDraft); until then it points at the saved capsule.
      const next = { ...s, capsules, draft: { ...d, editingId: capsule.id } };
      stateRef.current = next;
      setState(next);
      return { id: capsule.id, isFirst: !existing && s.capsules.length === 0 };
    }
  }, []);

  const releaseDraft = useCallback((capsuleId: string) => {
    setState((s) => (s.draft.editingId === capsuleId ? { ...s, draft: emptyDraft() } : s));
  }, []);

  const setOnboarded = useCallback((v: boolean) => setState((s) => ({ ...s, onboarded: v })), []);

  const resetAsNewUser = useCallback(() => {
    setState({
      user: {
        ...MOCK_USER,
        bio: '',
        socialLinks: [],
        top5: [],
        headlineGameId: undefined,
        headlinePinned: false,
        stats: { games: 0, followers: 0, friends: 0 },
      },
      capsules: [],
      draft: emptyDraft(),
      onboarded: false,
    });
  }, []);

  const resetToMockData = useCallback(() => setState(initialMock()), []);

  const value = useMemo<Store>(
    () => ({
      ...state,
      updateUser,
      updateDraft,
      startDraft,
      editCapsule,
      publishDraft,
      releaseDraft,
      setOnboarded,
      resetAsNewUser,
      resetToMockData,
      lastSavedAt,
    }),
    [state, updateUser, updateDraft, startDraft, editCapsule, publishDraft, releaseDraft, setOnboarded, resetAsNewUser, resetToMockData, lastSavedAt],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCapsuleStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCapsuleStore must be used inside CapsuleStoreProvider');
  return v;
}

/**
 * Headline game: the pinned one if set; otherwise the most recent capsule,
 * unless the user switched auto-pick off in Settings (then none).
 */
export function useHeadlineCapsule(): Capsule | undefined {
  const { user, capsules } = useCapsuleStore();
  return useMemo(() => {
    if (user.headlinePinned && user.headlineGameId) {
      const pinned = capsules.find((c) => c.gameId === user.headlineGameId);
      if (pinned) return pinned;
    }
    if (!user.autoHeadline) return undefined;
    return [...capsules].sort((a, b) => b.updatedAt - a.updatedAt)[0];
  }, [user.headlinePinned, user.headlineGameId, user.autoHeadline, capsules]);
}
