// Review a game, modal version (experiment). Same draft, same fields and the
// same reveal as the page flow in ReviewFlow.tsx, but it all happens in one
// modal opened over the profile. The shell follows Mastery's game modals
// (GameSearchModal's search + details panel, GameCompletionModal's form):
// search header, cover on the left, details on the right, actions in a footer.
//
// Steps: Game (search → details + status) → Words (+ tags) → Score → Review.
// Status is picked on the details panel, so "mark it finished" and "review it"
// are one continuous flow.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Search, X } from 'lucide-react';
import { auth } from '../../firebase';
import { CapsuleStatus, Game, MOCK_GAMES, RECENTLY_PLAYED, STATUS_LABEL, formatDate } from '../data';
import { useCapsuleStore, useHeadlineCapsule } from '../store';
import { useGameSearch } from '../useGameSearch';
import { Btn, CoverThumb, Note, Ph, cx } from '../ui';
import { CapsulePageA1 } from './Profile';
import {
  HeadlineFields,
  ReviewSummary,
  STATUS_CHOICES,
  ScoreFields,
  StatusRow,
  WordsFields,
  useDefaultScorePath,
  usePublishAndReveal,
} from './ReviewFlow';

type Step = 'search' | 'details' | 'words' | 'score' | 'review';

const STEP_LABELS = ['Game', 'Words', 'Score', 'Review'];
const STEP_INDEX: Record<Step, number> = { search: 0, details: 0, words: 1, score: 2, review: 3 };

const EASE = [0.16, 1, 0.3, 1] as const;

// Game details -----------------------------------------------------------------
// Mock games only carry a title, year and studio. Games that came from IGDB
// search can load the fuller record the Mastery details panel shows.

interface IgdbDetails {
  summary?: string;
  first_release_date?: number;
  involved_companies?: { developer?: boolean; publisher?: boolean; company: { name: string } }[];
}

function useGameDetails(game?: Game) {
  const [details, setDetails] = useState<IgdbDetails | null>(null);
  const id = game?.id;
  useEffect(() => {
    setDetails(null);
    const igdbId = id?.match(/^igdb-(\d+)$/)?.[1];
    const fbUser = auth.currentUser;
    if (!igdbId || !fbUser) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await fbUser.getIdToken();
        const res = await fetch(`/api/games/${igdbId}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok && !cancelled) setDetails(await res.json());
      } catch {
        /* offline: the basic info stands */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);
  return details;
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999]">{label}</p>
      <p className="text-[13px] text-[#444]">{children}</p>
    </div>
  );
}

function BigCover({ game }: { game: Game }) {
  if (game.coverUrl) return <img src={game.coverUrl} alt="" className="aspect-[264/374] w-full rounded-md bg-[#ECECEC] object-cover grayscale" />;
  return <Ph className="aspect-[264/374] w-full" label={<>cover<br />{game.title}</>} />;
}

// Shell --------------------------------------------------------------------------

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-[10px]">
      {STEP_LABELS.map((label, i) => (
        <span
          key={label}
          className={cx(
            'text-[12px] leading-4',
            i === current ? 'rounded-full bg-[#222] px-[10px] py-[5px] font-semibold text-white' : i < current ? 'font-semibold text-[#555]' : 'font-medium text-[#AAA]',
          )}
        >
          {i < current ? '✓' : i + 1}
          <span className={cx(i !== current && 'hidden sm:inline')}> {label}</span>
        </span>
      ))}
    </div>
  );
}

function SavedIndicator() {
  const { lastSavedAt } = useCapsuleStore();
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (!lastSavedAt) return;
    setSaving(true);
    const t = window.setTimeout(() => setSaving(false), 600);
    return () => window.clearTimeout(t);
  }, [lastSavedAt]);
  return <p className="hidden text-[12px] font-medium text-[#8A8A8A] sm:block">{saving ? 'Saving…' : 'Saved'}</p>;
}

/** Cover on the left (the sealed capsule on the last step), the step's content on the right. */
function TwoCol({ game, sealed, children }: { game: Game; sealed?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
      <div className="hidden w-40 shrink-0 self-start sm:block">
        {sealed ? (
          <motion.div animate={{ scale: [1, 1.015, 1] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}>
            <Ph className="aspect-[264/374] w-full" label={<>your capsule<br />sealed until you create it</>} />
          </motion.div>
        ) : (
          <BigCover game={game} />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}

const Heading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-[24px] font-extrabold leading-[30px] tracking-[-0.01em]">{children}</h2>
);

// The modal -----------------------------------------------------------------------

export function ReviewModal({ onClose }: { onClose: () => void }) {
  const { draft, capsules, updateDraft, editCapsule } = useCapsuleStore();
  const headline = useHeadlineCapsule();
  const reveal = usePublishAndReveal();

  const [stepState, setStep] = useState<Step>(() => (draft.editingId ? 'words' : draft.game ? 'details' : 'search'));
  // Without a game there is nothing to show past the search.
  const step: Step = draft.game ? stepState : 'search';
  /** Set when a step was opened from an Edit link on the Review step. */
  const [returning, setReturning] = useState(false);
  const [query, setQuery] = useState('');
  const { results, loading } = useGameSearch(query);
  const details = useGameDetails(draft.game);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(timer.current);
    };
  }, [onClose]);

  const suggestions = useMemo(() => {
    const ids = [headline?.gameId, ...RECENTLY_PLAYED].filter(Boolean) as string[];
    return Array.from(new Set(ids))
      .map((id) => MOCK_GAMES.find((g) => g.id === id))
      .filter(Boolean) as Game[];
  }, [headline]);
  const list = query.trim() ? results : suggestions;

  const go = (next: Step) => {
    window.clearTimeout(timer.current);
    setStep(next);
  };
  /** Forward from a step: back to Review if that's where the Edit link came from. */
  const onward = (next: Step) => {
    go(returning ? 'review' : next);
    setReturning(false);
  };
  const editFromReview = (target: Step) => ({
    onClick: () => {
      setReturning(true);
      go(target);
    },
  });

  const pickGame = (g: Game) => {
    updateDraft({ game: g });
    go('details');
  };

  const chooseStatus = (status: CapsuleStatus) => {
    updateDraft({ status });
    // Short beat so the selection registers, then on to writing.
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onward('words'), 280);
  };

  const game = draft.game;
  const hasText = !!draft.text.trim();
  const existing = game && !draft.editingId ? capsules.find((c) => c.gameId === game.id) : undefined;
  const developer = details?.involved_companies?.find((c) => c.developer)?.company.name ?? game?.studio;
  const publisher = details?.involved_companies?.find((c) => c.publisher)?.company.name;
  const released = details?.first_release_date
    ? new Date(details.first_release_date * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : game?.year;

  let body: React.ReactNode;
  let footer: React.ReactNode = null;

  if (step === 'search' || !game) {
    body = (
      <div className="flex flex-col gap-[6px]">
        {!query.trim() && <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[#999]">Recently played</p>}
        {list.length === 0 && <p className="p-2 text-[12px] text-[#888]">{loading ? 'Searching…' : 'No matches. Try another name.'}</p>}
        {list.map((g, i) => (
          <button
            key={g.id}
            type="button"
            onClick={() => pickGame(g)}
            className={cx(
              'flex items-center gap-3 rounded-lg p-1 text-left transition-colors',
              game?.id === g.id ? 'bg-[#EFEFEF] ring-[1.5px] ring-[#222]' : 'hover:bg-[#F6F6F6]',
            )}
          >
            <CoverThumb src={g.coverUrl} />
            <div className="flex flex-col gap-[2px]">
              <p className="text-[15px] font-bold leading-5">{g.title}</p>
              <p className="text-[12px] font-medium text-[#888]">
                {[g.year, g.studio, !query.trim() && i === 0 && headline?.gameId === g.id ? 'your headline game' : null].filter(Boolean).join(' · ')}
              </p>
            </div>
          </button>
        ))}
        <Note className="px-1 pt-2">Pick a game to see its details and start your capsule.</Note>
      </div>
    );
  } else if (step === 'details') {
    body = (
      <TwoCol game={game}>
        <Heading>{game.title}</Heading>
        <div className="mt-3 flex flex-col gap-4 rounded-xl border border-[#E2E2E2] p-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <Meta label="Developer">{developer ?? 'Unknown'}</Meta>
            <Meta label="Released">{released ?? 'Unknown'}</Meta>
            {publisher && <Meta label="Publisher">{publisher}</Meta>}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#999]">About this game</p>
            <p className="line-clamp-4 text-[13px] leading-[19px] text-[#555]">{details?.summary ?? 'No description for this one in the prototype yet.'}</p>
          </div>
        </div>
        {existing && (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F6F6F6] px-4 py-3">
            <p className="text-[13px] text-[#555]">
              You capsuled this on {formatDate(existing.createdAt, true)} ({STATUS_LABEL[existing.status]}).
            </p>
            <Btn
              variant="link"
              onClick={() => {
                editCapsule(existing.id);
                go('words');
              }}
            >
              Edit that capsule →
            </Btn>
          </div>
        )}
        <p className="mt-5 text-[15px] font-bold">Where are you with it?</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row" role="radiogroup" aria-label="Where are you with it?">
          {STATUS_CHOICES.map((c) => {
            const selected = draft.status === c.value;
            return (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => chooseStatus(c.value)}
                className={cx(
                  'flex flex-1 flex-col gap-1 rounded-xl border-[1.5px] p-3 text-left transition-colors',
                  selected ? 'border-[#222] bg-[#222] text-white' : 'border-[#E2E2E2] bg-[#F6F6F6] hover:border-[#999]',
                )}
              >
                <span className="text-[14px] font-bold leading-5">{c.label}</span>
                <span className={cx('text-[12px] leading-4', selected ? 'text-[#CCC]' : 'text-[#666]')}>{c.hint}</span>
              </button>
            );
          })}
        </div>
      </TwoCol>
    );
    footer = (
      <>
        <Btn variant="link" onClick={() => go('search')}>
          ← Pick another game
        </Btn>
        <Btn disabled={!draft.status} onClick={() => onward('words')}>
          {returning ? 'Back to review →' : 'Next: write →'}
        </Btn>
      </>
    );
  } else if (step === 'words') {
    body = (
      <TwoCol game={game}>
        <div className="flex flex-col items-center gap-3">
          <Heading>So… how was {game.title}?</Heading>
          <StatusRow value={draft.status} onChange={(status) => updateDraft({ status })} />
          <WordsFields textareaClassName="h-[170px]" />
        </div>
      </TwoCol>
    );
    footer = (
      <>
        <Btn variant="link" onClick={() => go('details')}>
          ← Back
        </Btn>
        {returning ? (
          <Btn disabled={!hasText} onClick={() => onward('review')}>
            Back to review →
          </Btn>
        ) : (
          <div className="flex items-center gap-[18px]">
            <Btn variant="quiet" disabled={!hasText} onClick={() => go('review')}>
              Skip score
            </Btn>
            <Btn disabled={!hasText} onClick={() => go('score')}>
              Next: score →
            </Btn>
          </div>
        )}
      </>
    );
  } else if (step === 'score') {
    body = (
      <TwoCol game={game}>
        <ScoreStep />
      </TwoCol>
    );
    footer = (
      <>
        <Btn variant="link" onClick={() => go('words')}>
          ← Back
        </Btn>
        <Btn onClick={() => onward('review')}>{returning ? 'Back to review →' : 'Next: review →'}</Btn>
      </>
    );
  } else {
    body = (
      <TwoCol game={game} sealed>
        <div className="flex flex-col gap-4">
          <Heading>Look it over</Heading>
          <ReviewSummary edit={(s) => editFromReview(s === 'status' ? 'details' : s)} />
        </div>
      </TwoCol>
    );
    footer = (
      <>
        <Btn variant="link" onClick={() => go('score')}>
          ← Back
        </Btn>
        <Btn onClick={reveal}>{draft.editingId ? 'Save & replay reveal ✦' : 'Create my capsule ✦'}</Btn>
      </>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: EASE }}
        onClick={onClose}
        className="fixed inset-0 z-[100] bg-[#222]/40 backdrop-blur-[6px]"
      />
      <div className="pointer-events-none fixed inset-0 z-[101] flex items-start justify-center px-4 pt-[7vh] sm:px-6">
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Review a game"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="pointer-events-auto relative flex max-h-[86vh] w-full max-w-[800px] flex-col overflow-hidden rounded-2xl border border-[#E2E2E2] bg-white shadow-2xl"
        >
          <div className="flex items-center gap-3 border-b border-[#E2E2E2] p-4">
            {step === 'search' ? (
              <>
                <Search className="ml-2 h-5 w-5 shrink-0 text-[#999]" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What are you capsuling? Search any game"
                  className="flex-1 bg-transparent text-[17px] text-[#222] outline-none placeholder:text-[#9A9A9A]"
                />
              </>
            ) : (
              <div className="flex flex-1 items-center justify-between gap-3 pl-2">
                <Stepper current={STEP_INDEX[step]} />
                <SavedIndicator />
              </div>
            )}
            <button type="button" onClick={onClose} title="Close. Your draft is kept" aria-label="Close" className="shrink-0 rounded-lg p-2 transition-colors hover:bg-[#F0F0F0]">
              <X className="h-5 w-5 text-[#777]" />
            </button>
          </div>

          <div className="min-h-[380px] flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarGutter: 'stable' }}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="mx-auto w-full max-w-[720px] p-5"
              >
                {body}
              </motion.div>
            </AnimatePresence>
          </div>

          {footer && <div className="flex items-center justify-between gap-3 border-t border-[#E2E2E2] px-5 py-4">{footer}</div>}
        </motion.div>
      </div>
    </>
  );
}

function ScoreStep() {
  const { draft } = useCapsuleStore();
  useDefaultScorePath();
  return (
    <div className="flex flex-col items-center gap-4">
      <Heading>{draft.noScore ? 'Say it in a line instead' : 'Want to put a number on it?'}</Heading>
      {draft.noScore ? <HeadlineFields /> : <ScoreFields />}
    </div>
  );
}

/** /capsule/u/:handle/review — the owner's Capsule page with the review modal open over it. */
export function ReviewModalRoute() {
  const { handle } = useParams();
  const navigate = useNavigate();
  const { user } = useCapsuleStore();
  const onClose = React.useCallback(() => navigate(`/capsule/u/${user.handle}`), [navigate, user.handle]);
  if (handle !== user.handle) return <Navigate to={`/capsule/u/${user.handle}/review`} replace />;
  return (
    <>
      <CapsulePageA1 />
      <ReviewModal onClose={onClose} />
    </>
  );
}
