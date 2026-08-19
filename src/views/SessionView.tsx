import React, { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { Plus, Minus, BookOpen, Clock, PenLine, X, Send, ChevronRight, Trash2, List, LayoutDashboard, ChevronUp, ChevronDown, Tag as TagIcon, MoreVertical, ArrowUpDown, Play, Target, Check } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';

import { SessionMetric } from '../types';

import { useActiveSession, useGameLibrary } from '../contexts/GameContext';
import { useUI } from '../contexts/UIContext';
import { useUserJourney } from '../contexts/UserJourneyContext';
import { useNotes } from '../hooks/useNotes';
import { useGameTags } from '../hooks/useGameTags';
import { EditMetricModal } from '../components/EditMetricModal';
import { ViewTrackerItemModal } from '../components/ViewTrackerItemModal';
import { ViewMetricModal } from '../components/ViewMetricModal';
import { SessionSidebar, decimalToHoursStr, hoursStrToDecimalStr } from '../components/Session/SessionSidebar';
import { NotesFeed } from '../components/Session/NotesFeed';
import { TrackersPanel } from '../components/Session/TrackersPanel';
import { cn } from '../lib/utils';

export default function SessionView() {
  const { navigateTo } = useUI();
  const { hasLoggedAnySession, hasCreatedAnyNote, isEligibleForGameOnboarding, isEligibleForTrackerOnboarding } = useUserJourney();
  const { handleDeleteGame } = useGameLibrary();
  const { 
    selectedGame, 
    activeSession,
    sessions,
    sessionGroups,
    handleUpdateSessionDetails, 
    handleUpdateSessionTags,
    handleDeleteSessionAndShiftFocus,
    checkSessionHasNotes,
    getSessionNotesCount,
    handleCreateSessionGroup,
    handleUpdateSessionGroup,
    handleDeleteSessionGroup,
    handleUpdateSessionGroupMembership,
    handleDeleteSession,
    handleResumeSession,
    handleStartSession,
    handleUpdateMetric,
    handleDeleteMetric,
    handleAddMetric,
    handleMigrateLegacyTrackers,
    handleAddTrackerItem,
    handleUpdateTrackerItem,
    handleRemoveTrackerItem,
    handleAddTracker,
    handleUpdateTracker,
    handleDeleteTracker
  } = useActiveSession();

  const [filteredTag, setFilteredTag] = useState<string | null>(null);
  const [filterScope, setFilterScope] = useState<'session' | 'global'>('session');

  const {
    notes,
    notesLimit,
    loadMoreNotes,
    handleAddNote,
    handleUpdateNote,
    handleDeleteNote,
    handleAddTag,
    handleRemoveTag,
    handleRenameTag: hookRenameTag,
    handleDeleteTagGlobally: hookDeleteTagGlobally,
    handleDragEnd,
    isSubmittingNote,
    taggingStatus,
    handleRetryTagging,
    handleMoveNote
  } = useNotes(
    selectedGame?.id || null, 
    (filteredTag && filterScope === 'global') ? undefined : (activeSession?.id || null), 
    filteredTag
  );

  const { notes: allSessionNotes } = useNotes(selectedGame?.id || null, activeSession?.id || null, null);
  const { notes: globalNotesForTag } = useNotes(selectedGame?.id || null, undefined, filteredTag);
  const { tags: gameTags } = useGameTags(selectedGame?.id || null);

  const tagCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    for (const note of allSessionNotes) {
      if (note.tags) {
        for (const tag of note.tags) {
          counts[tag] = (counts[tag] || 0) + 1;
        }
      }
    }
    return counts;
  }, [allSessionNotes]);

  const globalSessionTags = React.useMemo(() => {
    const tags = new Set<string>();
    sessions.forEach(s => {
      s.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [sessions]);

  const activeSessionTags = activeSession?.tags || [];
  
  const structuredTags = React.useMemo(() => {
    const combined = new Set([
      ...gameTags, 
      ...globalSessionTags, 
      ...activeSessionTags,
      ...Object.keys(tagCounts)
    ]);
    const allTags = Array.from(combined);
    
    const sessionTags: string[] = [];
    const gameTagsList: string[] = [];

    allTags.forEach(tag => {
      // It's a session tag if it's explicitly in activeSessionTags or used in a note in this session (tagCounts[tag] > 0)
      if (activeSessionTags.includes(tag) || (tagCounts[tag] && tagCounts[tag] > 0)) {
        sessionTags.push(tag);
      } else {
        gameTagsList.push(tag);
      }
    });

    // Sort session tags by count descending, then alphabetical
    sessionTags.sort((a, b) => {
      const countA = tagCounts[a] || 0;
      const countB = tagCounts[b] || 0;
      if (countB !== countA) return countB - countA;
      return a.localeCompare(b);
    });

    // Sort game tags purely alphabetically
    gameTagsList.sort((a, b) => a.localeCompare(b));

    // Group game tags by letter
    const groups: Record<string, string[]> = {};
    gameTagsList.forEach(tag => {
      const letter = tag.charAt(0).toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(tag);
    });
    
    const gameTagsByLetter = Object.keys(groups).sort().map(letter => ({
      letter,
      tags: groups[letter]
    }));

    return { 
      sessionTagsList: sessionTags, 
      gameTagsByLetter,
      gameTagsList,
      totalTagsCount: allTags.length,
      allTagsFlat: sessionTags.concat(gameTagsList) // fallback flat array if needed
    };
  }, [gameTags, globalSessionTags, activeSessionTags, tagCounts]);

  const existingTrackerTitles = React.useMemo(() => {
    const titles = new Set<string>();
    sessions.forEach(s => {
      s.trackers?.forEach(t => titles.add(t.title));
    });
    return Array.from(titles);
  }, [sessions]);

  const trackerItemSuggestions = React.useMemo(() => {
    const itemsMap: Record<string, Set<string>> = {};
    sessions.forEach(s => {
      s.trackers?.forEach(t => {
        if (!itemsMap[t.title]) itemsMap[t.title] = new Set();
        t.items.forEach(item => {
          if (typeof item === 'string') {
            itemsMap[t.title].add(item);
          } else {
            itemsMap[t.title].add(item.title);
          }
        });
      });
    });
    
    const result: Record<string, string[]> = {};
    Object.keys(itemsMap).forEach(k => {
      result[k] = Array.from(itemsMap[k]);
    });
    return result;
  }, [sessions]);

  const anySessionHasTrackers = React.useMemo(() => {
    return sessions.some(s => (s.metrics && s.metrics.length > 0) || (s.trackers && s.trackers.length > 0));
  }, [sessions]);

  const [noteInput, setNoteInput] = useState('');
  const [isEditingSessionDetails, setIsEditingSessionDetails] = useState(false);
  const [sessionNameInput, setSessionNameInput] = useState('');
  const [sessionChapterInput, setSessionChapterInput] = useState('');
  const [sessionHoursInput, setSessionHoursInput] = useState('');
  const prevHoursPlayed = React.useMemo(() => {
    if (!activeSession) return 0;
    const currentIndex = sessions.findIndex(s => s.id === activeSession.id);
    if (currentIndex >= 0 && currentIndex < sessions.length - 1) {
      for (let i = currentIndex + 1; i < sessions.length; i++) {
        if (sessions[i].hoursPlayed !== undefined && sessions[i].hoursPlayed !== null) {
          return sessions[i].hoursPlayed as number;
        }
      }
    }
    return 0;
  }, [sessions, activeSession]);

  const [totalHoursInput, setTotalHoursInput] = useState('');

  const [sessionGroupIdInput, setSessionGroupIdInput] = useState<string | undefined>(undefined);
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupNameInput, setNewGroupNameInput] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupTitle, setEditingGroupTitle] = useState('');
  
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null);
  const [isEditingNewMetric, setIsEditingNewMetric] = useState(false);
  const [selectedSessionIdsForGroup, setSelectedSessionIdsForGroup] = useState<Set<string>>(new Set());
  
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const [showTagsExpandButton, setShowTagsExpandButton] = useState(false);
  const tagsContainerRef = useRef<HTMLDivElement>(null);
  const [isCreatingGroupFromList, setIsCreatingGroupFromList] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [activeMobileTab, setActiveMobileTab] = useState<'sessions' | 'notes' | 'trackers'>('notes');
  const [sessionSortOrder, setSessionSortOrder] = useState<'asc' | 'desc'>('desc');
  const [groupToDelete, setGroupToDelete] = useState<{id: string, title: string} | null>(null);
  const [metricToDelete, setMetricToDelete] = useState<{ id: string, title: string, type: 'metric' | 'legacy' } | null>(null);

  const [isInputFocused, setIsInputFocused] = useState(false);
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [sessionTagInput, setSessionTagInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [isEditingTitleInline, setIsEditingTitleInline] = useState(false);
  const [inlineTitleInput, setInlineTitleInput] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string, name: string, notesCount: number } | null>(null);
  const [editingSidebarSessionId, setEditingSidebarSessionId] = useState<string | null>(null);
  const [editingSidebarSessionName, setEditingSidebarSessionName] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeMenuType, setActiveMenuType] = useState<'group' | 'session' | null>(null);
  const [activeTappedId, setActiveTappedId] = useState<string | null>(null);
  const [viewingTrackerItem, setViewingTrackerItem] = useState<{ trackerId: string, trackerTitle: string, item: any } | null>(null);
  const [viewingMetricId, setViewingMetricId] = useState<string | null>(null);
  const noteInputContainerRef = useRef<HTMLDivElement>(null);
  const [collapsedTrackerGroups, setCollapsedTrackerGroups] = useState<Set<string>>(new Set());

  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingSessionAction, setPendingSessionAction] = useState<(() => void) | null>(null);

  const attemptSessionChange = (action: () => void) => {
    if (!isEditingSessionDetails) {
      action();
      return;
    }
    
    const prevHoursDeltaStr = activeSession?.hoursPlayed !== undefined && activeSession?.hoursPlayed !== null
            ? decimalToHoursStr(Math.max(0, (activeSession.hoursPlayed as number) - prevHoursPlayed))
            : '';

    const isNameChanged = sessionNameInput !== (activeSession?.name || '');
    const isChapterChanged = sessionChapterInput !== (activeSession?.chapter || '');
    const isGroupIdChanged = (sessionGroupIdInput || '') !== (activeSession?.groupId || '') || isCreatingNewGroup;
    const isHoursChanged = sessionHoursInput !== prevHoursDeltaStr;

    const hasUnsavedChanges = isNameChanged || isChapterChanged || isGroupIdChanged || isHoursChanged;

    if (hasUnsavedChanges) {
      setPendingSessionAction(() => action);
      setShowUnsavedChangesModal(true);
    } else {
      setIsEditingSessionDetails(false);
      setIsCreatingNewGroup(false);
      setNewGroupNameInput('');
      action();
    }
  };

  const wrappedHandleResumeSession = (session: any) => attemptSessionChange(() => { handleResumeSession(session); scrollToTab('notes'); });
  const wrappedHandleStartSession = (groupId?: string) => attemptSessionChange(() => handleStartSession(groupId));

  const toggleTrackerGroup = (groupName: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCollapsedTrackerGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupName)) {
        next.delete(groupName);
      } else {
        next.add(groupName);
      }
      return next;
    });
  };

  const handleRenameTag = async (oldTag: string, newTag: string) => {
    const trimmedNew = newTag.trim().toLowerCase().replace(/^#/, '');
    const trimmedOld = oldTag.trim().toLowerCase().replace(/^#/, '');
    if (!trimmedNew || trimmedNew === trimmedOld) return;

    if (activeSession && activeSessionTags.includes(trimmedOld)) {
      const updated = Array.from(new Set(activeSessionTags.map(t => t === trimmedOld ? trimmedNew : t)));
      handleUpdateSessionTags(activeSession.id, updated);
    }

    if (filteredTag === trimmedOld) {
      setFilteredTag(trimmedNew);
    }

    await hookRenameTag(trimmedOld, trimmedNew);
  };

  const handleDeleteSessionTag = async (tagToDelete: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const trimmed = tagToDelete.trim().toLowerCase().replace(/^#/, '');
    
    if (activeSession) {
      handleUpdateSessionTags(activeSession.id, activeSessionTags.filter(t => t !== trimmed));
    }
    
    // Clear filter if active
    if (filteredTag === trimmed) {
      setFilteredTag(null);
    }
    
    await hookDeleteTagGlobally(trimmed);
  };

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) return;
    if (touchStartX.current === null || touchStartY.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    
    // Only trigger if movement is predominantly horizontal and >= 50px
    if (Math.abs(deltaX) >= 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      if (deltaX < 0) {
        // Swiped left -> navigate forward (sessions -> notes -> trackers)
        if (activeMobileTab === 'sessions') setActiveMobileTab('notes');
        else if (activeMobileTab === 'notes') setActiveMobileTab('trackers');
      } else {
        // Swiped right -> navigate backward (trackers -> notes -> sessions)
        if (activeMobileTab === 'trackers') setActiveMobileTab('notes');
        else if (activeMobileTab === 'notes') setActiveMobileTab('sessions');
      }
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  const scrollToTab = (tab: 'sessions' | 'notes' | 'trackers') => {
    setActiveMobileTab(tab);
  };

  useEffect(() => {
    const handleOpenSessionDetails = () => {
      if (activeSession) {
        setSessionNameInput(activeSession.name || '');
        setSessionChapterInput(activeSession.chapter || '');
        if (activeSession.hoursPlayed !== undefined && activeSession.hoursPlayed !== null) {
          const total = activeSession.hoursPlayed;
          const delta = Math.max(0, total - prevHoursPlayed);
          setSessionHoursInput(decimalToHoursStr(delta));
          setTotalHoursInput(decimalToHoursStr(total));
        } else {
          setSessionHoursInput('');
          setTotalHoursInput('');
        }
        setSessionGroupIdInput(activeSession.groupId);
        setIsEditingSessionDetails(true);
        // Switch to the notes tab so the details form is visible on mobile
        scrollToTab('notes');
      }
    };

    window.addEventListener('open-session-details', handleOpenSessionDetails);
    return () => window.removeEventListener('open-session-details', handleOpenSessionDetails);
  }, [activeSession]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (activeMenuId) {
        setActiveMenuId(null);
        setActiveMenuType(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeMenuId]);

  useEffect(() => {
    const checkHeight = () => {
      if (tagsContainerRef.current) {
        const { scrollHeight } = tagsContainerRef.current;
        if (scrollHeight > 140) {
          setShowTagsExpandButton(true);
        } else {
          setShowTagsExpandButton(false);
          setIsTagsExpanded(false); // Reset if elements are removed preventing it from getting stuck open
        }
      }
    };
    
    checkHeight();
    
    // Also use ResizeObserver in case window resizes or container resizes
    let observer: ResizeObserver;
    if (tagsContainerRef.current) {
      observer = new ResizeObserver(() => checkHeight());
      observer.observe(tagsContainerRef.current);
    }
    
    return () => {
      if (observer) observer.disconnect();
    };
  }, [structuredTags.totalTagsCount, activeSessionTags.length]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (isInputFocused && noteInputContainerRef.current && !noteInputContainerRef.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('.tag-autocomplete-dropdown')) {
          setIsInputFocused(false);
        }
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isInputFocused]);

  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const sortedSessions = React.useMemo(() => {
    return [...sessions].sort((a, b) => {
      const timeA = a.startTime || 0;
      const timeB = b.startTime || 0;
      return sessionSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [sessions, sessionSortOrder]);

  const parentRef = useRef<HTMLDivElement>(null);
  const notesEndRef = useRef<HTMLDivElement>(null);


  const sessionNotes = notes.filter(n => n.sessionId === activeSession?.id);

  const getSessionName = (sessionId: string | null) => {
    if (!sessionId) return 'Global Notes';
    const found = sessions.find(s => s.id === sessionId);
    return found ? (found.name || found.progressMarker) : 'Unknown Session';
  };

  const availableSessions = React.useMemo(() => [
    { id: 'global', name: 'Global Notes' },
    ...sessions.map(s => ({
      id: s.id,
      name: s.name || s.progressMarker || 'Unknown Session'
    }))
  ], [sessions]);

  const filteredNotesBySession = React.useMemo(() => {
    if (!filteredTag) return {};
    const grouped: Record<string, typeof notes> = {};
    for (const note of globalNotesForTag) {
      const sid = note.sessionId || 'global';
      if (!grouped[sid]) grouped[sid] = [];
      grouped[sid].push(note);
    }
    return grouped;
  }, [globalNotesForTag, filteredTag]);

  useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = parentRef.current.scrollHeight;
    }
  }, [sessionNotes.length]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const groupedSessions = React.useMemo(() => {
    const groups = sessionGroups.map(group => ({
      ...group,
      sessions: sortedSessions.filter(s => s.groupId === group.id)
    }));

    return groups.sort((a, b) => {
      const getCompareTime = (groupSessions: typeof sessions) => {
        if (groupSessions.length === 0) return sessionSortOrder === 'desc' ? 0 : Infinity;
        // For desc (newest first), we want the newest session in the group to represent it
        // For asc (oldest first), we want the oldest session in the group to represent it
        const times = groupSessions.map(s => s.startTime || 0);
        return sessionSortOrder === 'desc' ? Math.max(...times) : Math.min(...times);
      };

      const timeA = getCompareTime(a.sessions);
      const timeB = getCompareTime(b.sessions);

      return sessionSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });
  }, [sessionGroups, sortedSessions, sessionSortOrder]);

  const ungroupedSessions = sortedSessions.filter(s => !s.groupId);

  if (!selectedGame || !activeSession) return null;

  const submitNote = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!noteInput.trim() || isSubmittingNote) return;
    
    const content = noteInput;
    const tagsToSubmit = [...noteTags];
    if (tagInput.trim() && !tagsToSubmit.includes(tagInput.trim())) {
      tagsToSubmit.push(tagInput.trim());
    }
    
    setNoteInput('');
    setNoteTags([]);
    setTagInput('');
    await handleAddNote(content, tagsToSubmit);
  };

  const saveSessionDetails = async () => {
    let finalGroupId = sessionGroupIdInput;
    
    if (isCreatingNewGroup && newGroupNameInput.trim()) {
      const newGroup = await handleCreateSessionGroup(newGroupNameInput.trim());
      if (newGroup) {
        finalGroupId = newGroup.id;
      }
    }

    await handleUpdateSessionDetails(sessionNameInput, sessionChapterInput, hoursStrToDecimalStr(totalHoursInput), finalGroupId === undefined ? '' : finalGroupId);
    setIsEditingSessionDetails(false);
    setIsCreatingNewGroup(false);
    setNewGroupNameInput('');
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex-1 min-h-0 pb-[58px] sm:pb-[58px] lg:pb-0 grid grid-cols-1 grid-rows-1 lg:flex lg:flex-row justify-start lg:justify-center animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-x-hidden"
    >
      {groupToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-2 text-white">Delete "{groupToDelete.title}"?</h3>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              Are you sure you want to delete this group? All sessions will be ungrouped. No data will be lost.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setGroupToDelete(null)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  handleDeleteSessionGroup(groupToDelete.id);
                  setGroupToDelete(null);
                }}
                className="flex-1 bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold py-3 rounded-xl transition-colors"
              >
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}

      {sessionToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Delete Session?</h3>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">"{sessionToDelete.name}"</span>?
              {sessionToDelete.notesCount > 0 && (
                <>
                  <br/><br/>
                  <span className="text-red-400 font-bold">Warning:</span> This session contains <span className="text-red-400 font-bold">{sessionToDelete.notesCount} {sessionToDelete.notesCount === 1 ? 'note' : 'notes'}</span> which will be permanently deleted. This cannot be undone.
                </>
              )}
              {sessionToDelete.notesCount === 0 && (
                <>
                  <br/><br/>
                  This action cannot be undone.
                </>
              )}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setSessionToDelete(null)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (sessionToDelete) {
                    const id = sessionToDelete.id;
                    setSessionToDelete(null);
                    await handleDeleteSessionAndShiftFocus(id);
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-600/20"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {metricToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl"
          >
            <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold mb-2 text-white">Delete Tracker?</h3>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-white">"{metricToDelete.title}"</span>? This tracker and its data will be permanently removed. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setMetricToDelete(null)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  if (metricToDelete) {
                    const id = metricToDelete.id;
                    const type = metricToDelete.type;
                    setMetricToDelete(null);
                    if (type === 'metric') {
                      await handleDeleteMetric(id);
                    } else {
                      await handleDeleteTracker(id);
                    }
                  }
                }}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-600/20"
              >
                Delete
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <SessionSidebar
        activeMobileTab={activeMobileTab}
        scrollToTab={scrollToTab}
        sessionSortOrder={sessionSortOrder}
        setSessionSortOrder={setSessionSortOrder}
        isCreatingGroupFromList={isCreatingGroupFromList}
        setIsCreatingGroupFromList={setIsCreatingGroupFromList}
        newGroupNameInput={newGroupNameInput}
        setNewGroupNameInput={setNewGroupNameInput}
        handleCreateSessionGroup={handleCreateSessionGroup}
        isEligibleForGameOnboarding={isEligibleForGameOnboarding}
        selectedGame={selectedGame}
        sessions={sessions}
        activeSession={activeSession}
        groupedSessions={groupedSessions}
        collapsedGroups={collapsedGroups}
        toggleGroupCollapse={toggleGroupCollapse}
        activeTappedId={activeTappedId}
        setActiveTappedId={setActiveTappedId}
        activeMenuId={activeMenuId}
        setActiveMenuId={setActiveMenuId}
        activeMenuType={activeMenuType}
        setActiveMenuType={setActiveMenuType}
        handleUpdateSessionGroupMembership={handleUpdateSessionGroupMembership}
        handleDeleteSessionGroup={handleDeleteSessionGroup}
        setGroupToDelete={setGroupToDelete}
        editingGroupId={editingGroupId}
        setEditingGroupId={setEditingGroupId}
        editingGroupTitle={editingGroupTitle}
        setEditingGroupTitle={setEditingGroupTitle}
        handleUpdateSessionGroup={handleUpdateSessionGroup}
        selectedSessionIdsForGroup={selectedSessionIdsForGroup}
        setSelectedSessionIdsForGroup={setSelectedSessionIdsForGroup}
        ungroupedSessions={ungroupedSessions}
        wrappedHandleResumeSession={wrappedHandleResumeSession}
        wrappedHandleStartSession={wrappedHandleStartSession}
        getSessionNotesCount={getSessionNotesCount}
        editingSidebarSessionId={editingSidebarSessionId}
        setEditingSidebarSessionId={setEditingSidebarSessionId}
        editingSidebarSessionName={editingSidebarSessionName}
        setEditingSidebarSessionName={setEditingSidebarSessionName}
        handleUpdateSessionDetails={handleUpdateSessionDetails}
        setSessionToDelete={setSessionToDelete}
        sessionGroups={sessionGroups}
      />

      <NotesFeed
        selectedGame={selectedGame!}
        activeSession={activeSession}
        filteredTag={filteredTag}
        setFilteredTag={setFilteredTag}
        filterScope={filterScope}
        setFilterScope={setFilterScope}
        filteredNotesBySession={filteredNotesBySession}
        activeMobileTab={activeMobileTab}
        getSessionName={getSessionName}
        handleUpdateNote={handleUpdateNote}
        handleDeleteNote={handleDeleteNote}
        handleAddTag={handleAddTag}
        handleRemoveTag={handleRemoveTag}
        handleRenameTag={handleRenameTag}
        handleDeleteTagGlobally={hookDeleteTagGlobally}
        taggingStatus={taggingStatus}
        handleRetryTagging={handleRetryTagging}
        availableSessions={availableSessions}
        handleMoveNote={handleMoveNote}
        globalNotesForTag={globalNotesForTag}
        isEditingSessionDetails={isEditingSessionDetails}
        setIsEditingSessionDetails={setIsEditingSessionDetails}
        isEditingTitleInline={isEditingTitleInline}
        setIsEditingTitleInline={setIsEditingTitleInline}
        inlineTitleInput={inlineTitleInput}
        setInlineTitleInput={setInlineTitleInput}
        handleUpdateSessionDetails={handleUpdateSessionDetails}
        prevHoursPlayed={prevHoursPlayed}
        decimalToHoursStr={decimalToHoursStr}
        hoursStrToDecimalStr={hoursStrToDecimalStr}
        sessionNameInput={sessionNameInput}
        setSessionNameInput={setSessionNameInput}
        sessionChapterInput={sessionChapterInput}
        setSessionChapterInput={setSessionChapterInput}
        sessionHoursInput={sessionHoursInput}
        setSessionHoursInput={setSessionHoursInput}
        totalHoursInput={totalHoursInput}
        setTotalHoursInput={setTotalHoursInput}
        sessionGroupIdInput={sessionGroupIdInput}
        setSessionGroupIdInput={setSessionGroupIdInput}
        isCreatingNewGroup={isCreatingNewGroup}
        setIsCreatingNewGroup={setIsCreatingNewGroup}
        newGroupNameInput={newGroupNameInput}
        setNewGroupNameInput={setNewGroupNameInput}
        sessionGroups={sessionGroups}
        saveSessionDetails={saveSessionDetails}
        parentRef={parentRef}
        sessionNotes={sessionNotes}
        notesLimit={notesLimit}
        loadMoreNotes={loadMoreNotes}
        hasCreatedAnyNote={hasCreatedAnyNote}
        sensors={sensors}
        handleDragEnd={handleDragEnd}
        notesEndRef={notesEndRef}
        noteInputContainerRef={noteInputContainerRef}
        isInputFocused={isInputFocused}
        setIsInputFocused={setIsInputFocused}
        noteInput={noteInput}
        setNoteInput={setNoteInput}
        submitNote={submitNote}
        noteTags={noteTags}
        setNoteTags={setNoteTags}
        tagInput={tagInput}
        setTagInput={setTagInput}
        globalSessionTags={globalSessionTags}
        isSubmittingNote={isSubmittingNote}
      />

      <TrackersPanel
        activeMobileTab={activeMobileTab}
        activeSession={activeSession}
        selectedGame={selectedGame!}
        collapsedTrackerGroups={collapsedTrackerGroups}
        toggleTrackerGroup={toggleTrackerGroup}
        handleAddMetric={handleAddMetric}
        setEditingMetricId={setEditingMetricId}
        setIsEditingNewMetric={setIsEditingNewMetric}
        isEligibleForTrackerOnboarding={isEligibleForTrackerOnboarding}
        handleUpdateMetric={handleUpdateMetric}
        setMetricToDelete={setMetricToDelete}
        setViewingMetricId={setViewingMetricId}
        handleMigrateLegacyTrackers={handleMigrateLegacyTrackers}
        handleAddTrackerItem={handleAddTrackerItem}
        handleUpdateTrackerItem={handleUpdateTrackerItem}
        handleRemoveTrackerItem={handleRemoveTrackerItem}
        handleUpdateTracker={handleUpdateTracker}
        setViewingTrackerItem={setViewingTrackerItem}
        trackerItemSuggestions={trackerItemSuggestions}
        handleAddTracker={handleAddTracker}
        existingTrackerTitles={existingTrackerTitles}
        sessionTagInput={sessionTagInput}
        setSessionTagInput={setSessionTagInput}
        activeSessionTags={activeSessionTags}
        handleUpdateSessionTags={handleUpdateSessionTags}
        structuredTags={structuredTags}
        globalSessionTags={globalSessionTags}
        tagsContainerRef={tagsContainerRef}
        isTagsExpanded={isTagsExpanded}
        setIsTagsExpanded={setIsTagsExpanded}
        tagCounts={tagCounts}
        setFilteredTag={setFilteredTag}
        scrollToTab={scrollToTab}
        handleDeleteSessionTag={handleDeleteSessionTag}
        handleRenameTag={handleRenameTag}
        showTagsExpandButton={showTagsExpandButton}
      />

      {/* Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800/80 p-1 rounded-full flex items-center gap-1 shadow-2xl">
          {(['sessions', 'notes', 'trackers'] as const).map((tab) => {
            const isActive = activeMobileTab === tab;
            return (
              <button
                key={tab}
                onClick={() => scrollToTab(tab)}
                className={`relative px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-colors ${isActive ? 'text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeMobileTab"
                    className="absolute inset-0 bg-zinc-800 rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {tab === 'sessions' && <List className="w-3.5 h-3.5" />}
                  {tab === 'notes' && <PenLine className="w-3.5 h-3.5" />}
                  {tab === 'trackers' && <LayoutDashboard className="w-3.5 h-3.5" />}
                  <span className="text-[11px] font-bold capitalize leading-none pt-[1px]">{tab}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile FAB */}
      <button 
        onClick={() => attemptSessionChange(() => navigateTo('note-editor'))}
        className="lg:hidden fixed right-6 bottom-[66px] w-14 h-14 bg-zinc-100 text-zinc-950 rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform"
      >
        <Plus className="w-8 h-8" />
      </button>

      {editingMetricId && activeSession.metrics?.find(m => m.id === editingMetricId) && (
        <EditMetricModal
          metric={activeSession.metrics.find(m => m.id === editingMetricId)!}
          existingGroups={Array.from(new Set((activeSession.metrics || []).map(m => m.group).filter(Boolean) as string[]))}
          onUpdate={handleUpdateMetric}
          onClose={async (saved?: boolean) => {
            const metric = activeSession.metrics?.find(m => m.id === editingMetricId);
            if (!saved && metric && metric.title === '' && isEditingNewMetric) {
              await handleDeleteMetric(metric.id);
            }
            setEditingMetricId(null);
            setIsEditingNewMetric(false);
          }}
        />
      )}

      {viewingTrackerItem && (
        <ViewTrackerItemModal
          item={viewingTrackerItem.item}
          trackerId={viewingTrackerItem.trackerId}
          trackerTitle={viewingTrackerItem.trackerTitle}
          onUpdateItem={handleUpdateTrackerItem}
          onClose={() => setViewingTrackerItem(null)}
        />
      )}

      {viewingMetricId && activeSession.metrics?.find(m => m.id === viewingMetricId) && (
        <ViewMetricModal
          metric={activeSession.metrics.find(m => m.id === viewingMetricId)!}
          onClose={() => setViewingMetricId(null)}
          onEdit={(id) => {
            setViewingMetricId(null);
            setEditingMetricId(id);
          }}
          onUpdate={handleUpdateMetric}
        />
      )}

      {showUnsavedChangesModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold text-zinc-100 mb-2">Unsaved Changes</h3>
              <p className="text-sm text-zinc-400">
                You have unsaved changes to this session's details. If you leave now, those changes will be lost.
              </p>
            </div>
            <div className="p-4 bg-zinc-950/50 border-t border-zinc-800/50 flex items-center justify-end gap-3">
              <button 
                onClick={() => {
                  setShowUnsavedChangesModal(false);
                  setPendingSessionAction(null);
                }}
                className="px-4 py-2 text-sm font-bold text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                Stay
              </button>
              <button 
                onClick={() => {
                  setShowUnsavedChangesModal(false);
                  setIsEditingSessionDetails(false);
                  setIsCreatingNewGroup(false);
                  setNewGroupNameInput('');
                  if (pendingSessionAction) {
                    pendingSessionAction();
                  }
                  setPendingSessionAction(null);
                }}
                className="px-4 py-2 text-sm font-bold bg-zinc-100 text-zinc-950 hover:bg-white rounded-xl transition-colors"
              >
                Leave without saving
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
