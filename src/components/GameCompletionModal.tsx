import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Star, Plus, Loader2, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { getPaletteSync } from 'colorthief';
import { Game, GameCompletion } from '../types';

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 40;
const MAX_REVIEW_WORDS = 500;

const SUGGESTED_TAGS = [
  'GOTY Candidate',
  'Original IP',
  'Masterpiece',
  'Hidden Gem',
  'Overrated',
  'Overhyped',
  'Underrated',
  'Would Replay',
  'Great Story',
  'Great Soundtrack',
];

const countWords = (text: string) => {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
};

interface GameCompletionModalProps {
  isOpen: boolean;
  game: Game;
  onClose: () => void;
  onSubmit: (completion: Omit<GameCompletion, 'completedAt'>) => Promise<boolean>;
}

export default function GameCompletionModal({ isOpen, game, onClose, onSubmit }: GameCompletionModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buttonGradient, setButtonGradient] = useState<string | null>(null);
  const [buttonTextColor, setButtonTextColor] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRating(game.completion?.rating || 0);
      setHoverRating(0);
      setTags(game.completion?.tags || []);
      setTagInput('');
      setReview(game.completion?.review || '');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const wordCount = countWords(review);
  const isOverWordLimit = wordCount > MAX_REVIEW_WORDS;
  const canSubmit = rating > 0 && !isOverWordLimit && !isSubmitting;

  const addTag = (raw: string) => {
    const tag = raw.trim().slice(0, MAX_TAG_LENGTH);
    if (!tag || tags.length >= MAX_TAGS) return;
    if (tags.some(t => t.toLowerCase() === tag.toLowerCase())) return;
    setTags([...tags, tag]);
  };

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    const pendingTag = tagInput.trim();
    const finalTags = pendingTag && tags.length < MAX_TAGS && !tags.some(t => t.toLowerCase() === pendingTag.toLowerCase())
      ? [...tags, pendingTag.slice(0, MAX_TAG_LENGTH)]
      : tags;
    try {
      const success = await onSubmit({ rating, tags: finalTags, review: review.trim() });
      if (success) onClose();
    } catch (err) {
      console.error(err);
      toast.error("Couldn't submit your review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoverLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    try {
      const palette = getPaletteSync(e.currentTarget, { colorCount: 8 });
      if (!palette || palette.length === 0) return;
      let vibrantColor = palette[0];
      let maxVibrancy = -1;
      for (const color of palette) {
        const { s, l } = color.hsl();
        if (l > 15 && l < 85) {
          const score = s - Math.abs(50 - l) * 0.5;
          if (score > maxVibrancy) {
            maxVibrancy = score;
            vibrantColor = color;
          }
        }
      }
      const { h, s, l } = vibrantColor.hsl();
      const baseS = Math.max(s, 50);
      const baseL = Math.max(Math.min(l, 60), 30);
      const lightVariation = `hsl(${h}, ${Math.min(baseS + 20, 100)}%, ${Math.min(baseL + 30, 85)}%)`;
      const baseVariation = `hsl(${h}, ${baseS}%, ${baseL}%)`;
      const darkVariation = `hsl(${h}, ${Math.min(baseS + 15, 100)}%, ${Math.max(baseL - 25, 15)}%)`;
      setButtonGradient(`radial-gradient(120% 120% at 50% 0%, ${lightVariation} 0%, ${baseVariation} 40%, ${darkVariation} 100%)`);
      setButtonTextColor(vibrantColor.textColor);
    } catch (err) {
      console.warn('Could not extract colors from image.', err);
    }
  };

  const displayRating = hoverRating || rating;
  const hasCover = game.coverUrl && game.coverUrl !== 'null';
  const unusedSuggestions = SUGGESTED_TAGS.filter(s => !tags.some(t => t.toLowerCase() === s.toLowerCase()));

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-zinc-950/50 backdrop-blur-[12px]"
          />
          <div className="fixed inset-0 z-[101] flex items-start justify-center pt-[10vh] px-4 sm:px-6 pointer-events-none">
            <motion.div
              transition={{
                opacity: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
                scale: { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
              }}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="relative w-full max-w-[800px] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] pointer-events-auto"
            >
              <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
                <p className="flex-1 pl-2 text-lg text-zinc-100">Mark as Completed</p>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
                >
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              <div className="overflow-y-auto overflow-x-hidden flex-1" style={{ scrollbarGutter: 'stable' }}>
                <div className="p-5 flex flex-col max-w-[720px] mx-auto w-full">
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    <div className="hidden sm:block w-48 aspect-[264/374] bg-zinc-800 rounded-md overflow-hidden shrink-0 shadow-[0_1px_3px_rgba(0,0,0,0.35)] relative mt-1.5 self-start">
                      <div className="absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)] rounded-md z-20 pointer-events-none" />
                      {hasCover ? (
                        <img
                          src={game.coverUrl}
                          alt={game.title}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                          onLoad={handleCoverLoad}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-zinc-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="pl-[13px] sm:pl-[11px] sm:ml-2 pt-2 text-zinc-100">
                        <h3 className="text-2xl sm:text-3xl font-medium tracking-tight leading-tight">
                          {game.title}
                        </h3>
                      </div>

                      <div className="mt-3 sm:mt-4 ml-0 sm:ml-2 bg-zinc-900/40 border border-zinc-800/60 pr-3 pl-3 sm:pl-2.5 py-3 sm:py-4 flex flex-col gap-5">
                        {/* Rating */}
                        <div className="space-y-1.5">
                          <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Your Rating</p>
                          <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
                            {[1, 2, 3, 4, 5].map(value => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setRating(value === rating ? 0 : value)}
                                onMouseEnter={() => setHoverRating(value)}
                                className="p-0.5 transition-transform active:scale-90"
                                title={`${value} star${value > 1 ? 's' : ''}`}
                              >
                                <Star
                                  className={`w-6 h-6 transition-colors ${
                                    value <= displayRating ? 'text-amber-400 fill-amber-400' : 'text-zinc-700'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Tags */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Tags</p>
                            <span className="text-[10px] text-zinc-500">{tags.length} / {MAX_TAGS}</span>
                          </div>
                          {tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {tags.map(tag => (
                                <span key={tag} className="flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-lg bg-zinc-800 text-zinc-200 text-xs">
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="p-0.5 rounded text-zinc-500 hover:text-zinc-100 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                          {tags.length < MAX_TAGS && (
                            <>
                              <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ',') {
                                    e.preventDefault();
                                    addTag(tagInput);
                                    setTagInput('');
                                  } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
                                    removeTag(tags[tags.length - 1]);
                                  }
                                }}
                                maxLength={MAX_TAG_LENGTH}
                                placeholder="Add a tag, e.g. Best Metroidvania"
                                className="w-full h-[38px] bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-[16px] sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 transition-colors"
                              />
                              {unusedSuggestions.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {unusedSuggestions.map(suggestion => (
                                    <button
                                      key={suggestion}
                                      type="button"
                                      onClick={() => addTag(suggestion)}
                                      className="flex items-center gap-1 px-2 py-1 rounded-lg border border-zinc-800 text-zinc-500 hover:text-zinc-200 hover:border-zinc-700 text-xs transition-colors"
                                    >
                                      <Plus className="w-3 h-3" />
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Review */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] uppercase tracking-wider font-semibold text-zinc-500">Review</p>
                            <span className={`text-[10px] ${isOverWordLimit ? 'text-red-400' : 'text-zinc-500'}`}>
                              {wordCount} / {MAX_REVIEW_WORDS} words
                            </span>
                          </div>
                          <textarea
                            value={review}
                            onChange={(e) => setReview(e.target.value)}
                            rows={6}
                            placeholder="How did it land for you? What stuck with you after the credits rolled?"
                            className={`w-full bg-zinc-950 border rounded-xl px-3 py-2.5 text-[16px] sm:text-sm text-zinc-100 leading-relaxed placeholder:text-zinc-600 focus:outline-none transition-colors resize-none ${
                              isOverWordLimit ? 'border-red-500/50 focus:border-red-500/70' : 'border-zinc-800 focus:border-zinc-600'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-zinc-800 flex flex-col sm:flex-row gap-3 pb-1 sm:pb-2.5">
                    <button
                      onClick={onClose}
                      className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold py-3 rounded-xl transition-all active:scale-95 text-sm order-2 sm:order-1"
                    >
                      CANCEL
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={!canSubmit}
                      style={{
                        background: buttonGradient || undefined,
                        color: buttonTextColor || undefined
                      }}
                      className={`flex-[2] ${!buttonGradient ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950' : ''} disabled:opacity-50 disabled:cursor-not-allowed font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 text-sm relative overflow-hidden order-1 sm:order-2`}
                    >
                      <div className="absolute inset-0 bg-white/0 hover:bg-white/20 transition-colors pointer-events-none" />
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                          <span className="relative z-10">SUBMITTING...</span>
                        </>
                      ) : (
                        <span className="relative z-10">SUBMIT REVIEW</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
