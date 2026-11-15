// R5 · The reveal and R6 · After the reveal (03-review-flow.html).
// Quiet and cinematic, about 3 seconds. Pass 4 tunes the numbers in REVEAL.

import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { STATUS_LABEL, formatDate, shortScore } from '../data';
import { useCapsuleStore } from '../store';
import { Btn, Flash, Ph, copyText, cx, useFlash } from '../ui';
import { ShareModal, capsuleLink } from './Share';

/** All timings in seconds from the start of the reveal. */
export const REVEAL = {
  dim: 0.45, // backdrop fade
  bars: 0.5, // letterbox bars slide in
  cardAt: 0.45,
  cardDur: 0.9,
  titleAt: 1.15,
  scoreAt: 1.4,
  firstLineAt: 1.65,
  lineGap: 0.32,
  lineDur: 0.5,
  hold: 0.55, // soft hold after the last icon settles
  outro: 0.7, // bars retract, page lightens, actions fade in
};

function splitLines(text: string) {
  return text
    .split(/(?<=[.!?…])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function RevealScreen() {
  const { capsuleId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { capsules, user, editCapsule, startDraft, releaseDraft } = useCapsuleStore();
  const capsule = capsules.find((c) => c.id === capsuleId);
  const isFirst = params.get('first') === '1';

  const [run, setRun] = useState(0); // bump to replay
  const [skipped, setSkipped] = useState(false);
  const [done, setDone] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [msg, flash] = useFlash();

  const lines = useMemo(() => splitLines(capsule?.text ?? ''), [capsule?.text]);

  const lastLineAt = REVEAL.firstLineAt + Math.max(0, lines.length - 1) * REVEAL.lineGap + REVEAL.lineDur;
  const settledAt = lastLineAt + 0.3; // tags settle last
  const doneAt = settledAt + REVEAL.hold;

  // The capsule is saved; let go of the draft so R1 starts fresh next time.
  useEffect(() => {
    if (capsuleId) releaseDraft(capsuleId);
  }, [capsuleId, releaseDraft]);

  useEffect(() => {
    setDone(false);
    setSkipped(false);
  }, [run]);

  useEffect(() => {
    if (done) return;
    if (skipped) {
      setDone(true);
      return;
    }
    const t = window.setTimeout(() => setDone(true), doneAt * 1000);
    return () => window.clearTimeout(t);
  }, [run, skipped, done, doneAt]);

  if (!capsule) return <Navigate to={`/capsule/u/${user.handle}`} replace />;

  const at = (s: number) => (skipped ? 0 : s);
  // Skipping remounts the stage (see key below) with initial={false}, so every
  // element renders at its final state instead of waiting out its delay.
  const init = <T,>(v: T): T | false => (skipped ? false : v);
  const score = shortScore(capsule, user.ratingScale);
  const light = done;

  return (
    <motion.div
      key={`${run}-${skipped ? 'skip' : 'play'}`}
      className="relative min-h-screen overflow-hidden"
      initial={init({ backgroundColor: '#FFFFFF' })}
      animate={{ backgroundColor: light ? '#FFFFFF' : '#141414' }}
      transition={{ duration: light ? REVEAL.outro : REVEAL.dim, ease: 'easeInOut' }}
      onClick={() => !done && setSkipped(true)}
    >
      {/* Letterbox bars */}
      {(['top', 'bottom'] as const).map((side) => (
        <motion.div
          key={side}
          className={cx('fixed inset-x-0 z-20 h-[9vh] bg-black', side === 'top' ? 'top-0' : 'bottom-0')}
          initial={init({ y: side === 'top' ? '-100%' : '100%' })}
          animate={{ y: light ? (side === 'top' ? '-100%' : '100%') : '0%' }}
          transition={{ duration: light ? REVEAL.outro : REVEAL.bars, ease: [0.22, 1, 0.36, 1], delay: light ? 0 : at(0.05) }}
        />
      ))}

      {!done && (
        <button
          type="button"
          className="fixed bottom-[11vh] right-6 z-30 text-[12px] font-semibold text-[#777] hover:text-[#BBB]"
          onClick={(e) => {
            e.stopPropagation();
            setSkipped(true);
          }}
        >
          Skip
        </button>
      )}

      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col items-center justify-center gap-7 px-4 py-[12vh]">
        <div className="flex w-full flex-col items-center gap-8 md:flex-row md:items-center md:justify-center md:gap-10">
          {/* The collectible */}
          <motion.div
            className="relative"
            initial={init({ opacity: 0, y: 18, scale: 0.98 })}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: at(REVEAL.cardAt), duration: skipped ? 0.2 : REVEAL.cardDur, ease: [0.16, 1, 0.3, 1] }}
          >
            <Ph
              dark={!light}
              className={cx('h-[360px] w-[250px] transition-colors duration-700 md:h-[420px] md:w-[300px]', light && 'bg-[#ECECEC] text-[#9A9A9A]')}
              label={<>collectible: card / cartridge<br />{capsule.gameTitle}</>}
            />
            {isFirst && (
              <motion.div
                className="absolute -right-3 -top-3 rotate-6 rounded-md border-2 border-current bg-white px-2 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#222]"
                initial={init({ opacity: 0, scale: 1.4 })}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: at(settledAt), duration: 0.35, ease: 'easeOut' }}
              >
                Your first capsule
              </motion.div>
            )}
          </motion.div>

          {/* The words */}
          <div className={cx('flex w-full max-w-[440px] flex-col gap-3 transition-colors duration-700', light ? 'text-[#222]' : 'text-[#EEE]')}>
            <motion.p
              className="text-[28px] font-extrabold uppercase leading-[34px] tracking-[-0.01em] md:text-[34px] md:leading-[41px]"
              initial={init({ opacity: 0, y: 6 })}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: at(REVEAL.titleAt), duration: 0.5 }}
            >
              {capsule.gameTitle}
            </motion.p>
            <motion.div initial={init({ opacity: 0 })} animate={{ opacity: 1 }} transition={{ delay: at(REVEAL.scoreAt), duration: 0.5 }} className="flex flex-col gap-2">
              {score && <p className="text-[22px] leading-[30px] tracking-[0.08em]">{score}</p>}
              {!score && capsule.headline && <p className="text-[22px] font-bold leading-[28px]">“{capsule.headline}”</p>}
              {capsule.verdict && (
                <span className={cx('self-start rounded-full border px-[10px] py-[3px] text-[11px] font-bold uppercase tracking-wide', light ? 'border-[#222]' : 'border-[#AAA]')}>
                  Verdict · {capsule.verdict}
                </span>
              )}
              <p className={cx('text-[12px] font-medium', light ? 'text-[#888]' : 'text-[#999]')}>
                {STATUS_LABEL[capsule.status]} · {formatDate(capsule.updatedAt, true)}
              </p>
            </motion.div>
            <div className={cx('flex flex-col gap-1 text-[16px] leading-[23px] md:text-[18px] md:leading-6', light ? 'text-[#333]' : 'text-[#DDD]')}>
              {lines.map((line, i) => (
                <motion.p
                  key={i}
                  initial={init({ opacity: 0, y: 4 })}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: at(REVEAL.firstLineAt + i * REVEAL.lineGap), duration: REVEAL.lineDur }}
                >
                  {i === 0 ? '“' : ''}
                  {line}
                  {i === lines.length - 1 ? '”' : ''}
                </motion.p>
              ))}
            </div>
            {capsule.tags.length > 0 && (
              <motion.div className="flex flex-wrap gap-2" initial={init({ opacity: 0 })} animate={{ opacity: 1 }} transition={{ delay: at(settledAt - 0.2), duration: 0.5 }}>
                {capsule.tags.map((t) => (
                  <span key={t} className={cx('rounded-full border px-[10px] py-[5px] text-[12px] font-medium', light ? 'border-[#DDD] bg-[#EFEFEF] text-[#444]' : 'border-[#444] text-[#BBB]')}>
                    {t}
                  </span>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* R6 · actions fade in after the hold */}
        <motion.div
          className="flex flex-col items-center gap-5"
          initial={false}
          animate={{ opacity: done ? 1 : 0, y: done ? 0 : 8 }}
          transition={{ delay: done && !skipped ? REVEAL.outro * 0.6 : 0, duration: skipped ? 0.25 : 0.5 }}
          style={{ pointerEvents: done ? 'auto' : 'none' }}
          onClick={(e) => e.stopPropagation()}
        >
          <span className="rounded-full bg-[#EAF3EA] px-3 py-[6px] text-[12px] font-semibold text-[#3A7A3A]">
            ✓ Added to your Capsule{isFirst ? ' · your first one!' : ''}
          </span>
          <div className="flex flex-wrap justify-center gap-3">
            <Btn onClick={() => setShareOpen(true)}>Share</Btn>
            <Btn
              variant="secondary"
              onClick={() => {
                copyText(`https://${capsuleLink(user.handle, capsule)}`);
                flash('Link copied');
              }}
            >
              Copy link
            </Btn>
            <Btn variant="secondary" to={`/capsule/u/${user.handle}`}>
              View my Capsule
            </Btn>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            <Btn
              variant="quiet"
              onClick={() => {
                editCapsule(capsule.id);
                navigate('/capsule/new/words');
              }}
            >
              Edit
            </Btn>
            <Btn variant="quiet" onClick={() => setRun((r) => r + 1)}>
              Replay reveal
            </Btn>
            <Btn variant="quiet" to={`/capsule/u/${user.handle}/${capsule.id}`}>
              See public page
            </Btn>
            <Btn variant="quiet" disabled title="Game pages come later">
              See on game page
            </Btn>
            <Btn
              variant="quiet"
              onClick={() => {
                startDraft();
                navigate('/capsule/new/game');
              }}
            >
              Capsule another game
            </Btn>
          </div>
        </motion.div>
      </div>
      <ShareModal capsule={capsule} handle={user.handle} scale={user.ratingScale} open={shareOpen} onClose={() => setShareOpen(false)} />
      <Flash msg={msg} />
    </motion.div>
  );
}
