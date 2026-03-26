import React, { createContext, useContext, useState, useEffect } from 'react';
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
  getDoc,
  limit
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { Game, GameSession, Note, ViewMode } from '../types';
import { toast } from 'sonner';
import { deadSpace2MockData } from '../mockData/deadSpace2';
import { suggestTags } from '../services/geminiService';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';
import { generateKeyBetween } from 'fractional-indexing';

interface GameContextType {
  user: User | null;
  isAuthReady: boolean;
  view: ViewMode;
  history: { view: ViewMode, gameId: string | null, sessionId: string | null }[];
  games: Game[];
  selectedGame: Game | null;
  sessions: GameSession[];
  activeSession: GameSession | null;
  notes: Note[];
  notesLimit: number;
  loadMoreNotes: () => void;
  isSubmittingNote: boolean;

  navigateTo: (newView: ViewMode, game?: Game | null, session?: GameSession | null) => void;
  goBack: () => void;
  handleImportDeadSpace2Logs: () => Promise<void>;
  handleAddGame: (title: string) => Promise<void>;
  handleStartSession: () => Promise<void>;
  handleResumeSession: (session: GameSession) => void;
  handleUpdateSessionDetails: (name: string, chapter: string, hoursPlayed: string) => Promise<void>;
  handleAddNote: (content: string) => Promise<void>;
  handleUpdateNote: (noteId: string, content: string) => Promise<void>;
  handleDeleteNote: (noteId: string) => Promise<void>;
  handleAddTag: (noteId: string, tag: string) => Promise<void>;
  handleRemoveTag: (noteId: string, tagToRemove: string) => Promise<void>;
  handleDragEnd: (event: DragEndEvent) => Promise<void>;
  handleUpdateGameField: (field: 'overallNotes' | 'storySynopsis', value: string) => Promise<void>;
  handleDeleteGame: () => Promise<void>;
  handleDeleteSession: (sessionId: string) => Promise<void>;
  setHistory: React.Dispatch<React.SetStateAction<{ view: ViewMode, gameId: string | null, sessionId: string | null }[]>>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [view, setView] = useState<ViewMode>('dashboard');
  const [history, setHistory] = useState<{ view: ViewMode, gameId: string | null, sessionId: string | null }[]>([]);
  
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [activeSession, setActiveSession] = useState<GameSession | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLimit, setNotesLimit] = useState(50);
  
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const loadMoreNotes = () => {
    setNotesLimit(prev => prev + 50);
  };

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

    const q = query(
      collection(db, 'notes'), 
      where('gameId', '==', selectedGame.id), 
      orderBy('order', 'desc'),
      limit(notesLimit)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
      // Reverse to display ascending
      setNotes(notesList.reverse());
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'notes'));

    return () => unsubscribe();
  }, [user, selectedGame, notesLimit]);

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

        let lastOrder: string | null = null;
        for (const noteData of sessionData.notes) {
          lastOrder = generateKeyBetween(lastOrder, null);
          await addDoc(collection(db, 'notes'), {
            gameId: gameDoc.id,
            sessionId: sessionDoc.id,
            uid: user.uid,
            content: noteData.content,
            tags: noteData.tags,
            isGlobal: noteData.isGlobal,
            timestamp: Date.now(),
            order: lastOrder
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

  const handleAddGame = async (title: string) => {
    if (!user || !title.trim()) return;
    try {
      await addDoc(collection(db, 'games'), {
        title: title,
        status: 'playing',
        uid: user.uid,
        overallNotes: '',
        storySynopsis: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
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
        progressMarker: 'Starting session'
      });
      const newSession = { id: docRef.id, gameId: selectedGame.id, uid: user.uid, startTime: Date.now(), progressMarker: 'Starting session' };
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

  const handleUpdateSessionDetails = async (name: string, chapter: string, hoursPlayed: string) => {
    if (!user || !activeSession) return;
    try {
      await updateDoc(doc(db, 'sessions', activeSession.id), {
        name: name,
        chapter: chapter,
        hoursPlayed: hoursPlayed ? parseFloat(hoursPlayed) : null,
      });
      toast.success('Session details updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sessions/${activeSession.id}`);
    }
  };

  const handleAddNote = async (content: string) => {
    if (!user || !selectedGame || !content.trim()) return;

    setIsSubmittingNote(true);

    try {
      const sessionNotes = notes.filter(n => n.sessionId === (activeSession?.id || null));
      const lastNote = sessionNotes[sessionNotes.length - 1];
      let newOrder = generateKeyBetween(null, null);
      if (lastNote && typeof lastNote.order === 'string') {
        try {
          newOrder = generateKeyBetween(lastNote.order, null);
        } catch (e) {
          // Fallback if existing order is invalid
          newOrder = generateKeyBetween(null, null);
        }
      }

      // 1. Create the note immediately to ensure it appears in the UI instantly
      const docRef = await addDoc(collection(db, 'notes'), {
        gameId: selectedGame.id,
        sessionId: activeSession?.id || null,
        uid: user.uid,
        content,
        tags: [], // Start with empty tags
        isGlobal: false,
        timestamp: Date.now(),
        order: newOrder
      });

      // 2. Update game's updatedAt
      await updateDoc(doc(db, 'games', selectedGame.id), {
        updatedAt: Date.now()
      });

      setIsSubmittingNote(false);

      // 3. Trigger AI tagging in the background without blocking the UI
      suggestTags(content).then(async (suggestion) => {
        try {
          // Check if the note still exists before updating
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            await updateDoc(docRef, {
              tags: suggestion.tags,
              isGlobal: suggestion.isGlobal
            });
          }
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

    const newOrderArray = arrayMove(sessionNotes, oldIndex, newIndex);
    
    // Find the new neighbors
    const prevNote = newIndex > 0 ? newOrderArray[newIndex - 1] : null;
    const nextNote = newIndex < newOrderArray.length - 1 ? newOrderArray[newIndex + 1] : null;

    let newOrderKey: string;
    try {
      const prevOrder = prevNote && typeof prevNote.order === 'string' ? prevNote.order : null;
      const nextOrder = nextNote && typeof nextNote.order === 'string' ? nextNote.order : null;
      newOrderKey = generateKeyBetween(prevOrder, nextOrder);
    } catch (e) {
      console.warn("Fractional indexing failed, generating fallback key", e);
      newOrderKey = generateKeyBetween(null, null);
    }

    // Update order in Firestore for only the moved note
    try {
      await updateDoc(doc(db, 'notes', active.id as string), { order: newOrderKey });
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
      setHistory([]);
      navigateTo('dashboard', null, null);
    } catch (error) {
      toast.dismiss(loadingToast);
      handleFirestoreError(error, OperationType.DELETE, 'games');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;
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
    } catch (error) {
      toast.dismiss(loadingToast);
      handleFirestoreError(error, OperationType.DELETE, 'sessions');
    }
  };

  const value = {
    user,
    isAuthReady,
    view,
    history,
    games,
    selectedGame,
    sessions,
    activeSession,
    notes,
    notesLimit,
    loadMoreNotes,
    isSubmittingNote,
    navigateTo,
    goBack,
    handleImportDeadSpace2Logs,
    handleAddGame,
    handleStartSession,
    handleResumeSession,
    handleUpdateSessionDetails,
    handleAddNote,
    handleUpdateNote,
    handleDeleteNote,
    handleAddTag,
    handleRemoveTag,
    handleDragEnd,
    handleUpdateGameField,
    handleDeleteGame,
    handleDeleteSession,
    setHistory
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGameContext = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGameContext must be used within a GameProvider');
  }
  return context;
};
