// Review a game — wireframes 03-review-flow.html, R1–R4.
// Stepped: Game → Words → Score → Extras. Words is the only required step.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Reorder, motion, useDragControls } from 'motion/react';
import {
  CapsuleStatus,
  ExtraItem,
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
  newId,
  scoreSentence,
  suggestTagsLocally,
} from '../data';
import { useCapsuleStore, useHeadlineCapsule } from '../store';
import { useGameSearch } from '../useGameSearch';
import { Btn, Chip, CoverThumb, FieldLabel, H1, Logo, Note, Page, Panel, Ph, cx, inputCls } from '../ui';

const STEPS = [
  { key: 'game', label: 'Game' },
  { key: 'words', label: 'Words' },
  { key: 'score', label: 'Score' },
  { key: 'extras', label: 'Extras' },
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
  if (idx > 1 && (!draft.text.trim() || !draft.status)) return <Navigate to="/capsule/new/words" replace />;
  const key = step as StepKey;
  if (key === 'game') return <StepGame />;
  if (key === 'words') return <StepWords />;
  if (key === 'score') return <StepScore />;
  return <StepExtras />;
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
          <Btn disabled={!draft.game} onClick={() => navigate('/capsule/new/words')}>
            Next: write →
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

// R2 · Status, then words ------------------------------------------------------

const STATUS_CHOICES: { value: CapsuleStatus; label: string }[] = [
  { value: 'finished', label: 'Finished it' },
  { value: 'dropped', label: 'Dropped it' },
  { value: 'favorite', label: 'All-time favorite' },
];

/**
 * First thing on the review screen. Before a choice it's the main question;
 * after, it shrinks to a row above the writing area and stays editable.
 */
function StatusPicker({ value, onChange }: { value?: CapsuleStatus; onChange: (s: CapsuleStatus) => void }) {
  return (
    <motion.div layout className="flex flex-col gap-3">
      {value ? (
        <p className="text-[12px] font-semibold uppercase tracking-wide text-[#888]">Where you are with it</p>
      ) : (
        <H1>Where are you with it?</H1>
      )}
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Where are you with it?">
        {STATUS_CHOICES.map((c) => (
          <Chip key={c.value} selected={value === c.value} onClick={() => onChange(c.value)} className={value ? undefined : 'px-4 py-2 text-[14px]'}>
            {c.label}
          </Chip>
        ))}
      </div>
      {!value && <Note>This only sets the label on your capsule. You can change it any time. Dropped ones stay out of discovery.</Note>}
    </motion.div>
  );
}

function StepWords() {
  const navigate = useNavigate();
  const reveal = usePublishAndReveal();
  const { draft, updateDraft, user } = useCapsuleStore();
  const unrated = draft.noScore || user.ratingScale === 'none';
  const limit = unrated ? TEXT_LIMIT_UNRATED : TEXT_LIMIT_RATED;
  const near = draft.text.length >= limit * 0.8;
  const ref = useRef<HTMLTextAreaElement>(null);

  const picked = useMemo(() => suggestTagsLocally(draft.text), [draft.text]);
  const toggleTag = (t: string) =>
    updateDraft({ tags: draft.tags.includes(t) ? draft.tags.filter((x) => x !== t) : [...draft.tags, t] });

  const usePrompt = (p: string) => {
    const sep = draft.text && !draft.text.endsWith('\n') ? '\n\n' : '';
    updateDraft({ text: `${draft.text}${sep}${p}: ` });
    requestAnimationFrame(() => {
      const el = ref.current;
      if (el) {
        el.focus();
        el.selectionStart = el.selectionEnd = el.value.length;
      }
    });
  };

  const hasText = !!draft.text.trim();
  const canGo = hasText && !!draft.status;

  return (
    <FlowShell
      step={1}
      footer={
        <>
          <Btn variant="link" to="/capsule/new/game">
            ← Back
          </Btn>
          <div className="flex items-center gap-[18px]">
            <Btn variant="quiet" disabled={!canGo} onClick={reveal}>
              Skip to reveal
            </Btn>
            <Btn disabled={!canGo} onClick={() => navigate('/capsule/new/score')}>
              Next: score →
            </Btn>
          </div>
        </>
      }
    >
      <div className="flex flex-col items-start gap-9 lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          <GameChip game={draft.game!} status={draft.status} date={draft.createdAt} />
          <StatusPicker value={draft.status} onChange={(status) => updateDraft({ status })} />
          {draft.status && (
            <motion.div className="flex flex-col gap-4" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
              <H1>So… how was it?</H1>
              <div className="relative">
                <textarea
                  ref={ref}
                  autoFocus
                  className={cx(inputCls, 'h-[260px] resize-none text-[14px] leading-[19px]')}
                  placeholder="Start typing. A sentence is enough."
                  value={draft.text}
                  maxLength={limit}
                  onChange={(e) => updateDraft({ text: e.target.value })}
                />
                {near && (
                  <span className="absolute bottom-3 right-4 text-[11px] font-semibold text-[#888]">
                    {draft.text.length} / {limit}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[12px] font-semibold text-[#555]">Stuck? Try a prompt:</p>
                {WRITING_PROMPTS.map((p) => (
                  <Chip key={p} dashed onClick={() => usePrompt(p)}>
                    {p}
                  </Chip>
                ))}
              </div>
            </motion.div>
          )}
        </div>
        {draft.status && (
          <Panel className="w-full lg:w-[280px] lg:shrink-0">
            <p className="text-[13px] font-bold">As you write</p>
            <Note>Tags we’re picking up (tap to keep):</Note>
            <div className="flex min-h-[26px] flex-wrap gap-[6px]">
              {picked.length === 0 && draft.tags.length === 0 && <span className="text-[12px] text-[#AAA]">Nothing yet</span>}
              {Array.from(new Set([...draft.tags, ...picked])).map((t) => (
                <Chip key={t} dashed={!draft.tags.includes(t)} selected={draft.tags.includes(t)} onClick={() => toggleTag(t)}>
                  {t}
                </Chip>
              ))}
            </div>
            <div className="h-px bg-[#E2E2E2]" />
            <Note>A sentence is enough. No minimum, no character counter until you get close to the limit.</Note>
          </Panel>
        )}
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
      <Btn onClick={() => navigate('/capsule/new/extras')}>Next: extras →</Btn>
    </>
  );

  if (draft.noScore) {
    return (
      <FlowShell step={2} footer={footer}>
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
    <FlowShell step={2} footer={footer}>
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

// R4 · Extras ------------------------------------------------------------------

const HIGH_ICONS = ['H', '★', '♥', '⚡', '✦'];
const LOW_ICONS = ['L', '✕', '☹', '⌛', '⚠'];

/** One high/low row. Only the ⋮⋮ handle starts a drag, so the text stays selectable. */
function ExtraRow({
  item,
  onChange,
  onCycleIcon,
  onRemove,
}: {
  item: ExtraItem;
  onChange: (patch: Partial<ExtraItem>) => void;
  onCycleIcon: () => void;
  onRemove: () => void;
  key?: string;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      className="flex items-center gap-3 rounded-[10px] border border-[#E2E2E2] bg-white px-3 py-[10px]"
    >
      <span
        className="cursor-grab touch-none select-none text-[14px] font-bold text-[#BBB] active:cursor-grabbing"
        onPointerDown={(e) => controls.start(e)}
        aria-label="Drag to reorder"
      >
        ⋮⋮
      </span>
      <button
        type="button"
        title="Change icon"
        aria-label="Change icon"
        onClick={onCycleIcon}
        className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#DADADA] text-[11px] font-semibold text-[#666] hover:bg-[#CFCFCF]"
      >
        {item.icon}
      </button>
      <input
        className="min-w-0 flex-1 bg-transparent text-[14px] font-medium outline-none"
        value={item.text}
        placeholder="Describe it"
        autoFocus={!item.text}
        onChange={(e) => onChange({ text: e.target.value })}
      />
      <button type="button" aria-label="Remove" className="text-[14px] font-bold text-[#AAA] hover:text-[#222]" onClick={onRemove}>
        ×
      </button>
    </Reorder.Item>
  );
}

function ExtraList({
  title,
  items,
  icons,
  onChange,
  addLabel,
  hint,
}: {
  title: string;
  items: ExtraItem[];
  icons: string[];
  onChange: (items: ExtraItem[]) => void;
  addLabel: string;
  hint?: string;
}) {
  const update = (id: string, patch: Partial<ExtraItem>) => onChange(items.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex items-center gap-2">
        <p className="text-[15px] font-bold">{title}</p>
        {hint && items.length > 1 && <Note>{hint}</Note>}
      </div>
      <Reorder.Group axis="y" values={items} onReorder={onChange} className="flex flex-col gap-[10px]">
        {items.map((it) => (
          <ExtraRow
            key={it.id}
            item={it}
            onChange={(patch) => update(it.id, patch)}
            onCycleIcon={() => update(it.id, { icon: icons[(icons.indexOf(it.icon) + 1) % icons.length] })}
            onRemove={() => onChange(items.filter((x) => x.id !== it.id))}
          />
        ))}
      </Reorder.Group>
      <Btn variant="link" className="self-start" onClick={() => onChange([...items, { id: newId('x'), text: '', icon: icons[0] }])}>
        {addLabel}
      </Btn>
    </div>
  );
}

function StepExtras() {
  const reveal = usePublishAndReveal();
  const { draft, updateDraft } = useCapsuleStore();
  const [custom, setCustom] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const suggested = useMemo(() => suggestTagsLocally(`${draft.text} ${draft.favoriteMoment} ${draft.highs.map((h) => h.text).join(' ')}`), [draft.text, draft.favoriteMoment, draft.highs]);
  const allTags = Array.from(new Set([...draft.tags, ...suggested]));
  const toggleTag = (t: string) =>
    updateDraft({ tags: draft.tags.includes(t) ? draft.tags.filter((x) => x !== t) : [...draft.tags, t] });

  return (
    <FlowShell
      step={3}
      footer={
        <>
          <Btn variant="link" to="/capsule/new/score">
            ← Back
          </Btn>
          <div className="flex items-center gap-[18px]">
            <Btn variant="quiet" onClick={reveal}>
              Skip extras
            </Btn>
            <Btn onClick={reveal}>{draft.editingId ? 'Save & replay reveal ✦' : 'Reveal my capsule ✦'}</Btn>
          </div>
        </>
      }
    >
      <div className="flex flex-col items-start gap-10 lg:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-[10px]">
          <GameChip game={draft.game!} status={draft.status} date={draft.createdAt} />
          <h1 className="text-[28px] font-extrabold leading-[34px]">Add the good stuff</h1>
          <ExtraList title="Highs" hint="drag to reorder" items={draft.highs} icons={HIGH_ICONS} onChange={(highs) => updateDraft({ highs })} addLabel="+ Add a high" />
          <ExtraList title="Lows" hint="drag to reorder" items={draft.lows} icons={LOW_ICONS} onChange={(lows) => updateDraft({ lows })} addLabel="+ Add a low" />
        </div>
        <div className="flex w-full flex-col gap-[10px] lg:w-[420px] lg:shrink-0">
          <p className="text-[15px] font-bold">Favorite moment</p>
          <input
            className={inputCls}
            placeholder="Describe it…"
            value={draft.favoriteMoment}
            onChange={(e) => updateDraft({ favoriteMoment: e.target.value })}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => updateDraft({ screenshotName: e.target.files?.[0]?.name })}
          />
          <Ph
            dashed
            className="h-[120px]"
            onClick={() => fileRef.current?.click()}
            label={draft.screenshotName ? `Screenshot: ${draft.screenshotName} (click to change)` : '+ Drop a screenshot'}
          />
          <p className="text-[15px] font-bold">Tags</p>
          <div className="flex flex-wrap items-center gap-[6px]">
            {allTags.map((t) => (
              <Chip key={t} selected={draft.tags.includes(t)} onClick={() => toggleTag(t)}>
                {t}
              </Chip>
            ))}
            {addingTag ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const t = custom.trim().toLowerCase();
                  if (t && !draft.tags.includes(t)) updateDraft({ tags: [...draft.tags, t] });
                  setCustom('');
                  setAddingTag(false);
                }}
              >
                <input
                  autoFocus
                  className="rounded-full border-[1.5px] border-[#222] px-3 py-1 text-[12px] outline-none"
                  placeholder="tag"
                  maxLength={24}
                  value={custom}
                  onChange={(e) => setCustom(e.target.value)}
                  onBlur={() => setAddingTag(false)}
                />
              </form>
            ) : (
              <Chip dashed onClick={() => setAddingTag(true)}>
                + custom
              </Chip>
            )}
          </div>
          <Note>Suggested from your words + other capsules. Tap to keep.</Note>
        </div>
      </div>
    </FlowShell>
  );
}
