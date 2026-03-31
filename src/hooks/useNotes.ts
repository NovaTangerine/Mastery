import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot, addDoc, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType, logAppEvent } from '../firebase';
import { Note } from '../types';
import { toast } from 'sonner';
import { suggestTags } from '../services/geminiService';
import { safeGenerateKeyBetween } from '../lib/fractionalIndexing';
import { arrayMove } from '@dnd-kit/sortable';
import { DragEndEvent } from '@dnd-kit/core';

export function useNotes(gameId: string | null, sessionId?: string | null) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [notesLimit, setNotesLimit] = useState(50);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [taggingStatus, setTaggingStatus] = useState<Record<string, 'loading' | 'error'>>({});

  useEffect(() => {
    if (!gameId || !auth.currentUser) {
      setNotes([]);
      return;
    }

    let q = query(
      collection(db, 'notes'),
      where('gameId', '==', gameId),
      where('uid', '==', auth.currentUser.uid)
    );

    if (sessionId !== undefined) {
      q = query(q, where('sessionId', '==', sessionId));
    }

    q = query(q, orderBy('timestamp', 'desc'), limit(notesLimit));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      
      // Sort by fractional index order if present, otherwise fallback to timestamp (ascending)
      notesData.sort((a, b) => {
        if (typeof a.order === 'string' && typeof b.order === 'string') {
          return a.order.localeCompare(b.order);
        }
        return a.timestamp - b.timestamp;
      });
      
      setNotes(notesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'notes');
    });

    return () => unsubscribe();
  }, [gameId, sessionId, notesLimit]);

  const loadMoreNotes = useCallback(() => {
    setNotesLimit(prev => prev + 50);
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

      logAppEvent('note_created', { 
        source: sessionId ? 'session-view' : 'quick-note',
        hasTags: tags.length > 0
      });

      await updateDoc(doc(db, 'games', gameId), {
        updatedAt: Date.now()
      });

      setIsSubmittingNote(false);

      if (tags.length === 0) {
        setTaggingStatus(prev => ({ ...prev, [docRef.id]: 'loading' }));
        suggestTags(content).then(async (suggestion) => {
          try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              await updateDoc(docRef, {
                tags: suggestion.tags,
                isGlobal: suggestion.isGlobal
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
          isGlobal: suggestion.isGlobal
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
      await updateDoc(doc(db, 'notes', noteId), { content });
      toast.success('Note updated');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notes');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteDoc(doc(db, 'notes', noteId));
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
        tags: [...note.tags, tag]
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
        tags: note.tags.filter(t => t !== tagToRemove)
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
      await updateDoc(doc(db, 'notes', active.id as string), { order: newOrderKey });
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
    handleDeleteNote,
    handleAddTag,
    handleRemoveTag,
    handleDragEnd
  };
}
