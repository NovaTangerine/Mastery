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
import { db, handleFirestoreError, OperationType, logAppEvent } from '../firebase';
import { Game, GameSession, Note, ViewMode, Draft, SessionGroup, TrackerItem } from '../types';
import { toast } from 'sonner';
import { deadSpace2MockData } from '../mockData/deadSpace2';
import { safeGenerateKeyBetween } from '../lib/fractionalIndexing';
import { writeBatch } from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';

interface GameContextType {
  games: Game[];
  selectedGame: Game | null;
  sessions: GameSession[];
  sessionGroups: SessionGroup[];
  activeSession: GameSession | null;
  drafts: Draft[];

  gamesLimit: number;
  loadMoreGames: () => void;
  sessionsLimit: number;
  loadMoreSessions: () => void;
  sessionGroupsLimit: number;
  loadMoreSessionGroups: () => void;
  draftsLimit: number;
  loadMoreDrafts: () => void;

  handleImportDeadSpace2Logs: () => Promise<void>;
  handleAddGame: (title: string, coverUrl?: string) => Promise<void>;
  handleStartSession: () => Promise<void>;
  handleResumeSession: (session: GameSession) => void;
  handleUpdateSessionDetails: (name: string, chapter: string, hoursPlayed: string, groupId?: string) => Promise<void>;
  handleUpdateGameField: (field: 'overallNotes' | 'storySynopsis', value: string) => Promise<void>;
  handleDeleteGame: () => Promise<void>;
  handleDeleteSession: (sessionId: string) => Promise<void>;
  handleCreateSessionGroup: (title: string) => Promise<{ id: string; title: string } | null>;
  handleUpdateSessionGroup: (groupId: string, title: string) => Promise<void>;
  handleDeleteSessionGroup: (groupId: string) => Promise<void>;
  handleUpdateSessionGroupMembership: (groupId: string, sessionIds: string[]) => Promise<void>;
  handleAddTracker: (title: string) => Promise<void>;
  handleAddTrackerItem: (trackerId: string, item: TrackerItem | string) => Promise<void>;
  handleUpdateTrackerItem: (trackerId: string, itemId: string, updates: Partial<TrackerItem>) => Promise<void>;
  handleRemoveTrackerItem: (trackerId: string, itemId: string | number) => Promise<void>;
  handleDeleteTracker: (trackerId: string) => Promise<void>;
  handleSaveDraft: (content: string, tags: string[]) => Promise<void>;
  handleDeleteDraft: (draftId: string) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthReady } = useAuth();
  const { selectedGameId, activeSessionId, navigateTo, clearHistory } = useUI();

  const [games, setGames] = useState<Game[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [sessionGroups, setSessionGroups] = useState<SessionGroup[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const [gamesLimit, setGamesLimit] = useState(50);
  const [sessionsLimit, setSessionsLimit] = useState(50);
  const [sessionGroupsLimit, setSessionGroupsLimit] = useState(50);
  const [draftsLimit, setDraftsLimit] = useState(50);

  const loadMoreGames = () => setGamesLimit(prev => prev + 50);
  const loadMoreSessions = () => setSessionsLimit(prev => prev + 50);
  const loadMoreSessionGroups = () => setSessionGroupsLimit(prev => prev + 50);
  const loadMoreDrafts = () => setDraftsLimit(prev => prev + 50);

  const selectedGame = games.find(g => g.id === selectedGameId) || null;
  const activeSession = sessions.find(s => s.id === activeSessionId) || null;

  // --- Data Fetching Effects ---
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const q = query(collection(db, 'games'), where('uid', '==', user.uid), orderBy('updatedAt', 'desc'), limit(gamesLimit));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gamesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
      setGames(gamesList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'games'));

    return () => unsubscribe();
  }, [user, isAuthReady, gamesLimit]);

  useEffect(() => {
    if (!user || !selectedGame) return;

    const q = query(collection(db, 'sessions'), where('gameId', '==', selectedGame.id), orderBy('startTime', 'desc'), limit(sessionsLimit));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameSession));
      setSessions(sessionsList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sessions'));

    return () => unsubscribe();
  }, [user, selectedGame, sessionsLimit]);

  useEffect(() => {
    if (!user || !selectedGame) return;

    const q = query(collection(db, 'sessionGroups'), where('gameId', '==', selectedGame.id), orderBy('createdAt', 'asc'), limit(sessionGroupsLimit));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SessionGroup));
      setSessionGroups(groupsList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'sessionGroups'));

    return () => unsubscribe();
  }, [user, selectedGame, sessionGroupsLimit]);

  useEffect(() => {
    if (!user || !isAuthReady) return;

    const q = query(collection(db, 'drafts'), where('uid', '==', user.uid), orderBy('updatedAt', 'desc'), limit(draftsLimit));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const draftsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Draft));
      setDrafts(draftsList);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'drafts'));

    return () => unsubscribe();
  }, [user, isAuthReady, draftsLimit]);

  // --- Handlers ---
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
          lastOrder = safeGenerateKeyBetween(lastOrder, null);
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

  const handleAddGame = async (title: string, coverUrl?: string) => {
    if (!user || !title.trim()) return;
    try {
      const gameData: any = {
        title: title,
        status: 'playing',
        uid: user.uid,
        overallNotes: '',
        storySynopsis: '',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      if (coverUrl) {
        gameData.coverUrl = coverUrl;
      }
      
      await addDoc(collection(db, 'games'), gameData);
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

  const handleUpdateSessionDetails = async (name: string, chapter: string, hoursPlayed: string, groupId?: string) => {
    if (!user || !activeSession) return;
    try {
      const updateData: any = {
        name: name,
        chapter: chapter,
        hoursPlayed: hoursPlayed ? parseFloat(hoursPlayed) : null,
      };
      if (groupId !== undefined) {
        updateData.groupId = groupId === '' ? null : groupId;
      }
      await updateDoc(doc(db, 'sessions', activeSession.id), updateData);
      toast.success('Session details updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sessions/${activeSession.id}`);
    }
  };

  const handleCreateSessionGroup = async (title: string) => {
    if (!user || !selectedGame || !title.trim()) return null;
    try {
      const lastGroup = sessionGroups[sessionGroups.length - 1];
      let newOrder = safeGenerateKeyBetween(null, null);
      if (lastGroup && typeof lastGroup.order === 'string') {
        newOrder = safeGenerateKeyBetween(lastGroup.order, null);
      }

      const docRef = await addDoc(collection(db, 'sessionGroups'), {
        gameId: selectedGame.id,
        uid: user.uid,
        title: title.trim(),
        createdAt: Date.now(),
        order: newOrder
      });
      toast.success('Group created');
      return { id: docRef.id, title: title.trim() };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'sessionGroups');
      return null;
    }
  };

  const handleUpdateSessionGroup = async (groupId: string, title: string) => {
    if (!user || !title.trim()) return;
    try {
      await updateDoc(doc(db, 'sessionGroups', groupId), {
        title: title.trim()
      });
      toast.success('Group updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sessionGroups/${groupId}`);
    }
  };

  const handleDeleteSessionGroup = async (groupId: string) => {
    if (!user) return;
    try {
      // First, remove the groupId from any sessions that belong to it
      const sessionsInGroup = sessions.filter(s => s.groupId === groupId);
      if (sessionsInGroup.length > 0) {
        const batch = writeBatch(db);
        sessionsInGroup.forEach(session => {
          batch.update(doc(db, 'sessions', session.id), { groupId: null });
        });
        await batch.commit();
      }

      // Then delete the group itself
      await deleteDoc(doc(db, 'sessionGroups', groupId));
      toast.success('Group deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `sessionGroups/${groupId}`);
    }
  };

  const handleUpdateSessionGroupMembership = async (groupId: string, sessionIds: string[]) => {
    if (!user) return;
    try {
      const batch = writeBatch(db);
      
      // Update sessions that should be in the group
      sessionIds.forEach(sessionId => {
        batch.update(doc(db, 'sessions', sessionId), { groupId });
      });

      // Find sessions currently in the group that are no longer in the list and remove them
      const sessionsCurrentlyInGroup = sessions.filter(s => s.groupId === groupId);
      sessionsCurrentlyInGroup.forEach(session => {
        if (!sessionIds.includes(session.id)) {
          batch.update(doc(db, 'sessions', session.id), { groupId: null });
        }
      });

      await batch.commit();
      toast.success('Group membership updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sessions batch update`);
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
      clearHistory();
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

  const handleAddTracker = async (title: string) => {
    if (!user || !activeSession) return;
    try {
      const newTracker = {
        id: crypto.randomUUID(),
        title,
        items: [],
        order: safeGenerateKeyBetween(null, null)
      };
      
      const updatedTrackers = [...(activeSession.trackers || []), newTracker];
      
      await updateDoc(doc(db, 'sessions', activeSession.id), {
        trackers: updatedTrackers
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'sessions');
    }
  };

  const handleAddTrackerItem = async (trackerId: string, item: TrackerItem | string) => {
    if (!user || !activeSession) return;
    try {
      const updatedTrackers = (activeSession.trackers || []).map(t => {
        if (t.id === trackerId) {
          return { ...t, items: [...(t.items || []), item] };
        }
        return t;
      });
      
      await updateDoc(doc(db, 'sessions', activeSession.id), {
        trackers: updatedTrackers
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add tracker item');
      handleFirestoreError(error, OperationType.UPDATE, 'sessions');
    }
  };

  const handleUpdateTrackerItem = async (trackerId: string, itemId: string, updates: Partial<TrackerItem>) => {
    if (!user || !activeSession) return;
    try {
      const updatedTrackers = (activeSession.trackers || []).map(t => {
        if (t.id === trackerId) {
          const newItems = t.items.map(item => {
            if (typeof item === 'object' && item.id === itemId) {
              return { ...item, ...updates };
            }
            return item;
          });
          return { ...t, items: newItems };
        }
        return t;
      });
      
      await updateDoc(doc(db, 'sessions', activeSession.id), {
        trackers: updatedTrackers
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'sessions');
    }
  };

  const handleRemoveTrackerItem = async (trackerId: string, itemId: string | number) => {
    if (!user || !activeSession) return;
    try {
      const updatedTrackers = (activeSession.trackers || []).map(t => {
        if (t.id === trackerId) {
          const newItems = t.items.filter((item, i) => {
            if (typeof itemId === 'number') return i !== itemId;
            if (typeof item === 'object') return item.id !== itemId;
            return true;
          });
          return { ...t, items: newItems };
        }
        return t;
      });
      
      await updateDoc(doc(db, 'sessions', activeSession.id), {
        trackers: updatedTrackers
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'sessions');
    }
  };

  const handleDeleteTracker = async (trackerId: string) => {
    if (!user || !activeSession) return;
    try {
      const updatedTrackers = (activeSession.trackers || []).filter(t => t.id !== trackerId);
      
      await updateDoc(doc(db, 'sessions', activeSession.id), {
        trackers: updatedTrackers
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'sessions');
    }
  };

  const handleSaveDraft = async (content: string, tags: string[]) => {
    if (!user || !selectedGame) return;
    try {
      await addDoc(collection(db, 'drafts'), {
        gameId: selectedGame.id,
        sessionId: activeSession?.id || null,
        uid: user.uid,
        content,
        tags,
        updatedAt: Date.now()
      });
      toast.success('Draft saved');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'drafts');
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await deleteDoc(doc(db, 'drafts', draftId));
      toast.success('Draft deleted');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'drafts');
    }
  };

  const value = {
    games,
    selectedGame,
    sessions,
    sessionGroups,
    activeSession,
    drafts,
    gamesLimit,
    loadMoreGames,
    sessionsLimit,
    loadMoreSessions,
    sessionGroupsLimit,
    loadMoreSessionGroups,
    draftsLimit,
    loadMoreDrafts,
    handleImportDeadSpace2Logs,
    handleAddGame,
    handleStartSession,
    handleResumeSession,
    handleUpdateSessionDetails,
    handleUpdateGameField,
    handleDeleteGame,
    handleDeleteSession,
    handleCreateSessionGroup,
    handleUpdateSessionGroup,
    handleDeleteSessionGroup,
    handleUpdateSessionGroupMembership,
    handleAddTracker,
    handleAddTrackerItem,
    handleUpdateTrackerItem,
    handleRemoveTrackerItem,
    handleDeleteTracker,
    handleSaveDraft,
    handleDeleteDraft
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
