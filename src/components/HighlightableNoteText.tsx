import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Highlighter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Segment {
  id: string;
  isHighlight: boolean;
  raw: string;
  text: string;
  rawStart: number;
  rawEnd: number;
  textStart: number;
  textEnd: number;
}

export function parseNoteSegments(content: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /==([\s\S]+?)==/g;
  let lastIndex = 0;
  let visibleOffset = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index);
      segments.push({
        id: `txt-${lastIndex}`,
        isHighlight: false,
        raw: text,
        text: text,
        rawStart: lastIndex,
        rawEnd: match.index,
        textStart: visibleOffset,
        textEnd: visibleOffset + text.length,
      });
      visibleOffset += text.length;
    }

    const highlightText = match[1];
    segments.push({
      id: `hl-${match.index}`,
      isHighlight: true,
      raw: match[0],
      text: highlightText,
      rawStart: match.index,
      rawEnd: match.index + match[0].length,
      textStart: visibleOffset,
      textEnd: visibleOffset + highlightText.length,
    });
    visibleOffset += highlightText.length;
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    const text = content.slice(lastIndex);
    segments.push({
      id: `txt-${lastIndex}`,
      isHighlight: false,
      raw: text,
      text: text,
      rawStart: lastIndex,
      rawEnd: content.length,
      textStart: visibleOffset,
      textEnd: visibleOffset + text.length,
    });
  }

  return segments;
}

function applyHighlight(content: string, segments: Segment[], visibleStart: number, visibleEnd: number): string {
  let beforeParts = '';
  let selectedParts = '';
  let afterParts = '';

  for (const seg of segments) {
    if (seg.textEnd <= visibleStart) {
      beforeParts += seg.raw;
    } else if (seg.textStart >= visibleEnd) {
      afterParts += seg.raw;
    } else {
      const segText = seg.text;
      const overlapStart = Math.max(0, visibleStart - seg.textStart);
      const overlapEnd = Math.min(segText.length, visibleEnd - seg.textStart);

      const beforeText = segText.slice(0, overlapStart);
      const selText = segText.slice(overlapStart, overlapEnd);
      const afterText = segText.slice(overlapEnd);

      if (beforeText) {
        beforeParts += seg.isHighlight ? `==${beforeText}==` : beforeText;
      }
      if (selText) {
        selectedParts += selText;
      }
      if (afterText) {
        afterParts += seg.isHighlight ? `==${afterText}==` : afterText;
      }
    }
  }

  const trimmedSel = selectedParts.trim();
  if (!trimmedSel) return content;

  const leadingSpaces = selectedParts.match(/^\s*/)?.[0] || '';
  const trailingSpaces = selectedParts.match(/\s*$/)?.[0] || '';

  return `${beforeParts}${leadingSpaces}==${trimmedSel}==${trailingSpaces}${afterParts}`;
}

interface SelectionPopupState {
  x: number;
  y: number;
  visibleStart: number;
  visibleEnd: number;
  placeBelow: boolean;
}

interface HoveredHighlightState {
  segment: Segment;
  x: number;
  y: number;
  placeBelow: boolean;
}

interface HighlightableNoteTextProps {
  content: string;
  noteId?: string;
  onUpdate?: (newContent: string) => void;
  readOnly?: boolean;
  className?: string;
}

export const HighlightableNoteText: React.FC<HighlightableNoteTextProps> = ({
  content,
  onUpdate,
  readOnly = false,
  className = "text-zinc-200 leading-relaxed text-sm"
}) => {
  const containerRef = useRef<HTMLParagraphElement>(null);
  const [popup, setPopup] = useState<SelectionPopupState | null>(null);
  const [hoveredHighlight, setHoveredHighlight] = useState<HoveredHighlightState | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const segments = parseNoteSegments(content);

  const checkSelection = useCallback(() => {
    if (readOnly || !onUpdate) return;
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      setPopup(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const container = containerRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) {
      setPopup(null);
      return;
    }

    const selectedText = selection.toString();
    if (!selectedText.trim()) {
      setPopup(null);
      return;
    }

    // Calculate character offsets relative to container's visible text
    const preRange = range.cloneRange();
    preRange.selectNodeContents(container);
    preRange.setEnd(range.startContainer, range.startOffset);
    const visibleStart = preRange.toString().length;
    const visibleEnd = visibleStart + selectedText.length;

    // Get screen coordinates of the selection
    const rect = range.getBoundingClientRect();
    const placeBelow = rect.top < 60;
    const x = rect.left + rect.width / 2;
    const y = placeBelow ? rect.bottom + 8 : rect.top - 8;

    setPopup({
      x,
      y,
      visibleStart,
      visibleEnd,
      placeBelow
    });
  }, [readOnly, onUpdate]);

  // Handle pointer/keyboard selection release
  useEffect(() => {
    if (readOnly || !onUpdate) return;

    const handleMouseUp = () => {
      setTimeout(checkSelection, 20);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['Shift', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        setTimeout(checkSelection, 20);
      }
    };

    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setPopup(null);
      }
    };

    const handleScrollOrResize = () => {
      setPopup(null);
      setHoveredHighlight(null);
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('selectionchange', handleSelectionChange);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [checkSelection, readOnly, onUpdate]);

  const handleApplyHighlight = () => {
    if (!popup || !onUpdate) return;
    const newContent = applyHighlight(content, segments, popup.visibleStart, popup.visibleEnd);
    
    // Clear selection
    window.getSelection()?.removeAllRanges();
    setPopup(null);

    if (newContent !== content) {
      onUpdate(newContent);
    }
  };

  const handleRemoveSegment = (segmentToRemove: Segment) => {
    if (!onUpdate) return;
    const newContent = content.slice(0, segmentToRemove.rawStart) + segmentToRemove.text + content.slice(segmentToRemove.rawEnd);
    setHoveredHighlight(null);
    onUpdate(newContent);
  };

  const handleMarkEnter = (segment: Segment, el: HTMLElement) => {
    if (readOnly || !onUpdate) return;
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    const rect = el.getBoundingClientRect();
    const placeBelow = rect.top < 40;
    setHoveredHighlight({
      segment,
      x: rect.left + rect.width / 2,
      y: placeBelow ? rect.bottom + 4 : rect.top - 4,
      placeBelow
    });
  };

  const handleMarkLeave = () => {
    if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    leaveTimeoutRef.current = setTimeout(() => {
      setHoveredHighlight(null);
    }, 180);
  };

  return (
    <>
      <p ref={containerRef} className={className}>
        {segments.map((segment) => {
          if (!segment.isHighlight) {
            return <React.Fragment key={segment.id}>{segment.text}</React.Fragment>;
          }

          return (
            <mark
              key={segment.id}
              onMouseEnter={(e) => handleMarkEnter(segment, e.currentTarget)}
              onMouseLeave={handleMarkLeave}
              className="bg-gradient-to-r from-violet-500/30 via-purple-500/30 to-indigo-500/30 text-violet-100 font-medium px-1 py-0.5 border-b border-violet-400/50 shadow-none transition-colors hover:from-violet-500/40 hover:to-indigo-500/40 cursor-pointer rounded-none inline"
              style={{
                boxDecorationBreak: 'clone',
                WebkitBoxDecorationBreak: 'clone',
              }}
            >
              {segment.text}
            </mark>
          );
        })}
      </p>

      {/* Hover Remove Badge on High Z-Index Portal */}
      {hoveredHighlight && !readOnly && typeof document !== 'undefined' && createPortal(
        <div
          style={{
            position: 'fixed',
            left: `${hoveredHighlight.x}px`,
            top: `${hoveredHighlight.y}px`,
            transform: hoveredHighlight.placeBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
            zIndex: 99999,
          }}
          onMouseEnter={() => {
            if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
          }}
          onMouseLeave={handleMarkLeave}
          className="pointer-events-auto select-none"
        >
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRemoveSegment(hoveredHighlight.segment);
            }}
            className="flex items-center gap-1 px-2 py-0.5 bg-zinc-950 border border-zinc-700/90 hover:border-red-500/60 hover:bg-red-500/15 text-zinc-300 hover:text-red-300 shadow-2xl text-[10px] font-mono transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap cursor-pointer rounded-none"
            title="Remove highlight"
          >
            <X className="w-2.5 h-2.5" />
            <span>Remove</span>
          </button>
        </div>,
        document.body
      )}

      {/* Floating Highlight Action Popup on High Z-Index Portal */}
      {popup && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: popup.placeBelow ? -4 : 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: popup.placeBelow ? -4 : 4 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              left: `${popup.x}px`,
              top: `${popup.y}px`,
              transform: popup.placeBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
              zIndex: 99999,
            }}
            className="pointer-events-auto select-none"
          >
            <button
              type="button"
              onMouseDown={(e) => {
                // Prevent loss of selection before click finishes
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleApplyHighlight();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950 border border-violet-500/60 text-violet-200 shadow-[0_8px_24px_rgba(0,0,0,0.8),0_0_16px_rgba(139,92,246,0.35)] hover:bg-zinc-900 hover:border-violet-400 hover:text-white transition-all transform hover:scale-105 active:scale-95 text-xs font-semibold backdrop-blur-md cursor-pointer rounded-none"
              title="Highlight selected text with gradient"
            >
              <div className="w-1.5 h-1.5 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              <Highlighter className="w-3.5 h-3.5 text-violet-400" />
              <span className="tracking-wide text-[11px] font-medium uppercase">Highlight</span>
            </button>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};
