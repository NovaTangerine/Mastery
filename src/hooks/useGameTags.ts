import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

// Global cache to prevent redundant fetches
const tagsCache: Record<string, string[]> = {};

export function useGameTags(gameId: string | null) {
  const [tags, setTags] = useState<string[]>(gameId && tagsCache[gameId] ? tagsCache[gameId] : []);
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

    if (tagsCache[gameId]) {
      setTags(tagsCache[gameId]);
      return;
    }

    const fetchTags = async () => {
      try {
        const q = query(
          collection(db, 'notes'),
          where('gameId', '==', gameId),
          where('uid', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(200) // Look at the last 200 notes
        );
        const snapshot = await getDocs(q);
        const uniqueTags = new Set<string>();
        snapshot.docs.forEach(doc => {
          const noteTags = doc.data().tags || [];
          noteTags.forEach((t: string) => uniqueTags.add(t));
        });
        
        const tagsArray = Array.from(uniqueTags);
        tagsCache[gameId] = tagsArray; // update cache
        setTags(tagsArray);
      } catch (err) {
        console.error("Failed to fetch game tags", err);
      }
    };

    fetchTags();
  }, [gameId, user, isAuthReady]);

  const addTagToCache = (tag: string) => {
    if (gameId) {
      const current = tagsCache[gameId] || [];
      if (!current.includes(tag)) {
        const updated = [...current, tag];
        tagsCache[gameId] = updated;
        setTags(updated);
      }
    }
  };

  return { tags, addTagToCache };
}

