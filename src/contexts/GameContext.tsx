import React, { createContext, useContext, useState, useEffect } from 'react';
import { format } from 'date-fns';
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
  limit,
  deleteField
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, logAppEvent } from '../firebase';
import { Game, GameSession, Note, ViewMode, Draft, SessionGroup, TrackerItem, SessionMetric } from '../types';
import { toast } from 'sonner';
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
  isSessionsLoading: boolean;
  sessionGroupsLimit: number;
  loadMoreSessionGroups: () => void;
  draftsLimit: number;
  loadMoreDrafts: () => void;

  handleAddGame: (title: string, coverUrl?: string) => Promise<string | undefined>;
  handleStartSession: (groupId?: string) => Promise<void>;
  handleResumeSession: (session: GameSession) => void;
  handleUpdateSessionDetails: (name: string, chapter: string, hoursPlayed: string, groupId?: string, targetSessionId?: string) => Promise<void>;
  handleUpdateSessionTags: (sessionId: string, tags: string[]) => Promise<void>;
  handleUpdateGameField: (field: 'overallNotes' | 'storySynopsis', value: string) => Promise<void>;
  handleUpdateGameStatus: (status: Game['status']) => Promise<void>;
  handleUpdateGameDetails: (gameId: string, title: string, coverUrl?: string) => Promise<void>;
  handleDeleteGame: (targetGameId?: string) => Promise<void>;
  handleDeleteSession: (sessionId: string) => Promise<void>;
  handleDeleteSessionAndShiftFocus: (sessionId: string) => Promise<void>;
  checkSessionHasNotes: (sessionId: string) => Promise<boolean>;
  getSessionNotesCount: (sessionId: string) => Promise<number>;
  handleCreateSessionGroup: (title: string) => Promise<{ id: string; title: string } | null>;
  handleUpdateSessionGroup: (groupId: string, title: string) => Promise<void>;
  handleDeleteSessionGroup: (groupId: string) => Promise<void>;
  handleUpdateSessionGroupMembership: (groupId: string, sessionIds: string[]) => Promise<void>;
  handleAddTracker: (title: string) => Promise<void>;
  handleUpdateTracker: (trackerId: string, title: string) => Promise<void>;
  handleAddTrackerItem: (trackerId: string, item: TrackerItem | string) => Promise<void>;
  handleUpdateTrackerItem: (trackerId: string, itemId: string, updates: Partial<TrackerItem>) => Promise<void>;
  handleRemoveTrackerItem: (trackerId: string, itemId: string | number) => Promise<void>;
  handleDeleteTracker: (trackerId: string) => Promise<void>;
  handleMigrateLegacyTrackers: () => Promise<void>;
  handleAddMetric: (metric: Omit<SessionMetric, 'id'>) => Promise<string | undefined>;
  handleUpdateMetric: (metricId: string, updates: Partial<SessionMetric>) => Promise<void>;
  handleDeleteMetric: (metricId: string) => Promise<void>;
  handleSaveDraft: (content: string, tags: string[]) => Promise<void>;
  handleDeleteDraft: (draftId: string) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthReady } = useAuth();
  const { selectedGameId, activeSessionId, navigateTo, goBack, clearHistory } = useUI();

  const [games, setGames] = useState<Game[]>([]);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [sessionGroups, setSessionGroups] = useState<SessionGroup[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);

  const [gamesLimit, setGamesLimit] = useState(50);
  const [sessionsLimit, setSessionsLimit] = useState(50);
  const [sessionGroupsLimit, setSessionGroupsLimit] = useState(50);
  const [draftsLimit, setDraftsLimit] = useState(50);

  const [isSessionsLoading, setIsSessionsLoading] = useState(false);

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
    if (!user || !selectedGame) {
      setSessions([]);
      setIsSessionsLoading(false);
      return;
    }

    setIsSessionsLoading(true);
    const q = query(collection(db, 'sessions'), where('gameId', '==', selectedGame.id), orderBy('startTime', 'desc'), limit(sessionsLimit));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameSession));
      setSessions(sessionsList);
      setIsSessionsLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'sessions');
      setIsSessionsLoading(false);
    });

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
      
      const docRef = await addDoc(collection(db, 'games'), gameData);
      toast.success('Game added to your library');
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'games');
      return undefined;
    }
  };

  const handleStartSession = async (groupId?: string) => {
    if (!user || !selectedGame) return;
    try {
      const now = new Date();
      const hour = now.getHours();
      let timeOfDay = 'Morning';
      if (hour >= 12 && hour < 17) timeOfDay = 'Afternoon';
      else if (hour >= 17 && hour < 21) timeOfDay = 'Evening';
      else if (hour >= 21 || hour < 4) timeOfDay = 'Night';

      const sessionName = `${format(now, 'MMM d')}, ${timeOfDay} Session`;

      const sessionData: any = {
        name: sessionName,
        gameId: selectedGame.id,
        uid: user.uid,
        startTime: now.getTime(),
        progressMarker: 'Starting session'
      };
      if (groupId) {
        sessionData.groupId = groupId;
      }
      const docRef = await addDoc(collection(db, 'sessions'), sessionData);
      const newSession = { id: docRef.id, ...sessionData };
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

  const handleUpdateSessionDetails = async (name: string, chapter: string, hoursPlayed: string, groupId?: string, targetSessionId?: string) => {
    if (!user || (!activeSession && !targetSessionId)) return;
    const sessionIdToUpdate = targetSessionId || activeSession?.id;
    if (!sessionIdToUpdate) return;
    
    try {
      const updateData: any = {
        name: name,
        chapter: chapter,
        hoursPlayed: hoursPlayed ? parseFloat(hoursPlayed) : null,
      };
      if (groupId !== undefined) {
        updateData.groupId = groupId === '' ? null : groupId;
      }
      await updateDoc(doc(db, 'sessions', sessionIdToUpdate), updateData);
      toast.success('Session details updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sessions/${sessionIdToUpdate}`);
    }
  };

  const handleUpdateSessionTags = async (sessionId: string, tags: string[]) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'sessions', sessionId), { tags });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `sessions/${sessionId}`);
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

  const handleUpdateGameStatus = async (status: Game['status']) => {
    if (!selectedGame) return;
    try {
      await updateDoc(doc(db, 'games', selectedGame.id), {
        status,
        updatedAt: Date.now()
      });
      toast.success('Game status updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'games');
    }
  };

  const handleUpdateGameDetails = async (gameId: string, title: string, coverUrl?: string) => {
    try {
      const updateData: any = {
        title,
        updatedAt: Date.now()
      };
      if (coverUrl !== undefined) {
        updateData.coverUrl = coverUrl;
      }
      
      await updateDoc(doc(db, 'games', gameId), updateData);
      toast.success('Game synced successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'games');
    }
  };

  const handleDeleteGame = async (targetGameId?: string) => {
    const gameId = targetGameId || selectedGame?.id;
    if (!gameId || !user) return;
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
      
      // Reset state if it was the selected game
      if (selectedGameId === gameId) {
        clearHistory();
        navigateTo('dashboard', null, null);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      handleFirestoreError(error, OperationType.DELETE, 'games');
    }
  };

  const checkSessionHasNotes = async (sessionId: string) => {
    if (!user) return false;
    try {
      const q = query(
        collection(db, 'notes'),
        where('sessionId', '==', sessionId),
        where('uid', '==', user.uid),
        limit(1)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const getSessionNotesCount = async (sessionId: string) => {
    if (!user) return 0;
    try {
      const q = query(
        collection(db, 'notes'),
        where('sessionId', '==', sessionId),
        where('uid', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error(error);
      return 0;
    }
  };

  const handleDeleteSessionAndShiftFocus = async (sessionId: string) => {
    if (!user || !selectedGame) return;
    
    // Find the next session before we delete, to shift focus seamlessly if it's the active session
    let nextSession = null;
    try {
        const notesQ = query(
            collection(db, 'notes'),
            where('gameId', '==', selectedGame.id),
            where('uid', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
        const notesSnapshot = await getDocs(notesQ);
        let foundSessionId = null;
        for (const doc of notesSnapshot.docs) {
             const data = doc.data();
             if (data.sessionId && data.sessionId !== sessionId) {
                 foundSessionId = data.sessionId;
                 break;
             }
        }
        const availableSessions = sessions.filter(s => s.id !== sessionId);
        if (foundSessionId) {
             nextSession = availableSessions.find(s => s.id === foundSessionId) || null;
        }
        if (!nextSession && availableSessions.length > 0) {
            nextSession = availableSessions.sort((a, b) => b.startTime - a.startTime)[0];
        }
    } catch(e) {
        console.error("Error finding next session", e);
        const availableSessions = sessions.filter(s => s.id !== sessionId);
        if (availableSessions.length > 0) {
            nextSession = availableSessions.sort((a, b) => b.startTime - a.startTime)[0];
        }
    }
    
    await handleDeleteSession(sessionId);
    
    if (activeSessionId === sessionId) {
        if (nextSession) {
            navigateTo('session-view', selectedGame, nextSession);
        } else {
            goBack();
        }
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

  const handleUpdateTracker = async (trackerId: string, title: string) => {
    if (!user || !activeSession) return;
    try {
      const updatedTrackers = (activeSession.trackers || []).map(t => {
        if (t.id === trackerId) {
          return { ...t, title };
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

  const handleAddMetric = async (metric: Omit<SessionMetric, 'id'>) => {
    if (!user || !activeSession) return undefined;
    try {
      const newId = crypto.randomUUID();
      
      const game = games.find(g => g.id === activeSession.gameId);
      if (game?.title === 'Acme Gaming') {
        const trackers = activeSession.trackers || [];
        const groupTitle = metric.group || 'General';
        const existingTrackerIndex = trackers.findIndex(t => t.title === groupTitle);
        
        let newTrackers = [...trackers];
        const trackerItem: TrackerItem = {
          id: newId,
          title: metric.title,
          description: metric.description,
          quantifierType: metric.measurementType === 'visual_counter' || metric.measurementType === 'numeric_counter' ? 'stepper' :
                          metric.measurementType === 'progress' ? 'progress' :
                          metric.measurementType === 'checkbox' ? 'checkbox' : 'none',
          currentValue: metric.currentCount ?? metric.currentValue ?? 0,
          maxValue: metric.targetCount ?? metric.maxValue ?? 10,
          completed: metric.completed ?? false
        };

        if (existingTrackerIndex >= 0) {
          const tracker = { ...newTrackers[existingTrackerIndex] };
          tracker.items = [...tracker.items, trackerItem];
          newTrackers[existingTrackerIndex] = tracker;
        } else {
          newTrackers.push({
            id: crypto.randomUUID(),
            title: groupTitle,
            items: [trackerItem],
            order: ''
          });
        }
        
        const cleanedTrackers = JSON.parse(JSON.stringify(newTrackers));
        await updateDoc(doc(db, 'sessions', activeSession.id), {
          trackers: cleanedTrackers
        });
        return newId;
      }
      
      const updatedMetrics = [...(activeSession.metrics || []), { ...metric, id: newId }];
      const cleanedMetrics = JSON.parse(JSON.stringify(updatedMetrics));
      await updateDoc(doc(db, 'sessions', activeSession.id), {
        metrics: cleanedMetrics
      });
      return newId;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'sessions');
      return undefined;
    }
  };

  const handleUpdateMetric = async (metricId: string, updates: Partial<SessionMetric>) => {
    if (!user || !activeSession) return;
    try {
      const game = games.find(g => g.id === activeSession.gameId);
      if (game?.title === 'Acme Gaming') {
        let newTrackers = [...(activeSession.trackers || [])];
        let oldTrackerIndex = -1;
        let itemIndex = -1;
        let foundItem: TrackerItem | null = null;
        
        for (let i = 0; i < newTrackers.length; i++) {
          const idx = newTrackers[i].items.findIndex(it => typeof it !== 'string' && it.id === metricId);
          if (idx >= 0) {
            oldTrackerIndex = i;
            itemIndex = idx;
            foundItem = newTrackers[i].items[idx] as TrackerItem;
            break;
          }
        }
        
        if (foundItem && oldTrackerIndex >= 0) {
          // Update item properties
          let newItem = { ...foundItem };
          if (updates.title !== undefined) newItem.title = updates.title;
          if (updates.description !== undefined) newItem.description = updates.description;
          if (updates.measurementType !== undefined) {
             newItem.quantifierType = updates.measurementType === 'visual_counter' || updates.measurementType === 'numeric_counter' ? 'stepper' :
                                      updates.measurementType === 'progress' ? 'progress' :
                                      updates.measurementType === 'checkbox' ? 'checkbox' : 'none';
          }
          if (updates.currentCount !== undefined) newItem.currentValue = updates.currentCount;
          if (updates.currentValue !== undefined) newItem.currentValue = updates.currentValue;
          if (updates.targetCount !== undefined) newItem.maxValue = updates.targetCount;
          if (updates.maxValue !== undefined) newItem.maxValue = updates.maxValue;
          if (updates.completed !== undefined) newItem.completed = updates.completed;
          
          const newGroupTitle = updates.group || 'General';
          if (('group' in updates) && newGroupTitle !== newTrackers[oldTrackerIndex].title) {
             // Group changed, move item to new tracker
             newTrackers[oldTrackerIndex] = {
               ...newTrackers[oldTrackerIndex],
               items: newTrackers[oldTrackerIndex].items.filter((_, idx) => idx !== itemIndex)
             };
             
             const newTrackerIndex = newTrackers.findIndex(t => t.title === newGroupTitle);
             if (newTrackerIndex >= 0) {
               newTrackers[newTrackerIndex] = {
                 ...newTrackers[newTrackerIndex],
                 items: [...newTrackers[newTrackerIndex].items, newItem]
               };
             } else {
               newTrackers.push({
                 id: crypto.randomUUID(),
                 title: newGroupTitle,
                 items: [newItem],
                 order: ''
               });
             }
          } else {
             newTrackers[oldTrackerIndex] = {
               ...newTrackers[oldTrackerIndex],
               items: newTrackers[oldTrackerIndex].items.map((it, idx) => idx === itemIndex ? newItem : it)
             };
          }
          
          const cleanedTrackers = JSON.parse(JSON.stringify(newTrackers));
          await updateDoc(doc(db, 'sessions', activeSession.id), {
            trackers: cleanedTrackers
          });
        }
        return;
      }
      
      const updatedMetrics = (activeSession.metrics || []).map(m => {
        if (m.id === metricId) {
          const newMetric = { ...m, ...updates };
          // If measurement type changed to none, cleanup old fields
          if (updates.measurementType === 'none') {
            delete newMetric.currentCount;
            delete newMetric.targetCount;
            delete newMetric.currentValue;
            delete newMetric.completed;
          } else if (updates.measurementType) {
             if (updates.measurementType !== m.measurementType) {
               delete newMetric.currentCount;
               delete newMetric.targetCount;
               delete newMetric.currentValue;
               delete newMetric.completed;
               if (updates.measurementType === 'visual_counter' || updates.measurementType === 'numeric_counter') newMetric.currentCount = 0;
               if (updates.measurementType === 'progress') newMetric.currentValue = 0;
               if (updates.measurementType === 'checkbox') newMetric.completed = false;
             }
          }
          return newMetric;
        }
        return m;
      });
      const cleanedMetrics = JSON.parse(JSON.stringify(updatedMetrics));
      await updateDoc(doc(db, 'sessions', activeSession.id), {
        metrics: cleanedMetrics
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'sessions');
    }
  };

  const handleDeleteMetric = async (metricId: string) => {
    if (!user || !activeSession) return;
    try {
      const game = games.find(g => g.id === activeSession.gameId);
      if (game?.title === 'Acme Gaming') {
        let newTrackers = [...(activeSession.trackers || [])];
        for (let i = 0; i < newTrackers.length; i++) {
          newTrackers[i] = {
            ...newTrackers[i],
            items: newTrackers[i].items.filter(it => typeof it !== 'string' ? it.id !== metricId : true)
          };
        }
        
        const cleanedTrackers = JSON.parse(JSON.stringify(newTrackers));
        await updateDoc(doc(db, 'sessions', activeSession.id), {
          trackers: cleanedTrackers
        });
        return;
      }
      
      const updatedMetrics = (activeSession.metrics || []).filter(m => m.id !== metricId);
      const cleanedMetrics = JSON.parse(JSON.stringify(updatedMetrics));
      await updateDoc(doc(db, 'sessions', activeSession.id), {
        metrics: cleanedMetrics
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'sessions');
    }
  };

  const handleMigrateLegacyTrackers = async () => {
    if (!user || !activeSession || !activeSession.trackers?.length) return;
    try {
      const newMetrics: SessionMetric[] = [];
      for (const t of activeSession.trackers) {
        if (t.items && t.items.length > 0) {
          for (const item of t.items) {
            const isString = typeof item === 'string';
            const title = isString ? item : item.title;
            const description = isString ? undefined : item.description;
            const completed = isString ? false : item.completed;
            const oldType = isString ? 'checkbox' : item.quantifierType;
            let measurementType: 'none' | 'visual_counter' | 'numeric_counter' | 'checkbox' | 'progress' = 'checkbox';
            
            if (oldType === 'none') measurementType = 'none';
            if (oldType === 'stepper') measurementType = 'visual_counter';
            if (oldType === 'progress') measurementType = 'progress';
            if (oldType === 'checkbox') measurementType = 'checkbox';
            
            newMetrics.push({
              id: crypto.randomUUID(),
              title: `[${t.title}] ${title}`,
              description,
              measurementType,
              completed,
              currentCount: (!isString && measurementType === 'visual_counter') ? item.currentValue : undefined,
              targetCount: (!isString && measurementType === 'visual_counter') ? item.maxValue : undefined,
              currentValue: (!isString && measurementType === 'progress') ? item.currentValue : undefined
            });
          }
        } else {
          newMetrics.push({
            id: crypto.randomUUID(),
            title: t.title,
            measurementType: 'none'
          });
        }
      }

      const updatedMetrics = [...(activeSession.metrics || []), ...newMetrics];
      const cleanedMetrics = JSON.parse(JSON.stringify(updatedMetrics));

      await updateDoc(doc(db, 'sessions', activeSession.id), {
        metrics: cleanedMetrics,
        trackers: deleteField()
      });
      
      toast.success('Successfully migrated old trackers.');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'sessions');
      toast.error('Failed to migrate trackers.');
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
    isSessionsLoading,
    sessionGroupsLimit,
    loadMoreSessionGroups,
    draftsLimit,
    loadMoreDrafts,
    handleAddGame,
    handleStartSession,
    handleResumeSession,
    handleUpdateSessionDetails,
    handleUpdateSessionTags,
    handleUpdateGameField,
    handleUpdateGameStatus,
    handleUpdateGameDetails,
    handleDeleteGame,
    handleDeleteSession,
    handleDeleteSessionAndShiftFocus,
    checkSessionHasNotes,
    getSessionNotesCount,
    handleCreateSessionGroup,
    handleUpdateSessionGroup,
    handleDeleteSessionGroup,
    handleUpdateSessionGroupMembership,
    handleAddTracker,
    handleUpdateTracker,
    handleAddTrackerItem,
    handleUpdateTrackerItem,
    handleRemoveTrackerItem,
    handleDeleteTracker,
    handleMigrateLegacyTrackers,
    handleAddMetric,
    handleUpdateMetric,
    handleDeleteMetric,
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
