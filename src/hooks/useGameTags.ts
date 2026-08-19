import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export function useGameTags(gameId: string | null) {
  const [tags, setTags] = useState<string[]>([]);
  const { user, isAuthReady } = useAuth();

  useEffect(() => {
    if (!isAuthReady || !user) {
      if (!isAuthReady) return;
      setTags([]);
      return;
    }

    if (!gameId) {
      setTags([]);
      return;
    }

    const q = query(
      collection(db, 'notes'),
      where('gameId', '==', gameId),
      where('uid', '==', user.uid),
      orderBy('timestamp', 'desc'),
      limit(500)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const uniqueTags = new Set<string>();
        snapshot.docs.forEach((doc) => {
          const noteTags = doc.data().tags || [];
          noteTags.forEach((t: string) => uniqueTags.add(t));
        });
        setTags(Array.from(uniqueTags));
      },
      (err) => {
        console.error("Failed to listen to game tags", err);
      }
    );

    return () => unsubscribe();
  }, [gameId, user, isAuthReady]);

  const addTagToCache = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev : [...prev, tag]));
  };

  return { tags, addTagToCache };
}

