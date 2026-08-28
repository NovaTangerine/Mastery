import React, { useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { X, Edit2, Edit3, Trash2, Sparkles, AlertCircle, RefreshCw, MoreVertical, Check, FolderOutput, ArrowLeft, Tag } from 'lucide-react';
import { Note } from '../types';
import { cn } from '../lib/utils';
import { TagAutocompleteInput } from './TagAutocompleteInput';
import { motion, AnimatePresence } from 'motion/react';
import { useFloating, offset, flip, shift, autoUpdate, FloatingPortal } from '@floating-ui/react';
import { useUI } from '../contexts/UIContext';

function NoteTagPill({
  tag,
  noteId,
  onTagClick,
  onRemoveTag,
  onRenameTag
}: {
  tag: string;
  noteId: string;
  onTagClick?: (tag: string) => void;
  onRemoveTag: (noteId: string, tag: string) => void;
  onRenameTag?: (oldTag: string, newTag: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(tag.replace(/^#/, ''));
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);

  const { refs, floatingStyles } = useFloating({
    open: isMenuOpen,
    onOpenChange: setIsMenuOpen,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    placement: 'bottom-start'
  });

  React.useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (refs.reference.current && (refs.reference.current as HTMLElement).contains(target)) {
        return;
      }
      if (refs.floating.current && (refs.floating.current as HTMLElement).contains(target)) {
        return;
      }
      setIsMenuOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen, refs]);

  const handleSaveRename = () => {
    const trimmed = editValue.trim().toLowerCase().replace(/^#/, '');
    if (trimmed && trimmed !== tag.replace(/^#/, '')) {
      onRenameTag?.(tag, trimmed);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div 
        className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 rounded text-[10px] font-mono shrink-0 select-none z-20"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-zinc-500 select-none">#</span>
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSaveRename();
            } else if (e.key === 'Escape') {
              setIsEditing(false);
              setEditValue(tag.replace(/^#/, ''));
            }
          }}
          autoFocus
          className="bg-transparent text-zinc-100 text-[10px] font-mono outline-none w-16 px-0.5 py-0"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSaveRename();
          }}
          className="text-zinc-400 hover:text-emerald-400 p-0.5 transition-colors"
          title="Save tag"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(false);
            setEditValue(tag.replace(/^#/, ''));
          }}
          className="text-zinc-400 hover:text-red-400 p-0.5 transition-colors"
          title="Cancel"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <div className="group/tag relative inline-flex items-center">
      <span 
        ref={refs.setReference}
        className={cn(
          "inline-flex items-center pl-1.5 pr-1.5 group-hover/tag:pr-1 py-0.5 border rounded text-[10px] font-mono font-medium uppercase tracking-wide shrink-0 transition-all select-none",
          "group-hover:text-zinc-300",
          !isButtonHovered && !isMenuOpen ? (
            "bg-transparent border-transparent text-zinc-500 hover:bg-indigo-500/15 hover:border-indigo-500/30 hover:text-indigo-200"
          ) : (
            "border-indigo-400 bg-indigo-500/20 text-indigo-200 shadow-[0_0_8px_rgba(99,102,241,0.2)]"
          ),
          isMenuOpen && "!pr-1",
          onTagClick && "cursor-pointer"
        )}
        onClick={() => onTagClick?.(tag)}
      >
        <span className="transition-colors">#{tag.replace(/^#/, '')}</span>
        <button 
          type="button"
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className={cn(
            "w-0 opacity-0 overflow-hidden group-hover/tag:w-3.5 group-hover/tag:h-4 group-hover/tag:opacity-100 group-hover/tag:ml-[2px] -mr-0.5 text-zinc-500 hover:text-zinc-100 transition-all duration-150 shrink-0 flex items-center justify-center rounded cursor-pointer",
            isMenuOpen && "w-3.5 h-4 opacity-100 ml-[2px] -mr-0.5 text-zinc-100"
          )}
          title={`Tag options for "${tag}"`}
        >
          <MoreVertical className="w-2.5 h-2.5 shrink-0" />
        </button>
      </span>

      <FloatingPortal>
        {isMenuOpen && (
          <div 
            ref={refs.setFloating}
            style={floatingStyles}
            className="min-w-[150px] w-auto bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-[9999] py-1 flex flex-col whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsEditing(true);
                setEditValue(tag.replace(/^#/, ''));
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors text-left whitespace-nowrap"
            >
              <Edit2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Edit tag</span>
            </button>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                onRemoveTag(noteId, tag);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left border-t border-zinc-800/60 mt-0.5 pt-1.5 whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5 shrink-0" />
              <span>Remove from note</span>
            </button>
          </div>
        )}
      </FloatingPortal>
    </div>
  );
}

export const SortableNote = memo(({ 
  note, 
  onUpdate, 
  onDelete, 
  onAddTag, 
  onRemoveTag,
  onRenameTag,
  taggingStatus,
  onRetryTagging,
  onTagClick,
  availableSessions,
  onMoveNote
}: { 
  note: Note; 
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  onRenameTag?: (oldTag: string, newTag: string) => void;
  taggingStatus?: 'loading' | 'error';
  onRetryTagging?: (id: string, content: string) => void;
  onTagClick?: (tag: string) => void;
  availableSessions?: {id: string, name: string}[];
  onMoveNote?: (newSessionId: string) => void;
}) => {
  const { defaultTagVisibility } = useUI();
  const [isEditing, setIsEditing] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHoveringMove, setIsHoveringMove] = useState(false);
  const [editingContent, setEditingContent] = useState(note.content);
  const [isManagingTags, setIsManagingTags] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDropFeedback, setShowDropFeedback] = useState(false);

  const [deleteProgress, setDeleteProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const holdStartTimeRef = React.useRef<number | null>(null);
  const progressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isDeletedRef = React.useRef(false);

  const { refs, floatingStyles } = useFloating({
    open: isMenuOpen,
    placement: 'bottom-end',
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
  });

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (refs.reference.current && (refs.reference.current as HTMLElement).contains(target)) {
        return;
      }
      if (refs.floating.current && (refs.floating.current as HTMLElement).contains(target)) {
        return;
      }
      setIsMenuOpen(false);
      setIsHoveringMove(false);
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen, refs]);

  const HOLD_DURATION = 500;
  const UPDATE_INTERVAL = 30;

  const startDeleteHold = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    isDeletedRef.current = false;
    holdStartTimeRef.current = Date.now();
    
    progressTimerRef.current = setInterval(() => {
      if (!holdStartTimeRef.current) return;
      
      const elapsed = Date.now() - holdStartTimeRef.current;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setDeleteProgress(progress);
      
      if (progress >= 100) {
        isDeletedRef.current = true;
        clearProgress();
        onDelete(note.id);
      }
    }, UPDATE_INTERVAL);
  };

  const clearProgress = () => {
    setDeleteProgress(0);
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    holdStartTimeRef.current = null;
  };

  const endDeleteHold = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (isDeletedRef.current) return;
    if (!holdStartTimeRef.current) return; // Prevent modal if we cancelled the hold

    const heldDuration = Date.now() - holdStartTimeRef.current;
    clearProgress();

    // Trigger modal limit: a normal click is very short usually. If they let go before full hold, show modal
    if (heldDuration < HOLD_DURATION) {
      setShowDeleteConfirm(true);
    }
  };

  const cancelDeleteHold = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (isDeletedRef.current) return;
    clearProgress();
  };

  React.useEffect(() => {
    const handleNoteExpanding = (e: CustomEvent) => {
      if (e.detail.id !== note.id && isExpanded) {
        e.detail.handled = true;
        setIsExpanded(false);
      }
    };
    window.addEventListener('note-expanding', handleNoteExpanding as EventListener);
    return () => {
      window.removeEventListener('note-expanding', handleNoteExpanding as EventListener);
    };
  }, [isExpanded, note.id]);

  const nodeRef = React.useRef<HTMLDivElement | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: note.id });

  const mergedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      nodeRef.current = node;
    },
    [setNodeRef]
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const renderTags = () => (
    <div className="flex flex-wrap items-center gap-[2px] pb-1 -mb-1">
      {note.tags.length > 0 || isManagingTags || taggingStatus ? (
        <span className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-500 transition-colors duration-200 uppercase tracking-wide shrink-0 select-none mr-0.5">
          Tags:
        </span>
      ) : (
        <span className="text-[10px] font-mono text-zinc-600 group-hover:text-zinc-500 transition-all duration-200 uppercase tracking-wide shrink-0 select-none mr-0.5 opacity-0 group-hover:opacity-100">
          Tags:
        </span>
      )}
      {note.tags.map(tag => (
        <NoteTagPill
          key={tag}
          tag={tag}
          noteId={note.id}
          onTagClick={onTagClick}
          onRemoveTag={onRemoveTag}
          onRenameTag={onRenameTag}
        />
      ))}
      
      {taggingStatus === 'loading' && (
        <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800/50 rounded text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-wide shrink-0">
          <Sparkles className="w-3 h-3 animate-spin text-zinc-400" />
          Tagging...
        </span>
      )}

      {taggingStatus === 'error' && (
        <div className="flex items-center gap-1 shrink-0">
          <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[10px] font-mono font-medium text-red-400 uppercase tracking-wide">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
          <button 
            onClick={() => onRetryTagging?.(note.id, note.content)}
            className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Retry AI Tagging"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      )}

      {!taggingStatus && isManagingTags ? (
        <div className="flex items-center gap-1 shrink-0">
          <TagAutocompleteInput
            gameId={note.gameId}
            value={newTagInput}
            onChange={setNewTagInput}
            onAddTag={(tag) => {
              const trimmed = tag.trim().toLowerCase();
              if (trimmed) onAddTag(note.id, trimmed);
              setIsManagingTags(false);
              setNewTagInput('');
            }}
            onBlur={() => {
              if (newTagInput.trim()) {
                onAddTag(note.id, newTagInput.trim().toLowerCase());
              }
              setIsManagingTags(false);
              setNewTagInput('');
            }}
            onEscape={() => {
              setIsManagingTags(false);
              setNewTagInput('');
            }}
            existingTags={note.tags}
            placeholder="New tag..."
            autoFocus
            className="bg-zinc-800 border-none rounded px-2 py-0.5 text-[10px] font-mono text-zinc-100 focus:ring-1 focus:ring-zinc-500 w-24"
          />
          <button 
            onMouseDown={(e) => {
              e.preventDefault(); // Prevent onBlur from firing
              setIsManagingTags(false);
              setNewTagInput('');
            }}
          >
            <X className="w-3 h-3 text-zinc-500" />
          </button>
        </div>
      ) : (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsManagingTags(true);
            setNewTagInput('');
          }}
          className="shrink-0 px-2 py-0.5 border border-dashed border-zinc-700/80 rounded text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-wide hover:border-zinc-500 hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100"
        >
          + Tag
        </button>
      )}
    </div>
  );

  return (
    <motion.div 
      ref={mergedRef} 
      style={style} 
      onClick={(e) => {
        if (!isEditing) {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('input')) {
            return;
          }
          
          // Don't trigger expand/collapse if the user is highlighting text
          if (window.getSelection()?.toString().length) {
            return;
          }

          const newExpanded = !isExpanded;
          if (newExpanded) {
            const event = new CustomEvent('note-expanding', { detail: { id: note.id, handled: false } });
            window.dispatchEvent(event);
            const expandAndScroll = () => {
              setIsExpanded(true);
              setTimeout(() => {
                if (nodeRef.current) {
                  nodeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
              }, 300);
            };

            if (event.detail.handled) {
              setTimeout(expandAndScroll, 150); // Wait for the other note to collapse
            } else {
              expandAndScroll();
            }
          } else {
            setIsExpanded(false);
          }
        }
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('application/x-game-log-tag')) {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(true);
        }
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
      }}
      onDrop={(e) => {
        const tag = e.dataTransfer.getData('application/x-game-log-tag');
        if (tag) {
          e.preventDefault();
          e.stopPropagation();
          setIsDragOver(false);
          setShowDropFeedback(true);
          setTimeout(() => setShowDropFeedback(false), 800);
          onAddTag(note.id, tag);
        }
      }}
      initial={false}
      animate={{
        scale: isDragOver ? 1.02 : showDropFeedback ? [1, 1.05, 0.98, 1] : 1,
        borderColor: isDragOver ? "#6366f1" : "rgb(39 39 42)",
        zIndex: isMenuOpen ? 50 : "auto"
      }}
      transition={{ 
        scale: showDropFeedback 
          ? { type: "keyframes", duration: 0.5, ease: "easeOut" }
          : { type: "spring", stiffness: 400, damping: 25 },
        borderColor: { type: "spring", stiffness: 400, damping: 25 },
        zIndex: { duration: 0 },
        duration: showDropFeedback ? 0.4 : 0.2
      }}
      className={cn(
        "group relative transition-all cursor-pointer px-4 pt-5 pb-6 sm:px-6 lg:px-8 hover:bg-zinc-900/50",
        isDragging && "shadow-2xl opacity-50 bg-zinc-900",
        isDragOver && "bg-indigo-500/5 ring-4 ring-indigo-500/10",
        isMenuOpen && "z-[9999]"
      )}
    >
      {/* Drop Feedback Particles */}
      <AnimatePresence>
        {showDropFeedback && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                animate={{ 
                  scale: [0, 1.5, 0],
                  x: Math.cos((i * 30) * Math.PI / 180) * 80,
                  y: Math.sin((i * 30) * Math.PI / 180) * 80,
                  opacity: [1, 1, 0]
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute w-1.5 h-1.5 bg-indigo-400 rounded-full"
              />
            ))}
            <motion.div 
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute w-20 h-20 rounded-full border-2 border-indigo-500"
            />
          </div>
        )}
      </AnimatePresence>
      {/* Top Header - Displayed by default */}
      <div className={cn(
        "flex justify-between items-center gap-3 mb-2.5 sm:mb-3 transition-all",
        isMenuOpen ? "overflow-visible" : "overflow-hidden"
      )}>
        <div className="flex items-center gap-2 min-w-0 flex-1 relative h-6">
          <span className="text-[10px] font-mono text-zinc-600 group-hover:text-indigo-400 transition-colors duration-200 shrink-0 select-none uppercase tracking-wider">
            {format(note.timestamp, 'MMM d, yyyy · HH:mm')}
          </span>
          
          {/* Top Row Hover Add Tag Button (only shows when note has no tags) */}
          {note.tags.length === 0 && !isManagingTags && !taggingStatus && !isMobile && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsManagingTags(true);
                setNewTagInput('');
              }}
              className="ml-1 px-2 py-0.5 border border-dashed border-zinc-700/80 rounded text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-wide hover:border-zinc-500 hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100 whitespace-nowrap"
            >
              + Tag
            </button>
          )}
        </div>

        <div className={cn(
          "relative transition-opacity shrink-0",
          isMenuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <button 
            ref={refs.setReference}
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
              setIsHoveringMove(false);
            }}
            className={`p-1.5 rounded-lg transition-all ${isMenuOpen ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800'}`}
            title="More options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          <FloatingPortal>
              {isMenuOpen && (
                <div 
                  ref={refs.setFloating}
                  style={floatingStyles}
                  className="min-w-[180px] w-auto bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-[9999] py-1 flex flex-col whitespace-nowrap"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsEditing(true);
                      setEditingContent(note.content);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors whitespace-nowrap"
                  >
                    <Edit3 className="w-4 h-4 shrink-0" />
                    <span>Edit Note</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsManagingTags(true);
                      setNewTagInput('');
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors whitespace-nowrap"
                  >
                    <Tag className="w-4 h-4 shrink-0" />
                    <span>Add Tag</span>
                  </button>
                  
                  {availableSessions && availableSessions.filter(s => s.id !== (note.sessionId || 'global') && s.id !== (note.isGlobal ? 'global' : null)).length > 0 && onMoveNote && (
                    <div 
                      className="relative"
                      onMouseEnter={() => {
                        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                        setIsHoveringMove(true);
                      }}
                      onMouseLeave={() => {
                        hoverTimeoutRef.current = setTimeout(() => {
                           setIsHoveringMove(false);
                        }, 300);
                      }}
                    >
                      <button
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors whitespace-nowrap gap-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          // For touch devices, toggle submenu
                          setIsHoveringMove(!isHoveringMove);
                        }}
                      >
                        <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
                          <FolderOutput className="w-4 h-4 shrink-0" />
                          <span>Move to Session</span>
                        </div>
                        <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                      </button>
                      
                      {isHoveringMove && (
                        <div className="absolute right-full top-0 mr-1 min-w-[180px] w-auto bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl py-1 max-h-64 overflow-y-auto z-[10000] flex flex-col custom-scrollbar">
                          {availableSessions.filter(s => s.id !== (note.sessionId || 'global') && s.id !== (note.isGlobal ? 'global' : null)).map(session => (
                            <button
                              key={session.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onMoveNote(session.id);
                                setIsMenuOpen(false);
                                setIsHoveringMove(false);
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors truncate whitespace-nowrap"
                            >
                              {session.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors whitespace-nowrap border-t border-zinc-800/60 mt-1 pt-2"
                  >
                    <Trash2 className="w-4 h-4 shrink-0" />
                    <span>Delete Note</span>
                  </button>
                </div>
              )}
          </FloatingPortal>
          </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <textarea 
            autoFocus
            value={editingContent}
            onChange={(e) => setEditingContent(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-zinc-100 text-sm focus:ring-1 focus:ring-zinc-500 min-h-[80px] resize-none"
          />
          <div className="flex justify-end gap-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-300"
            >
              Cancel
            </button>
            <button 
              onClick={() => {
                onUpdate(note.id, editingContent);
                setIsEditing(false);
              }}
              className="px-3 py-1.5 bg-zinc-100 text-zinc-950 rounded-lg text-xs font-bold hover:bg-white"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="text-zinc-200 leading-relaxed text-sm">{note.content}</p>
      )}

      {/* Tags at the bottom of the note on all breakpoints */}
      <AnimatePresence initial={false}>
        {(note.tags.length > 0 || isManagingTags || !!taggingStatus) && (defaultTagVisibility || isExpanded || isManagingTags) && (
          <motion.div 
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 20 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {renderTags()}
          </motion.div>
        )}
      </AnimatePresence>

      {showDeleteConfirm && createPortal(
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur z-[9999] flex items-center justify-center p-4 cursor-default">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-2 text-white">Delete Note?</h3>
            <p className="text-zinc-400 text-sm mb-6">
              This action cannot be undone. <br/><br/>
              <span className="opacity-70 italic text-xs">Tip: You can skip this by clicking and holding the delete button for 0.5 seconds.</span>
            </p>
            <div className="flex gap-3">
              <button 
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); onDelete(note.id); }}
                className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold py-3 rounded-xl transition-colors"
              >
                Delete Note
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </motion.div>
  );
});

SortableNote.displayName = 'SortableNote';
