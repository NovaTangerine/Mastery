import React, { useState, memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { GripVertical, X, Edit3, Trash2 } from 'lucide-react';
import { Note } from '../types';
import { cn } from '../lib/utils';

export const SortableNote = memo(({ 
  note, 
  onUpdate, 
  onDelete, 
  onAddTag, 
  onRemoveTag
}: { 
  note: Note; 
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState(note.content);
  const [isManagingTags, setIsManagingTags] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

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
      className={cn(
        "group relative bg-zinc-900 border border-zinc-800 rounded-2xl p-5 transition-all hover:border-zinc-700",
        isDragging && "shadow-2xl border-zinc-500"
      )}
    >
      <div className="flex justify-between items-center mb-2 gap-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button 
            {...attributes} 
            {...listeners} 
            className="p-1 text-zinc-700 hover:text-zinc-400 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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
            
            {isManagingTags ? (
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
                className="shrink-0 px-2 py-0.5 border border-dashed border-zinc-700 rounded text-[10px] font-bold text-zinc-500 uppercase tracking-tighter hover:border-zinc-500 hover:text-zinc-300 transition-colors opacity-0 group-hover:opacity-100"
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
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
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
