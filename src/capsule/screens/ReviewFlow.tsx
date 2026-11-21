// Review a game — wireframes 03-review-flow.html (R1–R4), reworked:
// Game → Status → Words (+ tags) → Score → Review → reveal.
// Status and Words are required. The Review step replaces R4 Extras.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  CapsuleStatus,
  Game,
  MOCK_GAMES,
  RECENTLY_PLAYED,
  RatingScale,
  STATUS_LABEL,
  TEXT_LIMIT_RATED,
  TEXT_LIMIT_UNRATED,
  VERDICT_PRESETS,
  WRITING_PROMPTS,
  formatDate,
  scoreSentence,
  suggestTagsLocally,
} from '../data';
import { useCapsuleStore, useHeadlineCapsule } from '../store';
import { useGameSearch } from '../useGameSearch';
import { Btn, Chip, CoverThumb, FieldLabel, H1, Logo, Note, Page, Ph, cx, inputCls } from '../ui';

const STEPS = [
  { key: 'game', label: 'Game' },
  { key: 'status', label: 'Status' },
  { key: 'words', label: 'Words' },
  { key: 'score', label: 'Score' },
  { key: 'review', label: 'Review' },
] as const;
type StepKey = (typeof STEPS)[number]['key'];

// Shell ---------------------------------------------------------------------

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-[6px] sm:gap-[10px]">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.key}>
          {i > 0 && <div className="hidden h-px w-7 bg-[#D5D5D5] sm:block" />}
          {i === current ? (
            <span className="rounded-full bg-[#222] px-[10px] py-[5px] text-[12px] font-semibold leading-4 text-white">
              {i + 1} {s.label}
            </span>
          ) : i < current ? (
            <span className="text-[13px] font-semibold text-[#555]">
              ✓<span className="hidden sm:inline"> {s.label}</span>
            </span>
          ) : (
            <span className="text-[13px] font-medium text-[#AAA]">
              {i + 1}
              <span className="hidden sm:inline"> {s.label}</span>
            </span>
          )}
        </React.Fragment>
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

function FlowShell({
  step,
  children,
  footer,
}: {
  step: number;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const { user } = useCapsuleStore();
  const navigate = useNavigate();
  return (
    <Page className="min-h-screen justify-between gap-7">
      <div className="flex items-center justify-between gap-3">
        <div className="hidden sm:block">
          <Logo to={`/capsule/u/${user.handle}`} />
        </div>
        <Stepper current={step} />
        <div className="flex items-center gap-3">
          <SavedIndicator />
          <button
            type="button"
            onClick={() => navigate(`/capsule/u/${user.handle}`)}
            className="rounded-lg border-[1.5px] border-[#CFCFCF] bg-white px-[14px] py-2 text-[13px] font-semibold hover:border-[#999]"
            title="Your draft is kept"
          >
            ×<span className="hidden sm:inline">&nbsp; Close</span>
          </button>
        </div>
      </div>
      <div className="flex flex-1 flex-col">{children}</div>
      <div className="flex items-center justify-between gap-3">{footer}</div>
    </Page>
  );
}

function GameChip({ game, status, date, className }: { game: Game; status?: CapsuleStatus; date?: number; className?: string }) {
  return (
    <div className={cx('flex items-center gap-3', className)}>
      <CoverThumb src={game.coverUrl} />
      <div className="flex flex-col gap-[2px]">
        <p className="text-[15px] font-bold leading-5">{game.title}</p>
        <p className="text-[12px] font-medium text-[#888]">
          {[status && STATUS_LABEL[status], formatDate(date ?? Date.now())].filter(Boolean).join(' · ')}
        </p>
      </div>
    </div>
  );
}

// Router for /capsule/new/:step ----------------------------------------------

export function ReviewFlow() {
  const { step = 'game' } = useParams();
  const { draft } = useCapsuleStore();
  const idx = STEPS.findIndex((s) => s.key === step);
  if (idx === -1) return <Navigate to="/capsule/new/game" replace />;
  if (idx > 0 && !draft.game) return <Navigate to="/capsule/new/game" replace />;
  if (idx > 1 && !draft.status) return <Navigate to="/capsule/new/status" replace />;
  if (idx > 2 && !draft.text.trim()) return <Navigate to="/capsule/new/words" replace />;
  const key = step as StepKey;
  if (key === 'game') return <StepGame />;
  if (key === 'status') return <StepStatus />;
  if (key === 'words') return <StepWords />;
  if (key === 'score') return <StepScore />;
  return <StepReview />;
}

/** True when a step was opened from an Edit link on the Review step. */
function useReturnToReview() {
  const [params] = useSearchParams();
  return params.get('return') === 'review';
}

function usePublishAndReveal() {
  const navigate = useNavigate();
  const { publishDraft } = useCapsuleStore();
  const busy = useRef(false);
  return () => {
    if (busy.current) return;
    busy.current = true;
    const { id, isFirst } = publishDraft();
    navigate(`/capsule/reveal/${id}${isFirst ? '?first=1' : ''}`);
  };
}

// R1 · Pick the game ----------------------------------------------------------

function StepGame() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { draft, updateDraft } = useCapsuleStore();
  const headline = useHeadlineCapsule();
  const [query, setQuery] = useState('');
  const { results, loading } = useGameSearch(query);

  const suggestions = useMemo(() => {
    const ids = [headline?.gameId, ...RECENTLY_PLAYED].filter(Boolean) as string[];
    return Array.from(new Set(ids))
      .map((id) => MOCK_GAMES.find((g) => g.id === id))
      .filter(Boolean) as Game[];
  }, [headline]);

  const list = query.trim() ? results : suggestions;

  return (
    <FlowShell
      step={0}
      footer={
        <>
          {params.get('from') === 'onboarding' ? (
            <Btn variant="link" to="/capsule/start">
              ← Back
            </Btn>
          ) : (
            <div />
          )}
          <Btn disabled={!draft.game} onClick={() => navigate('/capsule/new/status')}>
            Next: status →
          </Btn>
        </>
      }
    >
      <div className="flex flex-col items-center gap-4">
        <H1 className="text-center">What are you capsuling?</H1>
        <input
          autoFocus
          className={cx(inputCls, 'max-w-[640px]')}
          placeholder="Search any game"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex w-full max-w-[640px] flex-col gap-[6px] rounded-xl border border-[#E2E2E2] p-3">
          {!query.trim() && <p className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[#999]">Recently played</p>}
          {list.length === 0 && <p className="p-2 text-[12px] text-[#888]">{loading ? 'Searching…' : 'No matches. Try another name.'}</p>}
          {list.map((g, i) => {
            const selected = draft.game?.id === g.id;
            return (
              <button
                key={g.id}
                type="button"
                onClick={() => updateDraft({ game: g })}
                className={cx('flex items-center gap-3 rounded-lg p-1 text-left transition-colors', selected ? 'bg-[#EFEFEF] ring-[1.5px] ring-[#222]' : 'hover:bg-[#F6F6F6]')}
              >
                <CoverThumb src={g.coverUrl} />
                <div className="flex flex-col gap-[2px]">
                  <p className="text-[15px] font-bold leading-5">{g.title}</p>
                  <p className="text-[12px] font-medium text-[#888]">
                    {[g.year, g.studio, !query.trim() && i === 0 && headline?.gameId === g.id ? 'your headline game' : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
        <Note>Your headline game is suggested first. Empty search shows recently played.</Note>
      </div>
    </FlowShell>
  );
}

// Status (new, between R1 and R2; not in the wireframes) -------------------------

const STATUS_CHOICES: { value: CapsuleStatus; label: string; hint: string }[] = [
  { value: 'finished', label: 'Finished it', hint: 'Rolled credits, or as done as you’ll get.' },
  { value: 'dropped', label: 'Dropped it', hint: 'Stays on your Capsule, left out of discovery.' },
  { value: 'favorite', label: 'All-time favorite', hint: 'One of the games that made you.' },
];

function StepStatus() {
  const navigate = useNavigate();
  const returning = useReturnToReview();
  const next = returning ? '/capsule/new/review' : '/capsule/new/words';
  const { draft, updateDraft } = useCapsuleStore();
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const choose = (status: CapsuleStatus) => {
    updateDraft({ status });
    // Short beat so the selection registers, then on to writing.
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => navigate(next), 280);
  };

  return (
    <FlowShell
      step={1}
      footer={
        <>
          <Btn variant="link" to="/capsule/new/game">
            ← Back
          </Btn>
          <Btn disabled={!draft.status} onClick={() => navigate(next)}>
            {returning ? 'Back to review →' : 'Next: write →'}
          </Btn>
        </>
      }
    >
      <div className="flex flex-col items-center gap-5">
        <GameChip game={draft.game!} status={draft.status} date={draft.createdAt} />
        <H1 className="text-center">Where are you with it?</H1>
        <div className="flex w-full max-w-[720px] flex-col gap-3 sm:flex-row" role="radiogroup" aria-label="Where are you with it?">
          {STATUS_CHOICES.map((c) => {
            const selected = draft.status === c.value;
            return (
              <button
                key={c.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => choose(c.value)}
                className={cx(
                  'flex flex-1 flex-col gap-1 rounded-xl border-[1.5px] p-5 text-left transition-colors',
                  selected ? 'border-[#222] bg-[#222] text-white' : 'border-[#E2E2E2] bg-[#F6F6F6] hover:border-[#999]',
                )}
              >
                <span className="text-[16px] font-bold leading-[22px]">{c.label}</span>
                <span className={cx('text-[13px] leading-[18px]', selected ? 'text-[#CCC]' : 'text-[#666]')}>{c.hint}</span>
              </button>
            );
          })}
        </div>
        <Note>This only sets the label on your capsule. You can change it while you write.</Note>
      </div>
    </FlowShell>
  );
}

// R2 · Words + tags ----------------------------------------------------------------
// Highs/lows, favorite moment and the "nudges" were cut for now: the review
// is your words plus tags. A templated "workspace" of questions is still being
// explored (Paper page "R2 · Two workspaces (explore)").

/** Compact status row on the Words step: the choice from the Status step, still editable. */
function StatusRow({ value, onChange }: { value?: CapsuleStatus; onChange: (s: CapsuleStatus) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2" role="radiogroup" aria-label="Where you are with it">
      <span className="mr-1 text-[12px] font-semibold uppercase tracking-wide text-[#888]">Status</span>
      {STATUS_CHOICES.map((c) => (
        <Chip key={c.value} selected={value === c.value} onClick={() => onChange(c.value)}>
          {c.label}
        </Chip>
      ))}
    </div>
  );
}

/** Tags picked up from the words as you write, plus your own. Sits under the text, centered. */
function TagsPanel() {
  const { draft, updateDraft } = useCapsuleStore();
  const [custom, setCustom] = useState('');
  const [adding, setAdding] = useState(false);
  const suggested = useMemo(() => suggestTagsLocally(draft.text), [draft.text]);
  const all = Array.from(new Set([...draft.tags, ...suggested]));
  const toggle = (t: string) => updateDraft({ tags: draft.tags.includes(t) ? draft.tags.filter((x) => x !== t) : [...draft.tags, t] });

  return (
    <section className="flex w-full flex-col items-center gap-2 border-t border-[#EFEFEF] pt-5">
      <p className="text-[13px] font-bold">Tags</p>
      <div className="flex min-h-[26px] flex-wrap items-center justify-center gap-[6px]">
        {all.length === 0 && <span className="text-[12px] text-[#AAA]">Nothing yet</span>}
        {all.map((t) => (
          <Chip key={t} dashed={!draft.tags.includes(t)} selected={draft.tags.includes(t)} onClick={() => toggle(t)}>
            {t}
          </Chip>
        ))}
        {adding ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const t = custom.trim().toLowerCase();
              if (t && !draft.tags.includes(t)) updateDraft({ tags: [...draft.tags, t] });
              setCustom('');
              setAdding(false);
            }}
          >
            <input
              autoFocus
              className="w-[110px] rounded-full border-[1.5px] border-[#222] bg-white px-3 py-1 text-[12px] outline-none"
              placeholder="tag"
              maxLength={24}
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onBlur={() => setAdding(false)}
            />
          </form>
        ) : (
          <Chip dashed onClick={() => setAdding(true)}>
            + custom
          </Chip>
        )}
      </div>
    </section>
  );
}

const PROMPTS_PER_SET = 3;
const PROMPT_ROTATE_MS = 8000;

/**
 * Writing prompts in the empty review box: three at a time. Every 8s the set
 * eases out to the left and the next eases in from the right, the three chips
 * slightly staggered so the row settles as one soft motion. Pauses while
 * hovered so a chip doesn't move out from under the pointer.
 */
function PromptCarousel({ onPick }: { onPick: (prompt: string) => void }) {
  const sets = useMemo(() => {
    const out: string[][] = [];
    for (let i = 0; i < WRITING_PROMPTS.length; i += PROMPTS_PER_SET) out.push(WRITING_PROMPTS.slice(i, i + PROMPTS_PER_SET));
    return out;
  }, []);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (paused || sets.length < 2) return;
    const t = window.setInterval(() => setIndex((i) => (i + 1) % sets.length), PROMPT_ROTATE_MS);
    return () => window.clearInterval(t);
  }, [paused, sets.length]);

  const shift = reduceMotion ? 0 : 12;
  const ease = [0.22, 1, 0.36, 1] as const; // soft ease-out
  const row = {
    enter: { transition: { staggerChildren: 0.08 } },
    exit: { transition: { staggerChildren: 0.05 } },
  };
  const chip = {
    from: { opacity: 0, x: shift },
    enter: { opacity: 1, x: 0, transition: { duration: 0.6, ease } },
    exit: { opacity: 0, x: -shift, transition: { duration: 0.3, ease: 'easeIn' } },
  };
  return (
    <div
      className="pointer-events-auto flex min-h-[30px] items-center justify-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          className="flex flex-wrap items-center justify-center gap-2"
          variants={row}
          initial="from"
          animate="enter"
          exit="exit"
        >
          {sets[index].map((p) => (
            // mousedown is prevented so the text box keeps focus and the caret.
            <motion.span key={p} variants={chip} onMouseDown={(e) => e.preventDefault()}>
              <Chip dashed onClick={() => onPick(p)}>
                {p}
              </Chip>
            </motion.span>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function StepWords() {
  const navigate = useNavigate();
  const returning = useReturnToReview();
  const { draft, updateDraft, user } = useCapsuleStore();
  const unrated = draft.noScore || user.ratingScale === 'none';
  const limit = unrated ? TEXT_LIMIT_UNRATED : TEXT_LIMIT_RATED;
  const near = draft.text.length >= limit * 0.8;
  const ref = useRef<HTMLTextAreaElement>(null);

  const focusEnd = () =>
    window.setTimeout(() => {
      const el = ref.current;
      if (el) {
        el.focus();
        el.selectionStart = el.selectionEnd = el.value.length;
      }
    }, 0);

  const append = (chunk: string) => {
    const sep = draft.text.trim() ? (draft.text.endsWith('\n') ? '\n' : '\n\n') : '';
    updateDraft({ text: `${draft.text.trimEnd() ? draft.text : ''}${sep}${chunk}`.slice(0, limit) });
    focusEnd();
  };

  const hasText = !!draft.text.trim();

  return (
    <FlowShell
      step={2}
      footer={
        <>
          <Btn variant="link" to="/capsule/new/status">
            ← Back
          </Btn>
          {returning ? (
            <Btn disabled={!hasText} onClick={() => navigate('/capsule/new/review')}>
              Back to review →
            </Btn>
          ) : (
            <div className="flex items-center gap-[18px]">
              <Btn variant="quiet" disabled={!hasText} onClick={() => navigate('/capsule/new/review')}>
                Skip score
              </Btn>
              <Btn disabled={!hasText} onClick={() => navigate('/capsule/new/score')}>
                Next: score →
              </Btn>
            </div>
          )}
        </>
      }
    >
      {/* One centered column; the text field is ~600px (two-thirds of the old ~900px). */}
      <div className="mx-auto flex w-full max-w-[600px] flex-col items-center gap-4">
        <GameChip game={draft.game!} status={draft.status} date={draft.createdAt} />
        <StatusRow value={draft.status} onChange={(status) => updateDraft({ status })} />
        <H1 className="pt-2 text-center">So… how was it?</H1>
        <div className="relative w-full">
          <textarea
            ref={ref}
            autoFocus
            className={cx(inputCls, 'h-[260px] resize-none text-[14px] leading-[19px]')}
            aria-label="So… how was it?"
            value={draft.text}
            maxLength={limit}
            onChange={(e) => updateDraft({ text: e.target.value })}
          />
          {/* Empty state: centered in the box, gone the moment there's any text. */}
          <AnimatePresence initial={false}>
            {draft.text.length === 0 && (
              <motion.div
                key="empty"
                className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4, transition: { duration: 0.15, ease: 'easeOut' } }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                <PromptCarousel onPick={(p) => append(`${p}: `)} />
              </motion.div>
            )}
          </AnimatePresence>
          {near && (
            <span className="absolute bottom-3 right-4 text-[11px] font-semibold text-[#888]">
              {draft.text.length} / {limit}
            </span>
          )}
        </div>
        <TagsPanel />
      </div>
    </FlowShell>
  );
}

// R3a / R3b · Score or headline ---------------------------------------------------

type NumericScale = Exclude<RatingScale, 'none'>;

function StarInput({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  const fromEvent = (e: React.PointerEvent<HTMLButtonElement>, i: number) => {
    const r = e.currentTarget.getBoundingClientRect();
    return e.clientX - r.left < r.width / 2 ? i + 0.5 : i + 1;
  };
  return (
    <div className="flex gap-[6px]" onPointerLeave={() => setHover(null)} role="radiogroup" aria-label="Stars">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = shown >= i + 1 ? 1 : shown >= i + 0.5 ? 0.5 : 0;
        return (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1} stars`}
            onPointerMove={(e) => setHover(fromEvent(e, i))}
            onPointerDown={(e) => onChange(fromEvent(e, i))}
            className="relative text-[48px] leading-[60px] text-[#D8D8D8] sm:text-[60px] sm:leading-[72px]"
          >
            ★
            <span className="absolute inset-0 overflow-hidden text-[#222]" style={{ width: `${fill * 100}%` }}>
              ★
            </span>
          </button>
        );
      })}
    </div>
  );
}

function TenInput({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-wrap justify-center gap-[6px]">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={cx(
            'h-11 w-11 rounded-lg border-[1.5px] text-[16px] font-bold',
            value === n ? 'border-[#222] bg-[#222] text-white' : 'border-[#CFCFCF] text-[#555] hover:border-[#888]',
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function PercentInput({ value, onChange }: { value?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex w-full max-w-[420px] items-center gap-4">
      <input type="range" min={0} max={100} value={value ?? 50} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-[#222]" />
      <span className="w-14 text-right text-[28px] font-extrabold">{value ?? '–'}%</span>
    </div>
  );
}

function ScaleInput({ scale, value, onChange }: { scale: NumericScale; value?: number; onChange: (v: number) => void }) {
  if (scale === 'stars') return <StarInput value={value} onChange={onChange} />;
  if (scale === 'ten') return <TenInput value={value} onChange={onChange} />;
  return <PercentInput value={value} onChange={onChange} />;
}

const SCALE_NAME: Record<NumericScale, string> = { stars: 'Stars', ten: '1–10', percent: '%' };

function StepScore() {
  const navigate = useNavigate();
  const returning = useReturnToReview();
  const { draft, updateDraft, user } = useCapsuleStore();
  const noScoreUser = user.ratingScale === 'none';
  // A "no scores" user starts on the headline path; they can still add a score.
  useEffect(() => {
    const hasAny = Object.values(draft.rating).some((v) => v != null);
    // Only until the user picks a path themselves (scoreChoice).
    if (noScoreUser && !hasAny && !draft.noScore && !draft.scoreChoice) updateDraft({ noScore: true });
    // Only on arriving at this step.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const main: NumericScale = noScoreUser ? 'stars' : (user.ratingScale as NumericScale);
  const others = (['stars', 'ten', 'percent'] as NumericScale[]).filter((s) => s !== main);
  const [showOthers, setShowOthers] = useState(() => others.some((s) => draft.rating[s] != null));
  const [customVerdict, setCustomVerdict] = useState(() =>
    draft.verdict && !VERDICT_PRESETS.includes(draft.verdict) ? draft.verdict : '',
  );
  const [writingVerdict, setWritingVerdict] = useState(!!customVerdict);

  const setRating = (s: NumericScale, v: number) => updateDraft({ rating: { ...draft.rating, [s]: v } });
  const mainValue = draft.rating[main];

  const footer = (
    <>
      <Btn variant="link" to="/capsule/new/words">
        ← Back
      </Btn>
      <Btn onClick={() => navigate('/capsule/new/review')}>{returning ? 'Back to review →' : 'Next: review →'}</Btn>
    </>
  );

  if (draft.noScore) {
    return (
      <FlowShell step={3} footer={footer}>
        <div className="flex flex-col items-center gap-[18px]">
          <GameChip game={draft.game!} status={draft.status} date={draft.createdAt} />
          <H1 className="text-center">Say it in a line instead</H1>
          <div className="flex w-full max-w-[560px] flex-col gap-[6px]">
            <FieldLabel htmlFor="headline">Headline</FieldLabel>
            <input
              id="headline"
              autoFocus
              className={inputCls}
              maxLength={90}
              placeholder="Beautiful, brutal, and not for me — yet."
              value={draft.headline}
              onChange={(e) => updateDraft({ headline: e.target.value })}
            />
            <Note>Shown big on your card, where a score would sit.</Note>
          </div>
          <div className="flex w-full max-w-[560px] flex-col gap-[6px]">
            <FieldLabel>Verdict stamp</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {VERDICT_PRESETS.map((v) => (
                <Chip
                  key={v}
                  selected={draft.verdict === v}
                  onClick={() => {
                    setWritingVerdict(false);
                    updateDraft({ verdict: draft.verdict === v ? '' : v });
                  }}
                >
                  {v}
                </Chip>
              ))}
              {writingVerdict ? (
                <input
                  autoFocus
                  className="rounded-full border-[1.5px] border-[#222] px-3 py-1 text-[12px] outline-none"
                  placeholder="Your stamp"
                  maxLength={24}
                  value={customVerdict}
                  onChange={(e) => {
                    setCustomVerdict(e.target.value);
                    updateDraft({ verdict: e.target.value });
                  }}
                />
              ) : (
                <Chip dashed onClick={() => setWritingVerdict(true)}>
                  + write your own
                </Chip>
              )}
            </div>
          </div>
          <Note>Unrated capsules also get a longer review limit.</Note>
          <Btn variant="link" onClick={() => updateDraft({ noScore: false, scoreChoice: 'score' })}>
            Changed your mind? Add a score
          </Btn>
        </div>
      </FlowShell>
    );
  }

  return (
    <FlowShell step={3} footer={footer}>
      <div className="flex flex-col items-center gap-[18px]">
        <GameChip game={draft.game!} status={draft.status} date={draft.createdAt} />
        <H1 className="text-center">Want to put a number on it?</H1>
        <Note>
          {noScoreUser ? 'You picked “no scores” in Settings, so this is just for this one.' : `Your scale: ${SCALE_NAME[main]} (change it in Settings).`} Totally
          optional.
        </Note>
        <ScaleInput scale={main} value={mainValue} onChange={(v) => setRating(main, v)} />
        <p className="min-h-5 text-[15px] font-semibold text-[#555]">{mainValue != null ? scoreSentence(main, mainValue) : 'Tap to score'}</p>
        <Note>
          Each step gets a word label so the number has a voice.{main === 'stars' && ' Half-stars: tap the left half of a star.'}
        </Note>
        {showOthers && (
          <div className="flex w-full flex-col items-center gap-4 rounded-xl border border-[#E2E2E2] p-4">
            {others.map((s) => (
              <div key={s} className="flex w-full flex-col items-center gap-2">
                <FieldLabel>{SCALE_NAME[s]}</FieldLabel>
                <ScaleInput scale={s} value={draft.rating[s]} onChange={(v) => setRating(s, v)} />
                {draft.rating[s] != null && <p className="text-[12px] font-semibold text-[#777]">{scoreSentence(s, draft.rating[s]!)}</p>}
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {!showOthers && (
            <>
              <Btn variant="link" onClick={() => setShowOthers(true)}>
                + Also add {others.map((s) => SCALE_NAME[s]).join(' or ')}
              </Btn>
              <span className="text-[13px] text-[#BBB]">·</span>
            </>
          )}
          {Object.values(draft.rating).some((v) => v != null) && (
            <>
              <Btn variant="link" onClick={() => updateDraft({ rating: {} })}>
                Clear score
              </Btn>
              <span className="text-[13px] text-[#BBB]">·</span>
            </>
          )}
          <Btn variant="link" onClick={() => updateDraft({ noScore: true, scoreChoice: 'headline' })}>
            No score — use a headline instead
          </Btn>
        </div>
      </div>
    </FlowShell>
  );
}

// Review (new; replaces R4 Extras) ------------------------------------------------
// One last look at everything before the reveal. Each section's Edit jumps to
// its step with ?return=review, so you come straight back here.

function ReviewSection({ title, editTo, children }: { title: string; editTo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2 border-b border-[#EFEFEF] pb-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#888]">{title}</p>
        <Btn variant="link" to={editTo}>
          Edit
        </Btn>
      </div>
      {children}
    </section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => <p className="text-[13px] text-[#AAA]">{children}</p>;

function StepReview() {
  const reveal = usePublishAndReveal();
  const { draft } = useCapsuleStore();
  const edit = (step: StepKey) => `/capsule/new/${step}?return=review`;
  const scores = (['stars', 'ten', 'percent'] as NumericScale[]).filter((s) => draft.rating[s] != null);

  return (
    <FlowShell
      step={4}
      footer={
        <>
          <Btn variant="link" to="/capsule/new/score">
            ← Back
          </Btn>
          <Btn onClick={reveal}>{draft.editingId ? 'Save & replay reveal ✦' : 'Create my capsule ✦'}</Btn>
        </>
      }
    >
      <div className="flex flex-col items-center gap-10 md:flex-row md:items-start md:justify-center">
        <div className="flex flex-col items-center gap-3 md:sticky md:top-8">
          <motion.div animate={{ scale: [1, 1.015, 1] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}>
            <Ph className="h-[300px] w-[210px]" label={<>your capsule<br />sealed until you create it</>} />
          </motion.div>
          <Note className="max-w-[210px] text-center">Everything on the right goes into it. Look it over, then create it.</Note>
        </div>
        <div className="flex w-full max-w-[560px] flex-col gap-4">
          <H1>Look it over</H1>
          <ReviewSection title="Game" editTo={edit('status')}>
            <GameChip game={draft.game!} status={draft.status} date={draft.createdAt} />
          </ReviewSection>
          <ReviewSection title="Your words" editTo={edit('words')}>
            <p className="whitespace-pre-line text-[15px] leading-[22px] text-[#333]">“{draft.text.trim()}”</p>
          </ReviewSection>
          <ReviewSection title={draft.noScore ? 'Headline' : 'Score'} editTo={edit('score')}>
            {draft.noScore ? (
              <>
                {draft.headline.trim() ? <p className="text-[18px] font-bold">“{draft.headline.trim()}”</p> : <Empty>No headline</Empty>}
                {draft.verdict.trim() && (
                  <span className="self-start rounded-full border border-[#222] px-[10px] py-[3px] text-[11px] font-bold uppercase tracking-wide">
                    Verdict · {draft.verdict.trim()}
                  </span>
                )}
              </>
            ) : scores.length ? (
              scores.map((s) => (
                <p key={s} className="text-[15px] font-semibold text-[#444]">
                  {scoreSentence(s, draft.rating[s]!)}
                </p>
              ))
            ) : (
              <Empty>No score. That’s fine: it’s optional.</Empty>
            )}
          </ReviewSection>
          <ReviewSection title="Tags" editTo={edit('words')}>
            {draft.tags.length ? (
              <div className="flex flex-wrap gap-2">
                {draft.tags.map((t) => (
                  <Chip key={t}>{t}</Chip>
                ))}
              </div>
            ) : (
              <Empty>None added</Empty>
            )}
          </ReviewSection>
        </div>
      </div>
    </FlowShell>
  );
}
