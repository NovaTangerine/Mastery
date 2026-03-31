import React, { useState, useEffect } from 'react';
import { useGameContext } from '../contexts/GameContext';
import { useUI } from '../contexts/UIContext';
import { useNotes } from '../hooks/useNotes';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Tag as TagIcon, 
  X, 
  Plus,
  History,
  Trash2,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export const NoteEditorView: React.FC = () => {
  const { goBack } = useUI();
  const { 
    selectedGame, 
    activeSession, 
    handleSaveDraft, 
    handleDeleteDraft,
    drafts,
    draftsLimit,
    loadMoreDrafts
  } = useGameContext();

  const { handleAddNote } = useNotes(selectedGame?.id || null, activeSession?.id || null);

  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showDrafts, setShowDrafts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!selectedGame) {
      goBack();
    }
  }, [selectedGame, goBack]);

  if (!selectedGame) return null;

  const gameDrafts = drafts.filter(d => d.gameId === selectedGame.id);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handlePostNote = async () => {
    if (!content.trim()) {
      toast.error('Note content cannot be empty');
      return;
    }

    setIsSubmitting(true);
    try {
      await handleAddNote(content, tags);
      toast.success('Note posted');
      goBack();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!content.trim()) {
      toast.error('Draft content cannot be empty');
      return;
    }

    try {
      await handleSaveDraft(content, tags);
      setContent('');
      setTags([]);
    } catch (error) {
      console.error(error);
    }
  };

  const loadDraft = (draft: any) => {
    setContent(draft.content);
    setTags(draft.tags || []);
    setShowDrafts(false);
    toast.info('Draft loaded');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-zinc-800/50 bg-zinc-900/50 sticky top-0 z-10 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <button 
            onClick={goBack}
            className="p-1.5 sm:p-2 hover:bg-zinc-800 rounded-full transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-base sm:text-lg leading-tight truncate">New Note</h2>
            <p className="text-[10px] sm:text-xs text-zinc-500 truncate">
              {selectedGame?.title} {activeSession ? `• ${activeSession.name || activeSession.progressMarker}` : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button 
            onClick={() => setShowDrafts(!showDrafts)}
            className={`p-1.5 sm:p-2 rounded-full transition-colors relative ${showDrafts ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-800'}`}
          >
            <History className="w-4 h-4 sm:w-5 sm:h-5" />
            {gameDrafts.length > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full" />
            )}
          </button>
          <button 
            onClick={handleSaveAsDraft}
            disabled={!content.trim()}
            className="p-1.5 sm:p-2 text-zinc-400 hover:bg-zinc-800 rounded-full transition-colors disabled:opacity-50"
            title="Save Draft"
          >
            <Save className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <button 
            onClick={handlePostNote}
            disabled={!content.trim() || isSubmitting}
            className="bg-zinc-100 text-zinc-950 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 hover:bg-white transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {isSubmitting ? 'Posting...' : (
              <>
                <span className="hidden sm:inline">Post</span>
                <Send className="w-3 h-3 sm:w-4 sm:h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col p-4 overflow-y-auto custom-scrollbar">
        {showDrafts ? (
          <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-zinc-400 uppercase text-xs tracking-widest">Your Drafts</h3>
              <button onClick={() => setShowDrafts(false)} className="text-xs text-zinc-500 hover:text-zinc-300">Close</button>
            </div>
            {gameDrafts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-600">
                <FileText className="w-12 h-12 mb-4 opacity-20" />
                <p>No drafts saved for this game</p>
              </div>
            ) : (
              gameDrafts.map(draft => (
                <div key={draft.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4 group">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] text-zinc-500">{format(draft.updatedAt, 'MMM d, h:mm a')}</span>
                    <button 
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm text-zinc-300 line-clamp-3 mb-4">{draft.content}</p>
                  <button 
                    onClick={() => loadDraft(draft)}
                    className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Load Draft
                  </button>
                </div>
              ))
            )}
            {drafts.length >= draftsLimit && (
              <div className="flex justify-center mt-4">
                <button 
                  onClick={loadMoreDrafts}
                  className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-6 py-2 rounded-full font-bold text-xs hover:text-zinc-100 hover:bg-zinc-800 transition-all"
                >
                  Load Older Drafts
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <textarea 
              autoFocus
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="flex-1 bg-transparent text-xl leading-relaxed resize-none focus:outline-none placeholder:text-zinc-700"
            />

            {/* Tags Section */}
            <div className="mt-8 border-t border-zinc-800/50 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <TagIcon className="w-4 h-4 text-zinc-500" />
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Tags</span>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {tags.map(tag => (
                  <span 
                    key={tag} 
                    className="bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-full text-xs flex items-center gap-2 group"
                  >
                    #{tag}
                    <button onClick={() => removeTag(tag)} className="text-zinc-500 hover:text-zinc-100">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <div className="relative flex-1 min-w-[120px]">
                  <input 
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="Add tag..."
                    className="w-full bg-transparent text-sm focus:outline-none text-zinc-300"
                  />
                  {tagInput && (
                    <button 
                      onClick={handleAddTag}
                      className="absolute right-0 top-1/2 -translate-y-1/2 p-1 bg-zinc-800 rounded-full"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
