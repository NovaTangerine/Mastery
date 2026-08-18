import { useState, useEffect, useCallback, useMemo } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, updateDoc, doc, deleteDoc, getDoc, startAfter, getDocs } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, logAppEvent } from '../firebase';
import { Note } from '../types';
import { toast } from 'sonner';
import { suggestTags } from '../services/geminiService';
import { safeGenerateKeyBetween } from '../lib/fractionalIndexing';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';
import { useUserJourney } from '../contexts/UserJourneyContext';

export function useNotes(gameId: string | null, sessionId?: string | null, tagFilter?: string | null) {
  const [firstPageNotes, setFirstPageNotes] = useState<Note[]>([]);
  const [historicalNotes, setHistoricalNotes] = useState<Note[]>([]);
  const [firstPageLastDoc, setFirstPageLastDoc] = useState<any>(null);
  const [historicalLastDoc, setHistoricalLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [taggingStatus, setTaggingStatus] = useState<Record<string, 'loading' | 'error'>>({});

  const { refreshStats } = useUserJourney();

  // Reset pagination state when filters or game changes
  useEffect(() => {
    setFirstPageNotes([]);
    setHistoricalNotes([]);
    setFirstPageLastDoc(null);
    setHistoricalLastDoc(null);
    setHasMore(true);
    setIsLoadingMore(false);
  }, [gameId, sessionId, tagFilter]);

  // Handle first page real-time listener subscription
  useEffect(() => {
    if (!gameId || !auth.currentUser) {
      setFirstPageNotes([]);
      return;
    }

    const uid = auth.currentUser.uid;
    let q = query(
      collection(db, 'notes'),
      where('gameId', '==', gameId),
      where('uid', '==', uid)
    );

    if (sessionId !== undefined) {
      q = query(q, where('sessionId', '==', sessionId));
    }

    if (tagFilter) {
      q = query(q, where('tags', 'array-contains', tagFilter));
      q = query(q, limit(50));
    } else {
      q = query(q, orderBy('timestamp', 'desc'), limit(50));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];

      setFirstPageNotes(notesData);

      if (snapshot.docs.length > 0) {
        setFirstPageLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      } else {
        setFirstPageLastDoc(null);
      }

      // If we got fewer than 50 notes on the first load, there is no more data to load
      if (notesData.length < 50) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notes');
    });

    return () => {
      unsubscribe();
    };
  }, [gameId, sessionId, tagFilter]);

  // Derived notes state across all pages, sorted appropriately
  const notes = useMemo(() => {
    const idMap = new Set<string>();
    const merged: Note[] = [];

    const combined = [...firstPageNotes, ...historicalNotes];
    for (const note of combined) {
      if (!idMap.has(note.id)) {
        idMap.add(note.id);
        merged.push(note);
      }
    }

    return merged.sort((a, b) => {
      if (typeof a.order === 'string' && typeof b.order === 'string') {
        return a.order.localeCompare(b.order);
      }
      return a.timestamp - b.timestamp;
    });
  }, [firstPageNotes, historicalNotes]);

  const notesLimit = 50 + historicalNotes.length;

  const loadMoreNotes = useCallback(async () => {
    if (isLoadingMore || !hasMore || !gameId || !auth.currentUser) return;

    const cursor = historicalLastDoc || firstPageLastDoc;
    if (!cursor) {
      setHasMore(false);
      return;
    }

    setIsLoadingMore(true);
    try {
      const uid = auth.currentUser.uid;
      let q = query(
        collection(db, 'notes'),
        where('gameId', '==', gameId),
        where('uid', '==', uid)
      );

      if (sessionId !== undefined) {
        q = query(q, where('sessionId', '==', sessionId));
      }

      if (tagFilter) {
        q = query(q, where('tags', 'array-contains', tagFilter), startAfter(cursor), limit(50));
      } else {
        q = query(q, orderBy('timestamp', 'desc'), startAfter(cursor), limit(50));
      }

      const querySnapshot = await getDocs(q);
      const notesData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];

      if (notesData.length < 50) {
        setHasMore(false);
      }

      if (notesData.length > 0) {
        setHistoricalNotes(prev => [...prev, ...notesData]);
        setHistoricalLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      }
    } catch (error) {
      console.error("Error loading more notes:", error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [gameId, sessionId, tagFilter, historicalLastDoc, firstPageLastDoc, isLoadingMore, hasMore]);

  const handleAddNote = async (content: string, tags: string[] = []) => {
    if (!gameId || !auth.currentUser) return;
    setIsSubmittingNote(true);

    try {
      const sessionNotes = notes;
      const lastNote = sessionNotes[sessionNotes.length - 1];
      let newOrder = safeGenerateKeyBetween(null, null);
      if (lastNote && typeof lastNote.order === 'string') {
        newOrder = safeGenerateKeyBetween(lastNote.order, null);
      }

      await addDoc(collection(db, 'notes'), {
        gameId,
        sessionId: sessionId || null,
        uid: auth.currentUser.uid,
        content,
        tags,
        isGlobal: !sessionId,
        timestamp: Date.now(),
        order: newOrder
      });
      refreshStats();

      logAppEvent('note_created', { 
        source: sessionId ? 'session-view' : 'quick-note',
        hasTags: tags.length > 0
      });

      await updateDoc(doc(db, 'games', gameId), {
        updatedAt: Date.now()
      });

      setIsSubmittingNote(false);
    } catch (error) {
      setIsSubmittingNote(false);
      handleFirestoreError(error, OperationType.CREATE, 'notes');
    }
  };

  const handleRetryTagging = async (noteId: string, content: string) => {
    setTaggingStatus(prev => ({ ...prev, [noteId]: 'loading' }));
    
    try {
      const suggestion = await suggestTags(content);
      const docRef = doc(db, 'notes', noteId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          tags: suggestion.tags,
          isGlobal: suggestion.isGlobal, updatedAt: Date.now()
        });
        setTaggingStatus(prev => {
          const newStatus = { ...prev };
          delete newStatus[noteId];
          return newStatus;
        });
        logAppEvent('ai_tagging_success', { retry: true });
        toast.success("Tags generated successfully");
      }
    } catch (err) {
      console.error("AI tagging retry failed:", err);
      setTaggingStatus(prev => ({ ...prev, [noteId]: 'error' }));
      logAppEvent('ai_tagging_error', { reason: 'api_failed_retry' });
      if (err instanceof Error && err.message.includes("Too many requests")) {
        toast.error("AI tagging rate limit reached. Please try again later.");
      } else {
        toast.error("Failed to generate tags. Please try again.");
      }
    }
  };

  const handleUpdateNote = async (noteId: string, content: string) => {
    const updateLocal = (prev: Note[]) => prev.map(n => n.id === noteId ? { ...n, content, updatedAt: Date.now() } : n);
    setFirstPageNotes(updateLocal);
    setHistoricalNotes(updateLocal);

    try {
      await updateDoc(doc(db, 'notes', noteId), { content, updatedAt: Date.now() });
      toast.success('Note updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notes');
    }
  };

  const handleMoveNote = async (noteId: string, newSessionId: string | null) => {
    const updateLocal = (prev: Note[]) => prev.map(n => n.id === noteId ? { ...n, sessionId: newSessionId, isGlobal: newSessionId === null, updatedAt: Date.now() } : n);
    setFirstPageNotes(updateLocal);
    setHistoricalNotes(updateLocal);

    try {
      await updateDoc(doc(db, 'notes', noteId), { 
        sessionId: newSessionId,
        isGlobal: newSessionId === null, updatedAt: Date.now() 
      });
      toast.success('Note moved successfully');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notes');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const filterLocal = (prev: Note[]) => prev.filter(n => n.id !== noteId);
    setFirstPageNotes(filterLocal);
    setHistoricalNotes(filterLocal);

    try {
      await deleteDoc(doc(db, 'notes', noteId));
      refreshStats();
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

    const updateLocal = (prev: Note[]) => prev.map(n => n.id === noteId ? { ...n, tags: [...n.tags, tag], updatedAt: Date.now() } : n);
    setFirstPageNotes(updateLocal);
    setHistoricalNotes(updateLocal);

    try {
      await updateDoc(doc(db, 'notes', noteId), {
        tags: [...note.tags, tag], updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notes');
    }
  };

  const handleRemoveTag = async (noteId: string, tagToRemove: string) => {
    const note = notes.find(n => n.id === noteId);
    if (!note) return;

    const updateLocal = (prev: Note[]) => prev.map(n => n.id === noteId ? { ...n, tags: n.tags.filter(t => t !== tagToRemove), updatedAt: Date.now() } : n);
    setFirstPageNotes(updateLocal);
    setHistoricalNotes(updateLocal);

    try {
      await updateDoc(doc(db, 'notes', noteId), {
        tags: note.tags.filter(t => t !== tagToRemove), updatedAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notes');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = notes.findIndex(n => n.id === active.id);
    const newIndex = notes.findIndex(n => n.id === over.id);

    const newOrderArray = arrayMove(notes, oldIndex, newIndex);
    
    const prevNote = newIndex > 0 ? newOrderArray[newIndex - 1] : null;
    const nextNote = newIndex < newOrderArray.length - 1 ? newOrderArray[newIndex + 1] : null;

    let newOrderKey: string;
    const prevOrder = prevNote && typeof prevNote.order === 'string' ? prevNote.order : null;
    const nextOrder = nextNote && typeof nextNote.order === 'string' ? nextNote.order : null;
    newOrderKey = safeGenerateKeyBetween(prevOrder, nextOrder);

    const updateLocal = (prev: Note[]) => prev.map(n => n.id === active.id ? { ...n, order: newOrderKey, updatedAt: Date.now() } : n);
    setFirstPageNotes(updateLocal);
    setHistoricalNotes(updateLocal);

    try {
      await updateDoc(doc(db, 'notes', active.id as string), { order: newOrderKey, updatedAt: Date.now() });
      logAppEvent('note_reordered');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notes');
    }
  };

  return {
    notes,
    notesLimit,
    loadMoreNotes,
    isSubmittingNote,
    taggingStatus,
    handleAddNote,
    handleRetryTagging,
    handleUpdateNote,
    handleMoveNote,
    handleDeleteNote,
    handleAddTag,
    handleRemoveTag,
    handleDragEnd
  };
}
