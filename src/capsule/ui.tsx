// The repo has no @types/react, so JSX doesn't know about `key` on our own
// components; list-rendered ones accept it explicitly.
type Keyed = { key?: string | number };

// Gray-box primitives that mirror the wireframe vocabulary (Button, Tag,
// Placeholder, Input, Avatar, note text). Low fidelity on purpose.

import React from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

export function CapsuleShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cx('min-h-screen bg-white text-[#222] antialiased', className)}
      style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, sans-serif' }}
    >
      {children}
    </div>
  );
}

/** Page body with the wireframes' 32px padding (16px on phones). */
export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('mx-auto flex w-full max-w-[1280px] flex-col px-4 py-6 sm:p-8', className)}>{children}</div>;
}

export function Logo({ to = '/capsule' }: { to?: string }) {
  return (
    <Link to={to} className="text-[20px] font-extrabold leading-[27px] tracking-tight">
      Capsule
    </Link>
  );
}

export function TopBar({ right, center, logoTo }: { right?: React.ReactNode; center?: React.ReactNode; logoTo?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Logo to={logoTo} />
      {center && <div className="hidden md:flex">{center}</div>}
      <div className="flex items-center gap-3">{right}</div>
    </div>
  );
}

type BtnProps = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'link' | 'quiet';
  to?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
  title?: string;
};

export function Btn({ children, variant = 'primary', to, onClick, disabled, className, type = 'button', title }: BtnProps) {
  const cls = cx(
    'inline-flex items-center justify-center gap-2 text-[14px] font-semibold leading-[19px] transition-colors',
    variant === 'primary' && 'rounded-lg bg-[#222] px-[18px] py-[11px] text-white hover:bg-black',
    variant === 'secondary' && 'rounded-lg border-[1.5px] border-[#CFCFCF] bg-white px-[18px] py-[11px] text-[#222] hover:border-[#999]',
    variant === 'link' && 'text-[13px] leading-[18px] text-[#555] hover:text-[#222]',
    variant === 'quiet' && 'text-[13px] leading-[18px] text-[#777] hover:text-[#222]',
    disabled && 'pointer-events-none opacity-40',
    className,
  );
  if (to && !disabled) {
    return (
      <Link to={to} className={cls} onClick={onClick} title={title}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
}

export function Chip({
  children,
  selected,
  dashed,
  onClick,
  className,
}: {
  children: React.ReactNode;
  selected?: boolean;
  dashed?: boolean;
  onClick?: () => void;
  className?: string;
} & Keyed) {
  const cls = cx(
    'inline-flex items-center gap-1 rounded-full px-[10px] py-[5px] text-[12px] leading-4 transition-colors',
    selected
      ? 'bg-[#222] font-semibold text-white'
      : dashed
        ? 'border border-dashed border-[#BBB] bg-white font-medium text-[#444] hover:border-[#888]'
        : 'border border-[#DDD] bg-[#EFEFEF] font-medium text-[#444] hover:border-[#BBB]',
    className,
  );
  if (!onClick) return <span className={cls}>{children}</span>;
  return (
    <button type="button" className={cls} onClick={onClick} aria-pressed={selected}>
      {children}
    </button>
  );
}

/** Gray placeholder box (covers, collectibles, screenshots). */
export function Ph({
  label,
  className,
  dark,
  dashed,
  children,
  onClick,
}: {
  label?: React.ReactNode;
  className?: string;
  dark?: boolean;
  dashed?: boolean;
  children?: React.ReactNode;
  onClick?: () => void;
} & Keyed) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cx(
        'flex shrink-0 items-center justify-center rounded-md text-center text-[11px] leading-[15px]',
        dark ? 'bg-[#3A3A3A] text-[#AAA]' : dashed ? 'border-[1.5px] border-dashed border-[#BDBDBD] bg-[#FAFAFA] text-[#9A9A9A]' : 'bg-[#ECECEC] text-[#9A9A9A]',
        onClick && 'transition-colors hover:bg-[#E2E2E2]',
        className,
      )}
    >
      {children ?? (label && <span className="px-2">{label}</span>)}
    </Tag>
  );
}

/** The collectible (card or cartridge, undecided) stays a placeholder. */
export function Collectible({ title, className, dark }: { title?: string; className?: string; dark?: boolean }) {
  return <Ph className={cx('aspect-[2/3]', className)} dark={dark} label={title ? <>collectible<br />{title}</> : 'collectible: card / cartridge'} />;
}

/** Small cover thumb used in search results and game chips (44×58). */
export function CoverThumb({ src, className }: { src?: string; className?: string }) {
  if (src) return <img src={src} alt="" className={cx('h-[58px] w-[44px] shrink-0 rounded-md bg-[#ECECEC] object-cover grayscale', className)} />;
  return <Ph className={cx('h-[58px] w-[44px]', className)} />;
}

export function Note({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={cx('text-[11px] font-medium italic leading-[15px] text-[#8A8A8A]', className)}>{children}</p>;
}

export function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="text-[12px] font-semibold leading-4 text-[#555]">
      {children}
    </label>
  );
}

export const inputCls =
  'w-full rounded-[10px] border-[1.5px] border-[#CFCFCF] bg-white px-[14px] py-3 text-[13px] leading-[18px] text-[#222] placeholder:text-[#9A9A9A] outline-none focus:border-[#222]';

export function Avatar({ size = 32, src, label, className }: { size?: number; src?: string; label?: string; className?: string }) {
  if (src) return <img src={src} alt="" className={cx('shrink-0 rounded-full object-cover grayscale', className)} style={{ width: size, height: size }} />;
  return (
    <div
      className={cx('flex shrink-0 items-center justify-center rounded-full bg-[#DADADA] text-[10px] font-semibold text-[#666]', className)}
      style={{ width: size, height: size }}
    >
      {label}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cx('h-px w-full bg-[#E2E2E2]', className)} />;
}

export function H1({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h1 className={cx('text-[28px] font-extrabold leading-[34px] tracking-[-0.01em] sm:text-[34px] sm:leading-[41px]', className)}>{children}</h1>;
}

export function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('flex flex-col gap-[10px] rounded-xl bg-[#F6F6F6] p-[18px]', className)}>{children}</div>;
}

/** Small toast-ish confirmation used for "Link copied". */
export function useFlash(ms = 1600): [string | null, (msg: string) => void] {
  const [msg, setMsg] = React.useState<string | null>(null);
  const t = React.useRef<number | undefined>(undefined);
  const flash = React.useCallback(
    (m: string) => {
      setMsg(m);
      window.clearTimeout(t.current);
      t.current = window.setTimeout(() => setMsg(null), ms);
    },
    [ms],
  );
  return [msg, flash];
}

export function Flash({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-[#222] px-4 py-2 text-[13px] font-semibold text-white shadow-lg">
      {msg}
    </div>
  );
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    /* clipboard can be blocked; the flash still confirms intent in the prototype */
  }
}

export const publicUrl = (handle: string, slug?: string) => `capsule.gg/${handle}${slug ? `/${slug}` : ''}`;

/** How long the pointer rests on a high/low icon before its text pops up. */
export const ICON_TIP_DELAY_MS = 400;

/**
 * A high/low icon on a finished capsule. Hover grows it and rings it; resting
 * on it for a moment pops up the high/low text. Keyboard focus shows the text
 * straight away, and a tap toggles it on touch screens.
 */
export function ExtraIcon({
  icon,
  label,
  kind,
  size = 28,
  dark,
}: {
  icon: string;
  label: string;
  kind: 'High' | 'Low';
  size?: number;
  /** Sitting on a dark background (the reveal before it lightens). */
  dark?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<number | undefined>(undefined);
  const lastPointer = React.useRef<string>('mouse');
  const pressing = React.useRef(false); // focus caused by a click/tap, not the keyboard
  const tipId = React.useId();

  const show = (delay: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setOpen(false);
  };
  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={`${kind}: ${label}`}
        aria-describedby={open ? tipId : undefined}
        onPointerDown={(e) => {
          lastPointer.current = e.pointerType;
          pressing.current = true;
          window.setTimeout(() => (pressing.current = false), 0);
        }}
        onPointerEnter={(e) => e.pointerType === 'mouse' && show(ICON_TIP_DELAY_MS)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && hide()}
        onFocus={() => !pressing.current && show(0)}
        onBlur={hide}
        onClick={(e) => {
          e.stopPropagation();
          if (lastPointer.current !== 'mouse') setOpen((o) => !o);
        }}
        onKeyDown={(e) => e.key === 'Escape' && hide()}
        className={cx(
          'flex shrink-0 cursor-default items-center justify-center rounded-full bg-[#DADADA] text-[10px] font-semibold text-[#666] outline-none',
          'transition-[transform,background-color,box-shadow] duration-150 ease-out',
          'hover:scale-[1.18] hover:bg-[#C4C4C4] hover:text-[#222] hover:ring-2 hover:ring-offset-2',
          'focus-visible:scale-[1.18] focus-visible:ring-2 focus-visible:ring-offset-2',
          dark ? 'ring-[#EEE] ring-offset-[#141414]' : 'ring-[#222] ring-offset-white',
          open && 'scale-[1.18] bg-[#C4C4C4] text-[#222] ring-2 ring-offset-2',
        )}
        style={{ width: size, height: size }}
      >
        {icon}
      </button>
      {/* Positioning wrapper: motion owns the inner element's transform. */}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-[10px] -translate-x-1/2">
        <AnimatePresence>
          {open && (
            <motion.span
              id={tipId}
              role="tooltip"
              initial={{ opacity: 0, y: 4, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 2, transition: { duration: 0.1 } }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className={cx(
                'relative flex w-max max-w-[220px] flex-col gap-[2px] rounded-lg px-3 py-2 text-left shadow-lg',
                dark ? 'bg-white text-[#222]' : 'bg-[#222] text-white',
              )}
            >
              <span className={cx('text-[10px] font-bold uppercase tracking-wide', dark ? 'text-[#888]' : 'text-[#AAA]')}>{kind}</span>
              <span className="text-[13px] font-medium leading-[17px]">{label}</span>
              <span
                className={cx('absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1 rotate-45', dark ? 'bg-white' : 'bg-[#222]')}
                aria-hidden
              />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </span>
  );
}
