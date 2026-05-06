import React, { useState, memo } from 'react';
import { createPortal } from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { GripVertical, X, Edit3, Trash2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Note } from '../types';
import { cn } from '../lib/utils';
import { TagAutocompleteInput } from './TagAutocompleteInput';
import { motion, AnimatePresence } from 'motion/react';

export const SortableNote = memo(({ 
  note, 
  onUpdate, 
  onDelete, 
  onAddTag, 
  onRemoveTag,
  taggingStatus,
  onRetryTagging,
  onTagClick
}: { 
  note: Note; 
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  taggingStatus?: 'loading' | 'error';
  onRetryTagging?: (id: string, content: string) => void;
  onTagClick?: (tag: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState(note.content);
  const [isManagingTags, setIsManagingTags] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDropFeedback, setShowDropFeedback] = useState(false);

  const [deleteProgress, setDeleteProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const holdStartTimeRef = React.useRef<number | null>(null);
  const progressTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const isDeletedRef = React.useRef(false);

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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <motion.div 
      ref={setNodeRef} 
      style={style} 
      onClick={(e) => {
        if (!isEditing) {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('input')) {
            return;
          }
          const newExpanded = !isExpanded;
          if (newExpanded) {
            const event = new CustomEvent('note-expanding', { detail: { id: note.id, handled: false } });
            window.dispatchEvent(event);
            if (event.detail.handled) {
              setTimeout(() => {
                setIsExpanded(true);
              }, 150); // Wait for the other note to collapse
            } else {
              setIsExpanded(true);
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
        borderColor: isDragOver ? "#6366f1" : "rgb(39 39 42)"
      }}
      transition={{ 
        scale: showDropFeedback 
          ? { type: "keyframes", duration: 0.5, ease: "easeOut" }
          : { type: "spring", stiffness: 400, damping: 25 },
        borderColor: { type: "spring", stiffness: 400, damping: 25 },
        duration: showDropFeedback ? 0.4 : 0.2
      }}
      className={cn(
        "group relative bg-zinc-900 border border-zinc-800 rounded-2xl transition-all cursor-pointer p-5",
        isDragging && "shadow-2xl opacity-50 border-zinc-500",
        isDragOver && "bg-indigo-500/5 ring-4 ring-indigo-500/10"
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
      <div className={cn(
        "flex justify-between items-center gap-4 overflow-hidden transition-all ease-in-out",
        isExpanded ? "duration-300 max-h-12 opacity-100 mb-2" : "duration-150 max-h-0 opacity-0 mb-0"
      )}>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button 
            {...attributes} 
            {...listeners} 
            className={cn(
              "p-1 text-zinc-700 hover:text-zinc-400 cursor-grab active:cursor-grabbing transition-opacity shrink-0",
              isExpanded ? "opacity-100" : "opacity-0"
            )}
          >
            <GripVertical className="w-4 h-4" />
          </button>
          
          <div className="flex flex-wrap items-center gap-2 pb-1 -mb-1">
            {note.tags.map(tag => (
              <span 
                key={tag} 
                className={cn(
                  "group/tag px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-bold text-zinc-400 uppercase tracking-tighter flex items-center gap-1 shrink-0 transition-colors",
                  onTagClick && "cursor-pointer hover:bg-zinc-700 hover:text-zinc-300"
                )}
                onClick={() => onTagClick?.(tag)}
              >
                {tag}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveTag(note.id, tag);
                  }}
                  className="hover:text-red-400 opacity-0 group-hover/tag:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            
            {taggingStatus === 'loading' && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-zinc-800/50 rounded text-[10px] font-bold text-zinc-500 uppercase tracking-tighter shrink-0">
                <Sparkles className="w-3 h-3 animate-spin text-zinc-400" />
                Tagging...
              </span>
            )}

            {taggingStatus === 'error' && (
              <div className="flex items-center gap-1 shrink-0">
                <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-[10px] font-bold text-red-400 uppercase tracking-tighter">
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
                  className="bg-zinc-800 border-none rounded px-2 py-0.5 text-[10px] text-zinc-100 focus:ring-1 focus:ring-zinc-500 w-24"
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
                onClick={() => {
                  setIsManagingTags(true);
                  setNewTagInput('');
                }}
                className={cn(
                  "shrink-0 px-2 py-0.5 border border-dashed border-zinc-700 rounded text-[10px] font-bold text-zinc-500 uppercase tracking-tighter hover:border-zinc-500 hover:text-zinc-300 transition-colors",
                  isExpanded ? "opacity-100" : "opacity-0"
                )}
              >
                + Tag
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[10px] font-mono text-zinc-600 shrink-0">
            {format(note.timestamp, 'HH:mm')}
          </span>
          
          <div className={cn(
            "flex items-center gap-1 transition-opacity shrink-0",
            isExpanded ? "opacity-100" : "opacity-0"
          )}>
            <button 
              onClick={() => {
                setIsEditing(true);
                setEditingContent(note.content);
              }}
              className="p-1.5 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-all"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={(e) => e.stopPropagation()}
              onMouseDown={startDeleteHold}
              onMouseUp={endDeleteHold}
              onMouseLeave={cancelDeleteHold}
              onTouchStart={startDeleteHold}
              onTouchEnd={endDeleteHold}
              className="relative p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all overflow-hidden"
              style={{
                WebkitUserSelect: 'none',
                userSelect: 'none'
              }}
            >
              <div 
                className="absolute inset-0 bg-red-500/20 origin-left" 
                style={{ 
                  transform: `scaleX(${deleteProgress / 100})`,
                  transition: deleteProgress === 0 ? 'none' : 'transform 30ms linear' 
                }} 
              />
              <Trash2 className="relative z-10 w-3.5 h-3.5" />
            </button>
          </div>
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
