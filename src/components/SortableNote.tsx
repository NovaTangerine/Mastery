import React, { useState, memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { GripVertical, X, Edit3, Trash2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { Note } from '../types';
import { cn } from '../lib/utils';

export const SortableNote = memo(({ 
  note, 
  onUpdate, 
  onDelete, 
  onAddTag, 
  onRemoveTag,
  taggingStatus,
  onRetryTagging
}: { 
  note: Note; 
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  taggingStatus?: 'loading' | 'error';
  onRetryTagging?: (id: string, content: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState(note.content);
  const [isManagingTags, setIsManagingTags] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

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
    <div 
      ref={setNodeRef} 
      style={style} 
      onClick={(e) => {
        if (!isEditing) {
          const target = e.target as HTMLElement;
          if (target.closest('button') || target.closest('input')) {
            return;
          }
          setIsExpanded(!isExpanded);
        }
      }}
      className={cn(
        "group relative bg-zinc-900 border border-zinc-800 rounded-2xl transition-all hover:border-zinc-700 cursor-pointer p-5",
        isDragging && "shadow-2xl border-zinc-500"
      )}
    >
      <div className={cn(
        "flex justify-between items-center gap-4 overflow-hidden transition-all duration-300 ease-in-out",
        isExpanded ? "max-h-12 opacity-100 mb-2" : "max-h-0 opacity-0 mb-0"
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
          
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {note.tags.map(tag => (
              <span 
                key={tag} 
                className="group/tag px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-bold text-zinc-400 uppercase tracking-tighter flex items-center gap-1 shrink-0"
              >
                {tag}
                <button 
                  onClick={() => onRemoveTag(note.id, tag)}
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
                <input 
                  autoFocus
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onBlur={() => {
                    if (newTagInput.trim()) {
                      onAddTag(note.id, newTagInput);
                    }
                    setIsManagingTags(false);
                    setNewTagInput('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onAddTag(note.id, newTagInput);
                      setIsManagingTags(false);
                      setNewTagInput('');
                    } else if (e.key === 'Escape') {
                      setIsManagingTags(false);
                      setNewTagInput('');
                    }
                  }}
                  placeholder="New tag..."
                  className="bg-zinc-800 border-none rounded px-2 py-0.5 text-[10px] text-zinc-100 focus:ring-1 focus:ring-zinc-500 w-20"
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
              onClick={() => onDelete(note.id)}
              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
});

SortableNote.displayName = 'SortableNote';
