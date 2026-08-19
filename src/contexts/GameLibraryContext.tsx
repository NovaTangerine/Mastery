import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  limit,
  startAfter
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Game } from '../types';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';
import { useUI } from './UIContext';
import { useUserJourney } from './UserJourneyContext';

// --- GameLibraryContext Definition ---
export interface GameLibraryContextType {
  games: Game[];
  gamesLimit: number;
  loadMoreGames: () => void;
  handleAddGame: (title: string, coverUrl?: string) => Promise<string | undefined>;
  handleDeleteGame: (targetGameId?: string) => Promise<void>;
  handleUpdateGameDetails: (gameId: string, title: string, coverUrl?: string | null) => Promise<void>;
}

const GameLibraryContext = createContext<GameLibraryContextType | undefined>(undefined);

export const GameLibraryProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthReady } = useAuth();
  const { selectedGameId, navigateTo, clearHistory } = useUI();
  const { refreshStats } = useUserJourney();

  const [firstPageGames, setFirstPageGames] = useState<Game[]>([]);
  const [historicalGames, setHistoricalGames] = useState<Game[]>([]);
  const [firstPageLastDoc, setFirstPageLastDoc] = useState<any>(null);
  const [historicalLastDoc, setHistoricalLastDoc] = useState<any>(null);
  const [hasMoreGames, setHasMoreGames] = useState(true);
  const [isLoadingMoreGames, setIsLoadingMoreGames] = useState(false);

  // Derived games state
  const games = useMemo(() => {
    const idMap = new Set<string>();
    const merged: Game[] = [];
    const combined = [...firstPageGames, ...historicalGames];
    for (const g of combined) {
      if (!idMap.has(g.id)) {
        idMap.add(g.id);
        merged.push(g);
      }
    }
    return merged;
  }, [firstPageGames, historicalGames]);

  const gamesLimit = 50 + historicalGames.length;

  const loadMoreGames = useCallback(async () => {
    if (isLoadingMoreGames || !hasMoreGames || !user) return;
    const cursor = historicalLastDoc || firstPageLastDoc;
    if (!cursor) {
      setHasMoreGames(false);
      return;
    }
    setIsLoadingMoreGames(true);
    try {
      const q = query(
        collection(db, 'games'),
        where('uid', '==', user.uid),
        orderBy('updatedAt', 'desc'),
        startAfter(cursor),
        limit(50)
      );
      const querySnapshot = await getDocs(q);
      const gamesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
      if (gamesList.length < 50) {
        setHasMoreGames(false);
      }
      if (gamesList.length > 0) {
        setHistoricalGames(prev => [...prev, ...gamesList]);
        setHistoricalLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
    } catch (error) {
      console.error("Error loading more games:", error);
    } finally {
      setIsLoadingMoreGames(false);
    }
  }, [user, historicalLastDoc, firstPageLastDoc, isLoadingMoreGames, hasMoreGames]);

  // Reset games pagination on user change
  useEffect(() => {
    setFirstPageGames([]);
    setHistoricalGames([]);
    setFirstPageLastDoc(null);
    setHistoricalLastDoc(null);
    setHasMoreGames(true);
    setIsLoadingMoreGames(false);
  }, [user]);

  // First page games subscription (limit 50)
  useEffect(() => {
    if (!user || !isAuthReady) return;

    const q = query(
      collection(db, 'games'), 
      where('uid', '==', user.uid), 
      orderBy('updatedAt', 'desc'), 
      limit(50)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const gamesList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Game));
      setFirstPageGames(gamesList);
      if (snapshot.docs.length > 0) {
        setFirstPageLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setFirstPageLastDoc(null);
      }
      if (gamesList.length < 50) {
        setHasMoreGames(false);
      } else {
        setHasMoreGames(true);
      }
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'games'));

    return () => unsubscribe();
  }, [user, isAuthReady]);

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
      refreshStats();
      toast.success('Game added to your library');
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'games');
      return undefined;
    }
  };

  const handleUpdateGameDetails = async (gameId: string, title: string, coverUrl?: string | null) => {
    try {
      const { deleteField } = await import('firebase/firestore');
      const updateData: any = {
        title,
        updatedAt: Date.now()
      };
      if (coverUrl === null) {
        updateData.coverUrl = deleteField();
      } else if (coverUrl !== undefined) {
        updateData.coverUrl = coverUrl;
      }
      
      await updateDoc(doc(db, 'games', gameId), updateData);
      toast.success('Game synced successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'games');
    }
  };

  const handleDeleteGame = async (targetGameId?: string) => {
    const gameId = targetGameId || selectedGameId;
    if (!gameId || !user) return;
    const loadingToast = toast.loading('Deleting game and all associated data...');
    
    try {
      // 1. Delete all notes for this game
      const notesQuery = query(collection(db, 'notes'), where('gameId', '==', gameId), where('uid', '==', user.uid));
      const notesSnapshot = await getDocs(notesQuery);
      const noteDeletions = notesSnapshot.docs.map(noteDoc => deleteDoc(doc(db, 'notes', noteDoc.id)));
      
      // 2. Delete all sessions for this game
      const sessionsQuery = query(collection(db, 'sessions'), where('gameId', '==', gameId), where('uid', '==', user.uid));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessionDeletions = sessionsSnapshot.docs.map(sessionDoc => deleteDoc(doc(db, 'sessions', sessionDoc.id)));
      
      // 3. Delete the game itself
      const gameDeletion = deleteDoc(doc(db, 'games', gameId));
      
      await Promise.all([...noteDeletions, ...sessionDeletions, gameDeletion]);
      refreshStats();
      
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

  return (
    <GameLibraryContext.Provider value={{
      games,
      gamesLimit,
      loadMoreGames,
      handleAddGame,
      handleDeleteGame,
      handleUpdateGameDetails
    }}>
      {children}
    </GameLibraryContext.Provider>
  );
};

export const useGameLibrary = () => {
  const context = useContext(GameLibraryContext);
  if (context === undefined) {
    throw new Error('useGameLibrary must be used within a GameLibraryProvider');
  }
  return context;
};
