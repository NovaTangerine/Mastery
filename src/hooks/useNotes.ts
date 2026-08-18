import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, updateDoc, doc, deleteDoc, getDoc, serverTimestamp, startAfter } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, logAppEvent } from '../firebase';
import { Note } from '../types';
import { toast } from 'sonner';
import { suggestTags } from '../services/geminiService';
import { safeGenerateKeyBetween } from '../lib/fractionalIndexing';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';
import { useUserJourney } from '../contexts/UserJourneyContext';

export function useNotes(gameId: string | null, sessionId?: string | null, tagFilter?: string | null) {
  const [pages, setPages] = useState<Record<number, Note[]>>({});
  const [lastDocs, setLastDocs] = useState<Record<number, any>>({});
  const [loadedPagesCount, setLoadedPagesCount] = useState(1);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [taggingStatus, setTaggingStatus] = useState<Record<string, 'loading' | 'error'>>({});

  const unsubscribesRef = useRef<Record<number, () => void>>({});
  const activeCursorsRef = useRef<Record<number, string>>({});
  
  const { refreshStats } = useUserJourney();

  // Reset pagination state when filters or game changes
  useEffect(() => {
    Object.values(unsubscribesRef.current).forEach(unsub => unsub());
    unsubscribesRef.current = {};
    activeCursorsRef.current = {};
    setPages({});
    setLastDocs({});
    setLoadedPagesCount(1);
  }, [gameId, sessionId, tagFilter]);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      Object.values(unsubscribesRef.current).forEach(unsub => unsub());
    };
  }, []);

  useEffect(() => {
    if (!gameId || !auth.currentUser) {
      setPages({});
      return;
    }

    const uid = auth.currentUser.uid;

    for (let i = 0; i < loadedPagesCount; i++) {
      if (unsubscribesRef.current[i]) {
        const previousPageLastDoc = i > 0 ? lastDocs[i - 1] : null;
        const previousPageLastDocId = previousPageLastDoc ? previousPageLastDoc.id : '';
        if (i > 0 && activeCursorsRef.current[i] !== previousPageLastDocId) {
          unsubscribesRef.current[i]();
          delete unsubscribesRef.current[i];
          activeCursorsRef.current[i] = previousPageLastDocId;
        } else {
          continue;
        }
      }

      if (i > 0 && !lastDocs[i - 1]) {
        break;
      }

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
        q = query(q, limit(200)); // Limit to 200 to be safe and avoid orderBy index
      } else {
        if (i === 0) {
          q = query(q, orderBy('timestamp', 'desc'), limit(50));
        } else {
          q = query(q, orderBy('timestamp', 'desc'), startAfter(lastDocs[i - 1]), limit(50));
        }
      }

      const pageIndex = i;
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const notesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Note[];
        
        setPages(prev => ({
          ...prev,
          [pageIndex]: notesData
        }));

        if (snapshot.docs.length > 0 && !tagFilter) {
          const lastDoc = snapshot.docs[snapshot.docs.length - 1];
          setLastDocs(prev => ({
            ...prev,
            [pageIndex]: lastDoc
          }));
        } else {
          setLastDocs(prev => {
            const next = { ...prev };
            delete next[pageIndex];
            return next;
          });
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'notes');
      });

      unsubscribesRef.current[pageIndex] = unsubscribe;
    }
  }, [gameId, sessionId, tagFilter, loadedPagesCount, lastDocs]);

  // Derived notes state across all pages, sorted appropriately
  const notes = Object.values(pages).flat().sort((a, b) => {
    if (typeof a.order === 'string' && typeof b.order === 'string') {
      return a.order.localeCompare(b.order);
    }
    return a.timestamp - b.timestamp;
  });

  const notesLimit = loadedPagesCount * 50;

  const loadMoreNotes = useCallback(() => {
    setLoadedPagesCount(prev => prev + 1);
  }, []);

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

      const docRef = await addDoc(collection(db, 'notes'), {
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

      // AI tagging disabled for now
      /*
      if (tags.length === 0) {
        setTaggingStatus(prev => ({ ...prev, [docRef.id]: 'loading' }));
        suggestTags(content).then(async (suggestion) => {
          try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              await updateDoc(docRef, {
                tags: suggestion.tags,
                isGlobal: suggestion.isGlobal, updatedAt: Date.now()
              });
              setTaggingStatus(prev => {
                const newStatus = { ...prev };
                delete newStatus[docRef.id];
                return newStatus;
              });
              logAppEvent('ai_tagging_success');
            }
          } catch (err) {
            console.error("Failed to update note with AI tags:", err);
            setTaggingStatus(prev => ({ ...prev, [docRef.id]: 'error' }));
            logAppEvent('ai_tagging_error', { reason: 'firestore_update_failed' });
          }
        }).catch(err => {
          console.error("AI tagging failed:", err);
          setTaggingStatus(prev => ({ ...prev, [docRef.id]: 'error' }));
          logAppEvent('ai_tagging_error', { reason: 'api_failed' });
          if (err instanceof Error && err.message.includes("Too many requests")) {
            toast.error("AI tagging rate limit reached. Please try again later.");
          }
        });
      }
      */
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
    try {
      await updateDoc(doc(db, 'notes', noteId), { content, updatedAt: Date.now() });
      toast.success('Note updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notes');
    }
  };

  const handleMoveNote = async (noteId: string, newSessionId: string | null) => {
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
