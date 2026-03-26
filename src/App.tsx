/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  getDocs,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  Plus, 
  Gamepad2, 
  LogOut, 
  ChevronRight, 
  BookOpen, 
  History, 
  Send, 
  Tag as TagIcon, 
  Trash2, 
  Edit3, 
  Save, 
  X,
  Clock,
  LayoutDashboard,
  MessageSquare,
  Star,
  GripVertical,
  PenLine,
  Feather
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { db, auth, signInWithGoogle, signOut, handleFirestoreError, OperationType } from './firebase';
import { Game, GameSession, Note, ViewMode } from './types';
import { deadSpace2MockData } from './mockData/deadSpace2';
import { suggestTags } from './services/geminiService';
import { cn } from './lib/utils';

// --- Components ---

const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setError(event.error?.message || 'An unexpected error occurred');
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100 p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-red-900/50 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h2>
          <p className="text-zinc-400 mb-6 text-sm font-mono break-all">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-zinc-100 text-zinc-950 rounded-full font-medium hover:bg-zinc-200 transition-colors"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const SortableNote = ({ 
  note, 
  onUpdate, 
  onDelete, 
  onAddTag, 
  onRemoveTag,
  editingNoteId,
  setEditingNoteId,
  editingContent,
  setEditingContent,
  activeNoteIdForTags,
  setActiveNoteIdForTags,
  newTagInput,
  setNewTagInput
}: { 
  note: Note; 
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
  onAddTag: (id: string, tag: string) => void;
  onRemoveTag: (id: string, tag: string) => void;
  editingNoteId: string | null;
  setEditingNoteId: (id: string | null) => void;
  editingContent: string;
  setEditingContent: (content: string) => void;
  activeNoteIdForTags: string | null;
  setActiveNoteIdForTags: (id: string | null) => void;
  newTagInput: string;
  setNewTagInput: (tag: string) => void;
}) => {
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

  const isEditing = editingNoteId === note.id;
  const isManagingTags = activeNoteIdForTags === note.id;

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
                    setActiveNoteIdForTags(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onAddTag(note.id, newTagInput);
                      setActiveNoteIdForTags(null);
                    } else if (e.key === 'Escape') {
                      setActiveNoteIdForTags(null);
                      setNewTagInput('');
                    }
                  }}
                  placeholder="New tag..."
                  className="bg-zinc-800 border-none rounded px-2 py-0.5 text-[10px] text-zinc-100 focus:ring-1 focus:ring-zinc-500 w-20"
                />
                <button 
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent onBlur from firing
                    setActiveNoteIdForTags(null);
                    setNewTagInput('');
                  }}
                >
                  <X className="w-3 h-3 text-zinc-500" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  setActiveNoteIdForTags(note.id);
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
                setEditingNoteId(note.id);
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
              onClick={() => setEditingNoteId(null)}
              className="px-3 py-1.5 text-xs font-bold text-zinc-500 hover:text-zinc-300"
            >
              Cancel
            </button>
            <button 
              onClick={() => onUpdate(note.id, editingContent)}
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
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [view, setView] = useState<ViewMode>('dashboard');
  const [history, setHistory] = useState<{ view: ViewMode, gameId: string | null, sessionId: string | null }[]>([]);
  
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);

  const navigateTo = (newView: ViewMode, game: Game | null = selectedGame, session: GameSession | null = activeSession) => {
    if (view !== newView || selectedGame?.id !== game?.id) {
      setHistory(prev => [...prev, { view, gameId: selectedGame?.id || null, sessionId: activeSession?.id || null }]);
    }
    setView(newView);
    setSelectedGame(game);
    setActiveSession(session);
  };

  const goBack = () => {
    if (history.length === 0) {
      setView('dashboard');
      setSelectedGame(null);
      setActiveSession(null);
      return;
    }

    const last = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setView(last.view);
    
    if (last.gameId) {
      const game = games.find(g => g.id === last.gameId);
      setSelectedGame(game || null);
    } else {
      setSelectedGame(null);
    }

    if (last.sessionId) {
      const session = sessions.find(s => s.id === last.sessionId);
      setActiveSession(session || null);
    } else {
      setActiveSession(null);
    }
  };
  const [notes, setNotes] = useState<Note[]>([]);
  
  const [isAddingGame, setIsAddingGame] = useState(false);
  const [isDeletingGame, setIsDeletingGame] = useState(false);
  const [newGameTitle, setNewGameTitle] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [newTagInput, setNewTagInput] = useState('');
  const [activeNoteIdForTags, setActiveNoteIdForTags] = useState<string | null>(null);
  const [progressMarker, setProgressMarker] = useState('');
  const [isEditingOverallThoughts, setIsEditingOverallThoughts] = useState(false);
  const [overallThoughtsDraft, setOverallThoughtsDraft] = useState('');
  const [isEditingStorySynopsis, setIsEditingStorySynopsis] = useState(false);
  const [storySynopsisDraft, setStorySynopsisDraft] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState<GameSession | null>(null);
  
  const [isEditingSessionDetails, setIsEditingSessionDetails] = useState(false);
  const [sessionNameInput, setSessionNameInput] = useState('');
  const [sessionChapterInput, setSessionChapterInput] = useState('');
  const [sessionHoursInput, setSessionHoursInput] = useState('');

  const notesEndRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // --- Auth Effect ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // --- Data Fetching Effects ---
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const q = query(collection(db, 'games'), where('uid', '==', user.uid), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gamesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
      setGames(gamesList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'games'));

    return () => unsubscribe();
  }, [user, isAuthReady]);

  useEffect(() => {
    if (!user || !selectedGame) return;

    const q = query(collection(db, 'sessions'), where('gameId', '==', selectedGame.id), orderBy('startTime', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameSession));
      setSessions(sessionsList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sessions'));

    return () => unsubscribe();
  }, [user, selectedGame]);

  useEffect(() => {
    if (!user || !selectedGame) return;

    const q = query(collection(db, 'notes'), where('gameId', '==', selectedGame.id), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      setNotes(notesList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notes'));

    return () => unsubscribe();
  }, [user, selectedGame]);

  // Migration: Ensure all notes have an 'order' field for manual reordering
  useEffect(() => {
    const notesToUpdate = notes.filter(n => n.order === undefined);
    if (notesToUpdate.length > 0) {
      const migrate = async () => {
        try {
          const updates = notesToUpdate.map(note => 
            updateDoc(doc(db, 'notes', note.id), { order: note.timestamp })
          );
          await Promise.all(updates);
        } catch (error) {
          console.error("Migration failed:", error);
        }
      };
      migrate();
    }
  }, [notes, user, isAuthReady]);

  useEffect(() => {
    notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [notes]);

  useEffect(() => {
    if (activeSession) {
      const updatedSession = sessions.find(s => s.id === activeSession.id);
      if (updatedSession && JSON.stringify(updatedSession) !== JSON.stringify(activeSession)) {
        setActiveSession(updatedSession);
      }
    }
  }, [sessions, activeSession]);

  useEffect(() => {
    if (selectedGame) {
      const updatedGame = games.find(g => g.id === selectedGame.id);
      if (updatedGame && JSON.stringify(updatedGame) !== JSON.stringify(selectedGame)) {
        setSelectedGame(updatedGame);
      }
    }
  }, [games, selectedGame]);

  // --- Actions ---

  const handleImportDeadSpace2Logs = async () => {
    if (!user) return;
    
    // Check if already imported to avoid duplicates
    if (games.some(g => g.title === "Dead Space 2 (2011)")) {
      toast.error('Dead Space 2 (2011) is already in your library.');
      return;
    }

    const loadingToast = toast.loading('Importing Dead Space 2 logs (this may take a minute)...');
    
    try {
      const gameData = deadSpace2MockData;
      const gameDoc = await addDoc(collection(db, 'games'), {
        title: gameData.title,
        status: gameData.status,
        uid: user.uid,
        overallNotes: gameData.overallNotes,
        storySynopsis: gameData.storySynopsis,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });

      for (const sessionData of gameData.sessions) {
        const sessionDoc = await addDoc(collection(db, 'sessions'), {
          gameId: gameDoc.id,
          uid: user.uid,
          startTime: Date.now(),
          progressMarker: sessionData.marker
        });

        for (const noteData of sessionData.notes) {
          await addDoc(collection(db, 'notes'), {
            gameId: gameDoc.id,
            sessionId: sessionDoc.id,
            uid: user.uid,
            content: noteData.content,
            tags: noteData.tags,
            isGlobal: noteData.isGlobal,
            timestamp: Date.now(),
            order: Date.now()
          });
        }
      }
      toast.dismiss(loadingToast);
      toast.success('Dead Space 2 logs imported successfully!');
    } catch (error) {
      toast.dismiss(loadingToast);
      handleFirestoreError(error, OperationType.CREATE, 'import');
    }
  };

  const handleAddGame = async () => {
    if (!user || !newGameTitle.trim()) return;
    try {
      await addDoc(collection(db, 'games'), {
        title: newGameTitle,
        status: 'playing',
        uid: user.uid,
        overallNotes: '',
        storySynopsis: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      setNewGameTitle('');
      setIsAddingGame(false);
      toast.success('Game added to your library');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'games');
    }
  };

  const handleStartSession = async () => {
    if (!user || !selectedGame) return;
    try {
      const docRef = await addDoc(collection(db, 'sessions'), {
        gameId: selectedGame.id,
        uid: user.uid,
        startTime: Date.now(),
        progressMarker: progressMarker || 'Starting session'
      });
      const newSession = { id: docRef.id, gameId: selectedGame.id, uid: user.uid, startTime: Date.now(), progressMarker: progressMarker || 'Starting session' };
      navigateTo('session-view', selectedGame, newSession);
      toast.info('Session started');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sessions');
    }
  };

  const handleResumeSession = (session: GameSession) => {
    navigateTo('session-view', selectedGame, session);
    toast.info(`Resumed session: ${session.name || session.progressMarker}`);
  };

  const handleUpdateSessionDetails = async () => {
    if (!user || !activeSession) return;
    try {
      await updateDoc(doc(db, 'sessions', activeSession.id), {
        name: sessionNameInput,
        chapter: sessionChapterInput,
        hoursPlayed: sessionHoursInput ? parseFloat(sessionHoursInput) : null,
      });
      setIsEditingSessionDetails(false);
      toast.success('Session details updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sessions/${activeSession.id}`);
    }
  };

  const handleAddNote = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user || !selectedGame || !noteInput.trim()) return;

    const content = noteInput;
    setNoteInput('');
    setIsSubmittingNote(true);

    try {
      // 1. Create the note immediately to ensure it appears in the UI instantly
      const docRef = await addDoc(collection(db, 'notes'), {
        gameId: selectedGame.id,
        sessionId: activeSession?.id || null,
        uid: user.uid,
        content,
        tags: [], // Start with empty tags
        isGlobal: false,
        timestamp: Date.now(),
        order: Date.now()
      });

      // 2. Update game's updatedAt
      await updateDoc(doc(db, 'games', selectedGame.id), {
        updatedAt: Date.now()
      });

      setIsSubmittingNote(false);

      // 3. Trigger AI tagging in the background without blocking the UI
      suggestTags(content).then(async (suggestion) => {
        try {
          await updateDoc(docRef, {
            tags: suggestion.tags,
            isGlobal: suggestion.isGlobal
          });
        } catch (err) {
          console.error("Failed to update note with AI tags:", err);
        }
      }).catch(err => {
        console.error("AI tagging failed:", err);
      });

    } catch (error) {
      setIsSubmittingNote(false);
      handleFirestoreError(error, OperationType.CREATE, 'notes');
    }
  };

  const handleUpdateNote = async (noteId: string, content: string) => {
    try {
      await updateDoc(doc(db, 'notes', noteId), { content });
      setEditingNoteId(null);
      toast.success('Note updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notes');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteDoc(doc(db, 'notes', noteId));
      toast.success('Note deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'notes');
    }
  };

  const handleAddTag = async (noteId: string, tag: string) => {
    if (!tag.trim()) return;
    const note = notes.find(n => n.id === noteId);
    if (!note) return;
    if (note.tags.includes(tag)) return;

    try {
      await updateDoc(doc(db, 'notes', noteId), {
        tags: [...note.tags, tag]
      });
      setNewTagInput('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notes');
    }
  };

  const handleRemoveTag = async (noteId: string, tagToRemove: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    try {
      await updateDoc(doc(db, 'notes', noteId), {
        tags: note.tags.filter(t => t !== tagToRemove)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notes');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const sessionNotes = notes.filter(n => n.sessionId === activeSession?.id);
    const oldIndex = sessionNotes.findIndex(n => n.id === active.id);
    const newIndex = sessionNotes.findIndex(n => n.id === over.id);

    const newOrder = arrayMove(sessionNotes, oldIndex, newIndex);
    
    // Update order in Firestore for all affected notes
    // This is a bit heavy but necessary for manual reordering
    try {
      const updates = newOrder.map((note, index) => 
        updateDoc(doc(db, 'notes', note.id), { order: index })
      );
      await Promise.all(updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notes');
    }
  };

  const handleUpdateGameField = async (field: 'overallNotes' | 'storySynopsis', value: string) => {
    if (!selectedGame) return;
    try {
      await updateDoc(doc(db, 'games', selectedGame.id), {
        [field]: value,
        updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'games');
    }
  };

  const handleDeleteGame = async () => {
    if (!selectedGame || !user) return;
    const gameId = selectedGame.id;
    const loadingToast = toast.loading('Deleting game and all associated data...');
    
    try {
      // 1. Delete all notes for this game
      const notesQuery = query(collection(db, 'notes'), where('gameId', '==', gameId));
      const notesSnapshot = await getDocs(notesQuery);
      const noteDeletions = notesSnapshot.docs.map(noteDoc => deleteDoc(doc(db, 'notes', noteDoc.id)));
      
      // 2. Delete all sessions for this game
      const sessionsQuery = query(collection(db, 'sessions'), where('gameId', '==', gameId));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessionDeletions = sessionsSnapshot.docs.map(sessionDoc => deleteDoc(doc(db, 'sessions', sessionDoc.id)));
      
      // 3. Delete the game itself
      const gameDeletion = deleteDoc(doc(db, 'games', gameId));
      
      await Promise.all([...noteDeletions, ...sessionDeletions, gameDeletion]);
      
      toast.dismiss(loadingToast);
      toast.success('Game deleted successfully');
      
      // Reset state
      setIsDeletingGame(false);
      setHistory([]);
      navigateTo('dashboard', null, null);
    } catch (error) {
      toast.dismiss(loadingToast);
      handleFirestoreError(error, OperationType.DELETE, 'games');
    }
  };

  const handleDeleteSession = async () => {
    if (!sessionToDelete || !user) return;
    const sessionId = sessionToDelete.id;
    const loadingToast = toast.loading('Deleting session and its notes...');
    
    try {
      // 1. Delete all notes for this session
      const notesQuery = query(collection(db, 'notes'), where('sessionId', '==', sessionId));
      const notesSnapshot = await getDocs(notesQuery);
      const noteDeletions = notesSnapshot.docs.map(noteDoc => deleteDoc(doc(db, 'notes', noteDoc.id)));
      
      // 2. Delete the session itself
      const sessionDeletion = deleteDoc(doc(db, 'sessions', sessionId));
      
      await Promise.all([...noteDeletions, sessionDeletion]);
      
      toast.dismiss(loadingToast);
      toast.success('Session deleted successfully');
      
      // Reset state
      setSessionToDelete(null);
    } catch (error) {
      toast.dismiss(loadingToast);
      handleFirestoreError(error, OperationType.DELETE, 'sessions');
    }
  };

  // --- Render Helpers ---

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-zinc-800 border-t-zinc-100 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-10 text-center shadow-2xl">
          <div className="w-20 h-20 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-8 rotate-3">
            <Gamepad2 className="w-10 h-10 text-zinc-950" />
          </div>
          <h1 className="text-4xl font-bold text-zinc-100 mb-4 tracking-tight">QuestLog</h1>
          <p className="text-zinc-400 mb-10 leading-relaxed">
            A dead-simple journal for your gaming adventures. Log your progress, take notes, and let AI organize your thoughts.
          </p>
          <button 
            onClick={signInWithGoogle}
            className="w-full py-4 bg-zinc-100 text-zinc-950 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-white transition-all active:scale-95"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-100 selection:text-zinc-950">
        <Toaster position="top-center" theme="dark" />
        
        {/* Navigation Rail / Header & Back Bar */}
        <div className="sticky top-0 z-50 flex flex-col">
          <header className="bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { setHistory([]); navigateTo('dashboard', null, null); }}
                className="flex items-center gap-2 group"
              >
                <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center group-hover:rotate-6 transition-transform">
                  <Gamepad2 className="w-5 h-5 text-zinc-950" />
                </div>
                <span className="font-bold text-xl tracking-tight hidden sm:block">QuestLog</span>
              </button>
              
              {selectedGame && (
                <div className="flex items-center gap-2 text-zinc-500">
                  <ChevronRight className="w-4 h-4" />
                  <span className="text-zinc-100 font-medium truncate max-w-[150px] sm:max-w-none">
                    {selectedGame.title}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={signOut}
                className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <img src={user.photoURL || ''} className="w-8 h-8 rounded-full border border-zinc-800" alt="Profile" />
            </div>
          </header>

          {/* Back Bar */}
          {view !== 'dashboard' && (
            <button 
              onClick={goBack}
              className="w-full text-left bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-900 px-6 py-2 hover:bg-zinc-900/80 transition-colors group cursor-pointer"
            >
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-2 text-zinc-500 group-hover:text-zinc-100 transition-colors text-xs font-bold uppercase tracking-widest">
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Back
                </div>
              </div>
            </button>
          )}
        </div>

        <main className="max-w-6xl mx-auto p-6">
          {isDeletingGame && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-2xl font-bold mb-4">Delete "{selectedGame?.title}"?</h3>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                  This will permanently delete this game and all associated sessions and notes. This action cannot be undone.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={handleDeleteGame}
                    className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-bold hover:bg-red-500 transition-colors"
                  >
                    Delete
                  </button>
                  <button 
                    onClick={() => setIsDeletingGame(false)}
                    className="flex-1 bg-zinc-800 text-zinc-100 py-3 rounded-2xl font-bold hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {sessionToDelete && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <h3 className="text-2xl font-bold mb-4">Delete Session?</h3>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                  This will permanently delete this session and all its notes. This action cannot be undone.
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={handleDeleteSession}
                    className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-bold hover:bg-red-500 transition-colors"
                  >
                    Delete
                  </button>
                  <button 
                    onClick={() => setSessionToDelete(null)}
                    className="flex-1 bg-zinc-800 text-zinc-100 py-3 rounded-2xl font-bold hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Your Library</h2>
                <div className="flex gap-3">
                  {user.email === 'kyledk05@gmail.com' && (
                    <button 
                      onClick={handleImportDeadSpace2Logs}
                      className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-5 py-2 rounded-full font-bold text-sm hover:text-zinc-100 transition-all"
                    >
                      Import Dead Space 2 Logs
                    </button>
                  )}
                  <button 
                    onClick={() => setIsAddingGame(true)}
                    className="bg-zinc-100 text-zinc-950 px-5 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-white transition-all active:scale-95"
                  >
                    <Plus className="w-5 h-5" />
                    Add Game
                  </button>
                </div>
              </div>

              {isAddingGame && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col sm:flex-row gap-4">
                  <input 
                    type="text" 
                    placeholder="Game Title (e.g. Elden Ring)"
                    value={newGameTitle}
                    onChange={(e) => setNewGameTitle(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-3 focus:outline-none focus:border-zinc-100 transition-colors"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleAddGame()}
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleAddGame}
                      className="flex-1 sm:flex-none bg-zinc-100 text-zinc-950 px-8 py-3 rounded-2xl font-bold"
                    >
                      Add
                    </button>
                    <button 
                      onClick={() => setIsAddingGame(false)}
                      className="p-3 text-zinc-500 hover:text-zinc-100"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map(game => (
                  <div 
                    key={game.id}
                    onClick={() => navigateTo('game-detail', game, null)}
                    className="relative group bg-zinc-900 border border-zinc-800 rounded-3xl p-6 text-left hover:border-zinc-700 transition-all hover:shadow-xl flex flex-col cursor-pointer hover:-translate-y-1 h-full"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:bg-zinc-100 transition-colors">
                        <Gamepad2 className="w-6 h-6 text-zinc-500 group-hover:text-zinc-950" />
                      </div>
                      <span className="text-[10px] uppercase tracking-widest font-bold text-zinc-500 bg-zinc-950 px-2 py-1 rounded">
                        {game.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-1 truncate pr-8">{game.title}</h3>
                    <p className="text-zinc-500 text-xs flex items-center gap-1 mt-auto pr-12">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">Last played {format(game.updatedAt, 'MMM d, yyyy')}</span>
                    </p>
                    
                    {/* Quick Note Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigateTo('quick-note', game, null);
                      }}
                      className="absolute bottom-5 right-5 w-10 h-10 bg-zinc-100 text-zinc-950 rounded-xl flex items-center justify-center opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-300 hover:bg-white shadow-lg hover:scale-105"
                      title="Quick Note"
                    >
                      <Feather className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                
                {games.length === 0 && !isAddingGame && (
                  <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-900 rounded-3xl">
                    <p className="text-zinc-500 font-medium">Your library is empty. Add a game to start journaling.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'quick-note' && selectedGame && (
            <div className="max-w-3xl mx-auto h-[calc(100vh-120px)] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedGame.title}</h2>
                  <p className="text-zinc-500 text-sm">Quick Note</p>
                </div>
                <button 
                  onClick={goBack}
                  className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Recent Notes */}
              <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6 custom-scrollbar">
                {notes.slice(-10).map(note => (
                  <div key={note.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-wrap gap-2">
                        {note.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                            {tag}
                          </span>
                        ))}
                        {note.isGlobal && (
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-950 rounded text-[10px] font-bold uppercase tracking-tighter">
                            Global
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600">
                        {format(note.timestamp, 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-sm leading-relaxed">{note.content}</p>
                  </div>
                ))}
                <div ref={notesEndRef} />
              </div>

              {/* Note Input */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-2 shrink-0">
                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    placeholder="Jot down a quick thought..."
                    className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-100 px-4 py-3 placeholder:text-zinc-600 outline-none"
                    disabled={isSubmittingNote}
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={!noteInput.trim() || isSubmittingNote}
                    className="bg-zinc-100 text-zinc-950 px-6 py-3 rounded-2xl font-bold hover:bg-white transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Save</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {view === 'game-detail' && selectedGame && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div>
                  <h2 className="text-5xl font-black tracking-tighter mb-2">{selectedGame.title}</h2>
                  <div className="flex flex-wrap gap-3">
                    <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      {selectedGame.status}
                    </span>
                    <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold text-zinc-400">
                      {sessions.length} Sessions
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-1">
                    <button 
                      onClick={() => handleStartSession()}
                      className="p-3 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-all"
                      title="Start New Session"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setIsDeletingGame(true)}
                      className="p-3 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                      title="Delete Game"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  <button 
                    onClick={() => sessions.length > 0 ? handleResumeSession(sessions[0]) : handleStartSession()}
                    className="bg-zinc-100 text-zinc-950 px-6 sm:px-8 py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 hover:bg-white transition-all active:scale-95 shadow-lg shadow-zinc-100/10"
                  >
                    <PenLine className="w-5 h-5 sm:w-6 sm:h-6" />
                    {sessions.length > 0 ? 'Continue Logging' : 'Start Logging'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Left Column: Notes & Sessions */}
                <div className="lg:col-span-2 space-y-10">
                  {/* Global Notes Section */}
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <BookOpen className="w-5 h-5" />
                        <h3 className="font-bold uppercase tracking-widest text-xs">Overall Thoughts</h3>
                      </div>
                      {!isEditingOverallThoughts && (
                        <button
                          onClick={() => {
                            setOverallThoughtsDraft(selectedGame.overallNotes || '');
                            setIsEditingOverallThoughts(true);
                          }}
                          className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-100 transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                      {isEditingOverallThoughts ? (
                        <div className="space-y-4 animate-in fade-in duration-200">
                          <textarea 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 focus:outline-none focus:border-zinc-600 text-zinc-300 leading-relaxed resize-none min-h-[150px]"
                            placeholder="Add overall thoughts about the game, mechanics, or general impressions..."
                            value={overallThoughtsDraft}
                            onChange={(e) => setOverallThoughtsDraft(e.target.value)}
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setIsEditingOverallThoughts(false)}
                              className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => {
                                handleUpdateGameField('overallNotes', overallThoughtsDraft);
                                setIsEditingOverallThoughts(false);
                              }}
                              className="px-4 py-2 bg-zinc-100 text-zinc-950 rounded-xl text-xs font-bold hover:bg-white transition-colors flex items-center gap-2"
                            >
                              <Save className="w-3.5 h-3.5" /> Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className={cn(
                            "text-zinc-300 leading-relaxed min-h-[150px] whitespace-pre-wrap animate-in fade-in duration-200",
                            !selectedGame.overallNotes && "text-zinc-600 italic"
                          )}
                        >
                          {selectedGame.overallNotes || "No overall thoughts yet. Click edit to add some."}
                        </div>
                      )}
                    </div>
                  </section>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    {/* Global Insights Section (AI Highlighted) */}
                    <section className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Star className="w-5 h-5" />
                          <h3 className="font-bold uppercase tracking-widest text-xs">Global Insights</h3>
                        </div>
                        {notes.filter(n => n.isGlobal).length > 3 && (
                          <button 
                            onClick={() => navigateTo('all-insights')}
                            className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-100 transition-colors flex items-center gap-1"
                          >
                            View All <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {notes.filter(n => n.isGlobal).length > 0 ? (
                          notes.filter(n => n.isGlobal).slice().reverse().slice(0, 3).map(note => (
                            <div key={note.id} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-wrap gap-2">
                                  {note.tags.map(tag => (
                                    <span key={tag} className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                <span className="text-[10px] font-mono text-zinc-500">
                                  {format(note.timestamp, 'MMM d')}
                                </span>
                              </div>
                              <p className="text-zinc-300 text-sm font-medium leading-relaxed">{note.content}</p>
                            </div>
                          ))
                        ) : (
                          <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl p-8 text-center">
                            <p className="text-zinc-500 text-xs italic">No global insights yet. The AI will highlight key observations here.</p>
                          </div>
                        )}
                      </div>
                    </section>

                    {/* Recent Activity / Notes Feed */}
                    <section className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <History className="w-5 h-5" />
                          <h3 className="font-bold uppercase tracking-widest text-xs">Recent Notes</h3>
                        </div>
                        {notes.length > 3 && (
                          <button 
                            onClick={() => navigateTo('all-notes')}
                            className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-100 transition-colors flex items-center gap-1"
                          >
                            View All <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-4">
                        {notes.slice().reverse().slice(0, 3).map(note => (
                          <div key={note.id} className="bg-zinc-900/50 border border-zinc-900 rounded-2xl p-5 hover:border-zinc-800 transition-colors">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex flex-wrap gap-2">
                                {note.tags.map(tag => (
                                  <span key={tag} className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                                    {tag}
                                  </span>
                                ))}
                                {note.isGlobal && (
                                  <span className="px-2 py-0.5 bg-zinc-100 text-zinc-950 rounded text-[10px] font-bold uppercase tracking-tighter">
                                    Global
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-zinc-600">
                                {format(note.timestamp, 'HH:mm')}
                              </span>
                            </div>
                            <p className="text-zinc-300 text-sm leading-relaxed">{note.content}</p>
                          </div>
                        ))}
                        {notes.length === 0 && (
                          <div className="bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl p-8 text-center">
                            <p className="text-zinc-500 text-xs italic">No notes yet. Start a session to begin logging.</p>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>

                {/* Right Column: Story & Sessions List */}
                <div className="space-y-10">
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-zinc-400">
                        <MessageSquare className="w-5 h-5" />
                        <h3 className="font-bold uppercase tracking-widest text-xs">Story Synopsis</h3>
                      </div>
                      {!isEditingStorySynopsis && (
                        <button
                          onClick={() => {
                            setStorySynopsisDraft(selectedGame.storySynopsis || '');
                            setIsEditingStorySynopsis(true);
                          }}
                          className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:text-zinc-100 transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      )}
                    </div>
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
                      {isEditingStorySynopsis ? (
                        <div className="space-y-4 animate-in fade-in duration-200">
                          <textarea 
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 focus:outline-none focus:border-zinc-600 text-zinc-300 leading-relaxed resize-none min-h-[200px]"
                            placeholder="Summarize the story so far..."
                            value={storySynopsisDraft}
                            onChange={(e) => setStorySynopsisDraft(e.target.value)}
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setIsEditingStorySynopsis(false)}
                              className="px-4 py-2 text-xs font-bold text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              Cancel
                            </button>
                            <button 
                              onClick={() => {
                                handleUpdateGameField('storySynopsis', storySynopsisDraft);
                                setIsEditingStorySynopsis(false);
                              }}
                              className="px-4 py-2 bg-zinc-100 text-zinc-950 rounded-xl text-xs font-bold hover:bg-white transition-colors flex items-center gap-2"
                            >
                              <Save className="w-3.5 h-3.5" /> Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className={cn(
                            "text-zinc-300 leading-relaxed min-h-[200px] whitespace-pre-wrap animate-in fade-in duration-200",
                            !selectedGame.storySynopsis && "text-zinc-600 italic"
                          )}
                        >
                          {selectedGame.storySynopsis || "No story synopsis yet. Click edit to add one."}
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="space-y-4">
                    <h3 className="font-bold uppercase tracking-widest text-xs text-zinc-400">Past Sessions</h3>
                    <div className="space-y-2">
                      {sessions.map(session => (
                        <div 
                          key={session.id} 
                          role="button"
                          tabIndex={0}
                          onClick={() => handleResumeSession(session)}
                          onKeyDown={(e) => e.key === 'Enter' && handleResumeSession(session)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group cursor-pointer"
                        >
                          <div className="text-left">
                            <p className="font-bold text-sm group-hover:text-zinc-100 transition-colors">{session.name || session.progressMarker}</p>
                            <p className="text-zinc-500 text-[10px]">{format(session.startTime, 'MMM d, yyyy')}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSessionToDelete(session);
                              }}
                              className="hidden md:flex opacity-0 group-hover:opacity-100 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all shrink-0 items-center justify-center mr-2"
                              title="Delete Session"
                            >
                              <Trash2 className="w-4 h-4 transition-colors hover:fill-red-400/20" />
                            </button>
                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Resume</span>
                            <ChevronRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-100 transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}

          {view === 'all-insights' && selectedGame && (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={goBack}
                    className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold">Global Insights</h2>
                    <p className="text-zinc-500 text-sm">{selectedGame.title}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {notes.filter(n => n.isGlobal).slice().reverse().map(note => (
                  <div key={note.id} className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-wrap gap-2">
                        {note.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {format(note.timestamp, 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-lg font-medium leading-relaxed">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'all-notes' && selectedGame && (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <button 
                    onClick={goBack}
                    className="p-2 hover:bg-zinc-900 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <div>
                    <h2 className="text-2xl font-bold">All Notes</h2>
                    <p className="text-zinc-500 text-sm">{selectedGame.title}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {notes.slice().reverse().map(note => (
                  <div key={note.id} className="bg-zinc-900/50 border border-zinc-900 rounded-2xl p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex flex-wrap gap-2">
                        {note.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-zinc-800 rounded text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                            {tag}
                          </span>
                        ))}
                        {note.isGlobal && (
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-950 rounded text-[10px] font-bold uppercase tracking-tighter">
                            Global
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600">
                        {format(note.timestamp, 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                    <p className="text-zinc-300 text-base leading-relaxed">{note.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'session-view' && selectedGame && activeSession && (
            <div className="h-[calc(100vh-120px)] flex justify-center gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Sidebar for Sessions */}
              <div className="w-72 shrink-0 hidden md:flex flex-col border-r border-zinc-800/50 pr-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold uppercase tracking-widest text-xs text-zinc-400">Sessions</h3>
                  <button 
                    onClick={() => handleStartSession()}
                    className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
                    title="New Session"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-2">
                  {sessions.map(session => (
                    <button
                      key={session.id}
                      onClick={() => handleResumeSession(session)}
                      className={`w-full text-left p-3 rounded-xl transition-all ${activeSession.id === session.id ? 'bg-zinc-800 border border-zinc-700' : 'bg-transparent hover:bg-zinc-900 border border-transparent'}`}
                    >
                      <p className={`font-bold text-sm truncate ${activeSession.id === session.id ? 'text-zinc-100' : 'text-zinc-400'}`}>{session.name || session.progressMarker}</p>
                      <p className="text-zinc-500 text-[10px] mt-1">{format(session.startTime, 'MMM d, yyyy')}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Session View */}
              <div className="flex-1 w-full max-w-2xl flex flex-col min-w-0">
                {/* Compact Session Header */}
                <div className="mb-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 shrink-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-wrap flex-1 min-w-0">
                      <h2 className="text-xl font-bold truncate">
                        {activeSession.name || activeSession.progressMarker}
                      </h2>
                      
                      {!isEditingSessionDetails && (
                        <div className="flex items-center gap-3 text-zinc-400 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            Live
                          </div>
                          {activeSession.chapter && (
                            <div className="flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
                              {activeSession.chapter}
                            </div>
                          )}
                          {activeSession.hoursPlayed && (
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5 text-zinc-500" />
                              {activeSession.hoursPlayed} hrs
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          if (isEditingSessionDetails) {
                            setIsEditingSessionDetails(false);
                          } else {
                            setSessionNameInput(activeSession.name || '');
                            setSessionChapterInput(activeSession.chapter || '');
                            setSessionHoursInput(activeSession.hoursPlayed ? activeSession.hoursPlayed.toString() : '');
                            setIsEditingSessionDetails(true);
                          }
                        }}
                        className="p-1.5 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        {isEditingSessionDetails ? <X className="w-4 h-4" /> : <PenLine className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={goBack}
                        className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors"
                      >
                        End Session
                      </button>
                    </div>
                  </div>

                  {isEditingSessionDetails && (
                    <div className="mt-4 pt-4 border-t border-zinc-800/50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Session Name</label>
                          <input
                            type="text"
                            value={sessionNameInput}
                            onChange={(e) => setSessionNameInput(e.target.value)}
                            placeholder="e.g. Boss Fight"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Chapter / Level</label>
                          <input
                            type="text"
                            value={sessionChapterInput}
                            onChange={(e) => setSessionChapterInput(e.target.value)}
                            placeholder="e.g. Chapter 4"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Hours Played</label>
                          <input
                            type="number"
                            step="0.1"
                            value={sessionHoursInput}
                            onChange={(e) => setSessionHoursInput(e.target.value)}
                            placeholder="e.g. 2.5"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
                        <button
                          onClick={handleUpdateSessionDetails}
                          className="px-4 py-2 bg-zinc-100 text-zinc-950 rounded-xl text-sm font-bold hover:bg-white transition-colors"
                        >
                          Save Details
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes Feed */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 custom-scrollbar">
                  <DndContext 
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext 
                      items={notes.filter(n => n.sessionId === activeSession.id).map(n => n.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-4">
                        {notes.filter(n => n.sessionId === activeSession.id).map(note => (
                          <SortableNote 
                            key={note.id} 
                            note={note}
                            onUpdate={handleUpdateNote}
                            onDelete={handleDeleteNote}
                            onAddTag={handleAddTag}
                            onRemoveTag={handleRemoveTag}
                            editingNoteId={editingNoteId}
                            setEditingNoteId={setEditingNoteId}
                            editingContent={editingContent}
                            setEditingContent={setEditingContent}
                            activeNoteIdForTags={activeNoteIdForTags}
                            setActiveNoteIdForTags={setActiveNoteIdForTags}
                            newTagInput={newTagInput}
                            setNewTagInput={setNewTagInput}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                  <div ref={notesEndRef} />
                </div>

                {/* Input Area */}
                <div className="sticky bottom-0 bg-zinc-950 pt-4">
                  <form onSubmit={handleAddNote} className="relative">
                    <textarea 
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      placeholder="Type a note about your experience..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-3xl px-6 py-5 pr-16 focus:outline-none focus:border-zinc-100 transition-all duration-300 resize-none min-h-[60px] hover:min-h-[120px] focus:min-h-[120px] shadow-2xl"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddNote();
                        }
                      }}
                    />
                    <button 
                      type="submit"
                      disabled={!noteInput.trim() || isSubmittingNote}
                      className="absolute right-4 bottom-4 p-3 bg-zinc-100 text-zinc-950 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-all active:scale-95"
                    >
                      {isSubmittingNote ? (
                        <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </form>
                  <p className="text-center text-[10px] text-zinc-600 mt-4 uppercase tracking-widest">
                    Press Enter to send • Shift+Enter for new line
                  </p>
                </div>
              </div>

              {/* Session Details Sidebar */}
              {/* <div className="w-72 shrink-0 hidden lg:flex flex-col border-l border-zinc-800/50 pl-6">
                Reserved for future use
              </div> */}
            </div>
          )}
        </main>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #27272a;
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #3f3f46;
          }
        `}</style>
      </div>
    </ErrorBoundary>
  );
}
