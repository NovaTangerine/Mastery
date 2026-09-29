import { format } from 'date-fns';
import { collection, query, where, orderBy, limit, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Game, GameSession } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';

/** Opens a game's most recent session, creating a first session if it has none. */
export function useResumeGame() {
  const { user } = useAuth();
  const { navigateTo } = useUI();

  return async (game: Game) => {
    try {
      const q = query(
        collection(db, 'sessions'),
        where('gameId', '==', game.id), where('uid', '==', user!.uid),
        orderBy('startTime', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const sessionDoc = snapshot.docs[0];
        const sessionData = { id: sessionDoc.id, ...sessionDoc.data() } as GameSession;
        navigateTo('session-view', game, sessionData);
      } else {
        const now = new Date();
        const hour = now.getHours();
        let timeOfDay = 'Morning';
        if (hour >= 12 && hour < 17) timeOfDay = 'Afternoon';
        else if (hour >= 17 && hour < 21) timeOfDay = 'Evening';
        else if (hour >= 21 || hour < 4) timeOfDay = 'Night';

        const sessionName = `${format(now, 'MMM d')}, ${timeOfDay} Session`;
        const sessionData: any = {
          name: sessionName,
          gameId: game.id,
          uid: user!.uid,
          startTime: now.getTime(),
          progressMarker: 'Starting session',
        };
        const docRef = await addDoc(collection(db, 'sessions'), sessionData);
        const newSession = { id: docRef.id, ...sessionData } as GameSession;
        navigateTo('session-view', game, newSession);
      }
    } catch (error) {
      console.error("Error creating or fetching session", error);
    }
  };
}
