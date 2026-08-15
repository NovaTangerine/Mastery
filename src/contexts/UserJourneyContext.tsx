import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

interface UserJourneyContextType {
  totalGames: number;
  totalSessions: number;
  totalNotes: number;
  hasLoggedAnySession: boolean;
  hasCreatedAnyNote: boolean;
  isPowerUser: boolean;
  isEligibleForGameOnboarding: boolean;
  isLoadingStats: boolean;
  refreshStats: () => Promise<void>;
}

const UserJourneyContext = createContext<UserJourneyContextType | undefined>(undefined);

export const UserJourneyProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthReady } = useAuth();
  
  const [totalGames, setTotalGames] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const fetchStats = async () => {
    if (!user) {
      setTotalGames(0);
      setTotalSessions(0);
      setTotalNotes(0);
      setIsLoadingStats(false);
      return;
    }

    try {
      setIsLoadingStats(true);
      
      const [gamesSnapshot, sessionsSnapshot, notesSnapshot] = await Promise.all([
        getCountFromServer(query(collection(db, 'games'), where('uid', '==', user.uid))),
        getCountFromServer(query(collection(db, 'sessions'), where('uid', '==', user.uid))),
        getCountFromServer(query(collection(db, 'notes'), where('uid', '==', user.uid))),
      ]);

      setTotalGames(gamesSnapshot.data().count);
      setTotalSessions(sessionsSnapshot.data().count);
      setTotalNotes(notesSnapshot.data().count);
    } catch (error) {
      console.error('Error fetching user journey stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isAuthReady) {
      fetchStats();
    }
  }, [user, isAuthReady]);

  const hasLoggedAnySession = totalSessions > 0;
  const hasCreatedAnyNote = totalNotes > 0;
  const isPowerUser = totalGames >= 5 && totalSessions >= 10; // Simple heuristic
  const isEligibleForGameOnboarding = !isLoadingStats && totalGames <= 3;

  return (
    <UserJourneyContext.Provider 
      value={{ 
        totalGames, 
        totalSessions, 
        totalNotes, 
        hasLoggedAnySession, 
        hasCreatedAnyNote, 
        isPowerUser,
        isEligibleForGameOnboarding, 
        isLoadingStats,
        refreshStats: fetchStats
      }}
    >
      {children}
    </UserJourneyContext.Provider>
  );
};

export const useUserJourney = () => {
  const context = useContext(UserJourneyContext);
  if (context === undefined) {
    throw new Error('useUserJourney must be used within a UserJourneyProvider');
  }
  return context;
};
