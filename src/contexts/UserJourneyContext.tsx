import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getCountFromServer, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

interface UserJourneyContextType {
  totalGames: number;
  totalSessions: number;
  totalNotes: number;
  totalTrackers: number;
  hasLoggedAnySession: boolean;
  hasCreatedAnyNote: boolean;
  isPowerUser: boolean;
  isEligibleForGameOnboarding: boolean;
  isEligibleForTrackerOnboarding: boolean;
  isLoadingStats: boolean;
  refreshStats: () => Promise<void>;
}

const UserJourneyContext = createContext<UserJourneyContextType | undefined>(undefined);

export const UserJourneyProvider = ({ children }: { children: React.ReactNode }) => {
  const { user, isAuthReady } = useAuth();
  
  const [totalGames, setTotalGames] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);
  const [totalTrackers, setTotalTrackers] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const fetchStats = async () => {
    if (!user) {
      setTotalGames(0);
      setTotalSessions(0);
      setTotalNotes(0);
      setTotalTrackers(0);
      setIsLoadingStats(false);
      return;
    }

    try {
      setIsLoadingStats(true);
      
      const sessionsQuery = query(collection(db, 'sessions'), where('uid', '==', user.uid));
      
      const [gamesSnapshot, sessionsDocs, notesSnapshot] = await Promise.all([
        getCountFromServer(query(collection(db, 'games'), where('uid', '==', user.uid))),
        getDocs(sessionsQuery),
        getCountFromServer(query(collection(db, 'notes'), where('uid', '==', user.uid))),
      ]);

      setTotalGames(gamesSnapshot.data().count);
      setTotalSessions(sessionsDocs.size);
      
      let trackersCount = 0;
      sessionsDocs.forEach(doc => {
        const data = doc.data();
        trackersCount += (data.metrics?.length || 0);
        trackersCount += (data.trackers?.length || 0);
      });
      setTotalTrackers(trackersCount);
      
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
  const isEligibleForTrackerOnboarding = !isLoadingStats && totalTrackers < 10 && !isPowerUser;

  return (
    <UserJourneyContext.Provider 
      value={{ 
        totalGames, 
        totalSessions, 
        totalNotes, 
        totalTrackers,
        hasLoggedAnySession, 
        hasCreatedAnyNote, 
        isPowerUser,
        isEligibleForGameOnboarding, 
        isEligibleForTrackerOnboarding,
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
