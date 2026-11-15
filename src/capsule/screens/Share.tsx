// G · Share — modal over a capsule (01-lofi-set.html).

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Capsule, RatingScale, shortScore, slugify } from '../data';
import { Btn, Chip, Flash, Ph, copyText, cx, inputCls, publicUrl, useFlash } from '../ui';

const FORMATS = ['3D spin', 'Story', 'Post', 'Link'] as const;
const BACKGROUNDS = ['#F2F2F2', '#D9D9D9', '#A8A8A8', '#5C5C5C', '#1F1F1F'];

export function capsuleLink(handle: string, c: Capsule) {
  return publicUrl(handle, slugify(c.gameTitle));
}

export function ShareModal({
  capsule,
  handle,
  scale,
  open,
  onClose,
}: {
  capsule: Capsule;
  handle: string;
  scale: RatingScale;
  open: boolean;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<(typeof FORMATS)[number]>('3D spin');
  const [bg, setBg] = useState(BACKGROUNDS[0]);
  const [show, setShow] = useState({ score: true, text: true, extras: true, tags: true });
  const [msg, flash] = useFlash();
  const link = capsuleLink(handle, capsule);
  const score = shortScore(capsule, scale);
  const dark = BACKGROUNDS.indexOf(bg) >= 3;

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-label="Share your capsule"
            className="flex max-h-[92vh] w-full max-w-[1000px] flex-col gap-5 overflow-y-auto rounded-t-2xl bg-white p-5 text-[#222] sm:rounded-2xl sm:p-7"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-[22px] font-extrabold">Share your capsule</p>
              <button type="button" onClick={onClose} className="text-[20px] font-bold text-[#888] hover:text-[#222]" aria-label="Close">
                ×
              </button>
            </div>
            <div className="flex flex-col gap-6 md:flex-row">
              <div
                className={cx('flex min-h-[340px] flex-1 flex-col items-center justify-center gap-3 rounded-xl p-6 md:min-h-[520px]', dark ? 'text-[#EEE]' : 'text-[#222]')}
                style={{ background: bg }}
              >
                <Ph
                  dark={dark}
                  className={cx(format === 'Story' ? 'h-[260px] w-[150px]' : format === 'Post' ? 'h-[200px] w-[200px]' : format === 'Link' ? 'h-[120px] w-[230px]' : 'h-[240px] w-[170px]')}
                  label={format === '3D spin' ? 'live preview · 3D mode: drag to spin' : `${format} preview`}
                />
                <p className="text-[15px] font-extrabold uppercase tracking-wide">{capsule.gameTitle}</p>
                {show.score && <p className="text-[14px]">{score ?? (capsule.headline ? `“${capsule.headline}”` : '')}</p>}
                {show.text && <p className="line-clamp-2 max-w-[320px] text-center text-[12px] opacity-80">“{capsule.text}”</p>}
                {show.extras && (capsule.highs.length > 0 || capsule.lows.length > 0) && (
                  <div className="flex gap-1">
                    {[...capsule.highs, ...capsule.lows].map((x) => (
                      <span key={x.id} className="flex h-5 w-5 items-center justify-center rounded-full bg-[#DADADA] text-[9px] text-[#666]">
                        {x.icon}
                      </span>
                    ))}
                  </div>
                )}
                {show.tags && capsule.tags.length > 0 && <p className="text-[11px] opacity-70">{capsule.tags.map((t) => `#${t}`).join(' ')}</p>}
              </div>
              <div className="flex w-full flex-col gap-4 md:w-[340px]">
                <p className="text-[11px] font-medium italic text-[#8A8A8A]">Formats are platform-agnostic: story, post, link preview</p>
                <div className="flex flex-wrap gap-2">
                  {FORMATS.map((f) => (
                    <Chip key={f} selected={format === f} onClick={() => setFormat(f)}>
                      {f}
                    </Chip>
                  ))}
                </div>
                <p className="text-[13px] font-bold">Background</p>
                <div className="flex gap-2">
                  {BACKGROUNDS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Background ${c}`}
                      onClick={() => setBg(c)}
                      className={cx('h-[34px] w-[34px] rounded-full border', bg === c ? 'ring-2 ring-[#222] ring-offset-2' : 'border-[#DDD]')}
                      style={{ background: c }}
                    />
                  ))}
                </div>
                <p className="text-[13px] font-bold">Show on card</p>
                {(
                  [
                    ['score', 'Rating / headline'],
                    ['text', 'Review text'],
                    ['extras', 'Highs & lows'],
                    ['tags', 'Tags'],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k} className="flex items-center justify-between text-[13px] text-[#444]">
                    {label}
                    <input type="checkbox" className="h-4 w-4 accent-[#222]" checked={show[k]} onChange={(e) => setShow({ ...show, [k]: e.target.checked })} />
                  </label>
                ))}
                <p className="mt-2 text-[12px] font-semibold text-[#555]">Your link</p>
                <input readOnly className={inputCls} value={link} onFocus={(e) => e.target.select()} />
                <div className="flex gap-3">
                  <Btn
                    onClick={() => {
                      copyText(`https://${link}`);
                      flash('Link copied');
                    }}
                  >
                    Copy link
                  </Btn>
                  <Btn variant="secondary" disabled title="Story/post images come later">
                    Download
                  </Btn>
                </div>
              </div>
            </div>
          </motion.div>
          <Flash msg={msg} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
