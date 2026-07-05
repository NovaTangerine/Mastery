import React, { useRef, useEffect, useState } from 'react';
import { Plus, Minus, BookOpen, Clock, PenLine, X, Send, ChevronRight, Trash2, List, LayoutDashboard, ChevronUp, ChevronDown, Tag as TagIcon, MoreVertical, ArrowUpDown, Play, Target } from 'lucide-react';
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

import { useGameContext } from '../contexts/GameContext';
import { useUI } from '../contexts/UIContext';
import { useNotes } from '../hooks/useNotes';
import { SortableNote } from '../components/SortableNote';
import { TrackerCard } from '../components/TrackerCard';
import { AddTrackerMenu } from '../components/AddTrackerMenu';
import { MetricCard } from '../components/MetricCard';
import { AddMetricForm } from '../components/AddMetricForm';
import { EditMetricModal } from '../components/EditMetricModal';
import { ViewTrackerItemModal } from '../components/ViewTrackerItemModal';
import { ViewMetricModal } from '../components/ViewMetricModal';
import { TagAutocompleteInput } from '../components/TagAutocompleteInput';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '../lib/utils';

function SessionTagItem({ tag, count, setFilteredTag, scrollToTab, handleDeleteSessionTag }: { 
  tag: string; 
  count: number; 
  setFilteredTag: (tag: string) => void; 
  scrollToTab: (tab: string) => void;
  handleDeleteSessionTag: (tag: string, e: React.MouseEvent) => void;
}) {
  const [isBouncing, setIsBouncing] = useState(false);

  return (
    <motion.div 
      className="group relative flex overflow-hidden rounded-full border border-zinc-800 bg-zinc-950 transition-colors hover:border-zinc-700 hover:bg-zinc-800 h-[26px] z-10 lg:hover:z-20 cursor-grab active:cursor-grabbing"
      onHoverStart={() => {
        if (!isBouncing) setIsBouncing(true);
      }}
      initial={{ y: 0 }}
      animate={isBouncing ? { y: [0, -5, 0] } : { y: 0 }}
      transition={isBouncing ? { duration: 0.25, times: [0, 0.4, 1], ease: ["easeOut", "easeIn"] } : { duration: 0 }}
      onAnimationComplete={() => setIsBouncing(false)}
      style={{ transformOrigin: "center" }}
    >
      <div 
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/x-game-log-tag', tag);
          e.dataTransfer.effectAllowed = 'copy';
          
          const dragPreview = e.currentTarget.cloneNode(true) as HTMLElement;
          dragPreview.style.position = 'absolute';
          dragPreview.style.top = '-1000px';
          dragPreview.style.opacity = '0.7';
          dragPreview.style.pointerEvents = 'none';
          document.body.appendChild(dragPreview);
          e.dataTransfer.setDragImage(dragPreview, 0, 0);
          setTimeout(() => document.body.removeChild(dragPreview), 0);
        }}
        className="flex items-center h-full"
      >
        <div 
          className="flex items-center pl-2.5 pr-1.5 h-full cursor-pointer shrink-0"
          onClick={() => {
            setFilteredTag(tag);
            scrollToTab('notes');
          }}
        >
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter transition-colors group-hover:text-zinc-300">{tag}</span>
        </div>
        
        {/* Sliding Container for Count / Delete */}
        <div className="overflow-hidden h-full w-[26px] relative shrink-0">
          <div className="flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-[26px] w-full">
            {/* Default State (Count) */}
            <div 
              className="h-[26px] flex items-center shrink-0 cursor-pointer w-full"
              onClick={() => {
                setFilteredTag(tag);
                scrollToTab('notes');
              }}
            >
              <div className="w-4 flex items-center justify-center">
                {count > 0 && (
                  <span className="text-[10px] font-mono font-bold text-zinc-600 transition-colors group-hover:text-zinc-500">{count}</span>
                )}
              </div>
            </div>
            
            {/* Hover State (Delete Button) */}
            <div className="h-[26px] flex items-center shrink-0 w-full">
              <div className="w-4 flex items-center justify-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSessionTag(tag, e);
                  }}
                  className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors flex items-center justify-center h-5 w-5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SidebarSessionItem({ session, ctx }: any) {
  const {
    activeMenuId, activeMenuType, setActiveMenuId, setActiveMenuType,
    editingGroupId, selectedSessionIdsForGroup, setSelectedSessionIdsForGroup,
    editingSidebarSessionId, setEditingSidebarSessionId,
    editingSidebarSessionName, setEditingSidebarSessionName,
    handleUpdateSessionDetails, handleResumeSession, scrollToTab,
    getSessionNotesCount, setSessionToDelete, activeSession
  } = ctx;
  const [isBouncing, setIsBouncing] = useState(false);

  return (
    <motion.div 
      className={`flex items-stretch gap-2 relative group/session ${activeMenuId === session.id && activeMenuType === 'session' ? 'z-50' : 'z-10'}`}
      onHoverStart={() => {
        if (!isBouncing) setIsBouncing(true);
      }}
      initial={{ y: 0 }}
      animate={isBouncing ? { y: [0, -5, 0] } : { y: 0 }}
      transition={isBouncing ? { duration: 0.25, times: [0, 0.4, 1], ease: ["easeOut", "easeIn"] } : { duration: 0 }}
      onAnimationComplete={() => setIsBouncing(false)}
      style={{ transformOrigin: "center" }}
    >
      {editingGroupId !== null && (
        <input
          type="checkbox"
          checked={selectedSessionIdsForGroup.has(session.id)}
          onChange={(e) => {
            const newSet = new Set(selectedSessionIdsForGroup);
            if (e.target.checked) {
              newSet.add(session.id);
            } else {
              newSet.delete(session.id);
            }
            setSelectedSessionIdsForGroup(newSet);
          }}
          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-zinc-600 focus:ring-offset-zinc-950 shrink-0"
        />
      )}
      {editingSidebarSessionId === session.id ? (
        <input
          type="text"
          value={editingSidebarSessionName}
          onChange={(e) => setEditingSidebarSessionName(e.target.value)}
          onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              if (editingSidebarSessionName.trim() && editingSidebarSessionName !== (session.name || session.progressMarker)) {
                await handleUpdateSessionDetails(
                  editingSidebarSessionName.trim(), 
                  session.chapter || '', 
                  session.hoursPlayed ? session.hoursPlayed.toString() : '', 
                  session.groupId,
                  session.id
                );
              }
              setEditingSidebarSessionId(null);
            } else if (e.key === 'Escape') {
              setEditingSidebarSessionId(null);
            }
          }}
          autoFocus
          onBlur={async () => {
             if (editingSidebarSessionName.trim() && editingSidebarSessionName !== (session.name || session.progressMarker)) {
               await handleUpdateSessionDetails(
                 editingSidebarSessionName.trim(), 
                 session.chapter || '', 
                 session.hoursPlayed ? session.hoursPlayed.toString() : '', 
                 session.groupId,
                 session.id
               );
             }
             setEditingSidebarSessionId(null);
          }}
          className={`flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm font-bold focus:outline-none focus:border-zinc-600 min-w-0 ${activeSession?.id === session.id ? 'text-zinc-100' : 'text-zinc-400'}`}
        />
      ) : (
        <div
          onClick={() => {
            handleResumeSession(session);
            scrollToTab('notes');
          }}
          className={`flex-1 p-3 rounded-xl transition-all duration-300 flex items-center justify-between cursor-pointer border ${
            activeSession?.id === session.id 
              ? 'bg-zinc-800/60 border-zinc-700/50 shadow-sm'
              : 'bg-zinc-900/40 border-zinc-800/30 hover:bg-zinc-800/60 hover:border-zinc-700/50 lg:opacity-50 lg:group-hover/sidebar:opacity-100'
          }`}
        >
          <div className="flex-1 min-w-0 pr-4">
            <p className={`font-semibold text-sm line-clamp-1 mb-0.5 ${activeSession?.id === session.id ? 'text-amber-400' : 'text-zinc-300'}`}>
              {session.name || session.progressMarker || 'Unnamed Session'}
            </p>
            <div className="flex items-center gap-3">
              <span className={`text-xs ${activeSession?.id === session.id ? 'text-zinc-300' : 'text-zinc-500'}`}>
                {format(session.startTime, 'MMM d, yyyy')}
              </span>
              {(session.hoursPlayed !== undefined && session.hoursPlayed !== null) && (
                <span className={`text-xs font-medium ${activeSession?.id === session.id ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {decimalToHoursStr(session.hoursPlayed)}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-end shrink-0 w-8 h-8 relative">
            {editingGroupId === null && (
              <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
                session.id === activeSession?.id || (activeMenuId === session.id && activeMenuType === 'session')
                  ? 'opacity-100 scale-100 rotate-0'
                  : 'opacity-0 scale-75 rotate-90 pointer-events-none'
              }`}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeMenuId === session.id && activeMenuType === 'session') {
                      setActiveMenuId(null);
                      setActiveMenuType(null);
                    } else {
                      setActiveMenuId(session.id);
                      setActiveMenuType('session');
                    }
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${activeMenuId === session.id && activeMenuType === 'session' ? 'text-zinc-100 bg-zinc-700/50' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/50'}`}
                  title="More Options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {activeMenuId === session.id && activeMenuType === 'session' && (
                  <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-[100] py-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setEditingSidebarSessionId(session.id);
                        setEditingSidebarSessionName(session.name || session.progressMarker);
                        setActiveMenuId(null);
                        setActiveMenuType(null);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 flex items-center gap-2"
                    >
                      <PenLine className="w-3.5 h-3.5" /> Rename
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const notesCount = await getSessionNotesCount(session.id);
                        setSessionToDelete({ id: session.id, name: session.name || session.progressMarker, notesCount });
                        setActiveMenuId(null);
                        setActiveMenuType(null);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:text-red-400 hover:bg-zinc-800 flex items-center gap-2 border-t border-zinc-800/50 mt-1 pt-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div className={`absolute inset-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
              session.id === activeSession?.id || (activeMenuId === session.id && activeMenuType === 'session')
                ? 'opacity-0 scale-75 -rotate-90 pointer-events-none'
                : 'opacity-100 scale-100 rotate-0 bg-zinc-800/50 group-hover/session:bg-zinc-700'
            }`}>
              <ChevronRight className={`w-4 h-4 text-zinc-500 group-hover/session:text-zinc-300`} />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

const decimalToHoursStr = (decimalVal?: number | null | string): string => {
  if (decimalVal === undefined || decimalVal === null || decimalVal === '') return '';
  const val = typeof decimalVal === 'string' ? parseFloat(decimalVal) : decimalVal;
  if (isNaN(val)) return '';
  const h = Math.floor(val);
  const m = Math.round((val - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
};

const hoursStrToDecimalStr = (valStr: string): string => {
  if (!valStr) return '';
  if (valStr.includes(':')) {
    const [hStr, mStr] = valStr.split(':');
    const h = parseInt(hStr) || 0;
    const m = parseInt(mStr) || 0;
    return (h + (m / 60)).toString();
  }
  const parsed = parseFloat(valStr);
  return isNaN(parsed) ? '' : parsed.toString();
};

export default function SessionView() {
  const { goBack, navigateTo } = useUI();
  const { 
    selectedGame, 
    activeSession,
    sessions,
    sessionGroups,
    handleDeleteGame, 
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
  } = useGameContext();

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

  const activeSessionTags = activeSession?.tags || [];
  const allSessionTagsList = React.useMemo(() => {
    const combined = new Set([...Object.keys(tagCounts), ...activeSessionTags]);
    return Array.from(combined).sort((a, b) => {
      // Sort by count descending, then alphabetical
      const countA = tagCounts[a] || 0;
      const countB = tagCounts[b] || 0;
      if (countB !== countA) return countB - countA;
      return a.localeCompare(b);
    });
  }, [tagCounts, activeSessionTags]);

  const globalSessionTags = React.useMemo(() => {
    const tags = new Set<string>();
    sessions.forEach(s => {
      s.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags);
  }, [sessions]);

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
  const [sessionGroupIdInput, setSessionGroupIdInput] = useState<string | undefined>(undefined);
  const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
  const [newGroupNameInput, setNewGroupNameInput] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupTitle, setEditingGroupTitle] = useState('');
  
  const [isAddingMetric, setIsAddingMetric] = useState(false);
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null);
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
  const [isTrackersCollapsed, setIsTrackersCollapsed] = useState(false);
  const [collapsedTrackerGroups, setCollapsedTrackerGroups] = useState<Set<string>>(new Set());

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

  const handleDeleteSessionTag = async (tagToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (activeSession) {
      handleUpdateSessionTags(activeSession.id, activeSessionTags.filter(t => t !== tagToDelete));
    }
    
    // Clear filter if active
    if (filteredTag === tagToDelete) {
      setFilteredTag(undefined);
    }
    
    // Find all notes containing this tag across the session
    const notesWithTag = allSessionNotes.filter(n => n.tags && n.tags.includes(tagToDelete));
    for (const note of notesWithTag) {
      await handleRemoveTag(note.id, tagToDelete);
    }
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToTab = (tab: 'sessions' | 'notes' | 'trackers', behavior: ScrollBehavior = 'smooth') => {
    setActiveMobileTab(tab);
    if (window.innerWidth >= 1024) return;
    const element = document.getElementById(`mobile-tab-${tab}`);
    if (element) {
      element.scrollIntoView({ behavior, inline: 'center', block: 'nearest' });
    }
  };

  useEffect(() => {
    if (window.innerWidth >= 1024) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const tabId = entry.target.id;
            if (tabId === 'mobile-tab-sessions') setActiveMobileTab(prev => prev !== 'sessions' ? 'sessions' : prev);
            if (tabId === 'mobile-tab-notes') setActiveMobileTab(prev => prev !== 'notes' ? 'notes' : prev);
            if (tabId === 'mobile-tab-trackers') setActiveMobileTab(prev => prev !== 'trackers' ? 'trackers' : prev);
          }
        });
      },
      {
        root: scrollContainerRef.current,
        threshold: 0.5
      }
    );

    const tabs = ['sessions', 'notes', 'trackers'];
    tabs.forEach(tab => {
      const el = document.getElementById(`mobile-tab-${tab}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      // Small timeout allows initial render and layout to settle
      const timer = setTimeout(() => {
        scrollToTab(activeMobileTab, 'instant');
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleOpenSessionDetails = () => {
      if (activeSession) {
        setSessionNameInput(activeSession.name || '');
        setSessionChapterInput(activeSession.chapter || '');
        setSessionHoursInput(decimalToHoursStr(activeSession.hoursPlayed));
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
        if (scrollHeight > 96) {
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
  }, [allSessionTagsList.length, activeSessionTags.length]);

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

  const rowVirtualizer = useVirtualizer({
    count: sessionNotes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
    overscan: 5,
  });

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

    await handleUpdateSessionDetails(sessionNameInput, sessionChapterInput, hoursStrToDecimalStr(sessionHoursInput), finalGroupId === undefined ? '' : finalGroupId);
    setIsEditingSessionDetails(false);
    setIsCreatingNewGroup(false);
    setNewGroupNameInput('');
  };

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 min-h-0 pb-[58px] sm:pb-[58px] lg:pb-0 flex flex-row overflow-x-auto snap-x snap-mandatory lg:overflow-x-visible lg:snap-none justify-start lg:justify-center gap-12 lg:gap-0 animate-in fade-in slide-in-from-bottom-4 duration-500 relative scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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

      {/* Sidebar for Sessions */}
      <div id="mobile-tab-sessions" className="group/sidebar w-full shrink-0 snap-center snap-always lg:w-[320px] flex-col lg:border-r border-zinc-800/50 min-h-0 flex relative">
        
        <div className="w-full flex flex-col h-full min-h-0 flex-1 relative z-10">
        <div className="flex items-center justify-between px-5 lg:px-6 pt-5 pb-5 z-10">
          <div className="flex items-center gap-3 text-zinc-100 hidden lg:flex">
            <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20">
              <List className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-lg font-normal tracking-[.016em]">Sessions</h2>
          </div>
          <h3 className="font-normal uppercase tracking-widest text-xs text-zinc-400 lg:hidden">Sessions</h3>
          <div className="flex items-center gap-1.5 lg:bg-zinc-800/40 lg:border lg:border-zinc-700/50 lg:rounded-xl lg:p-1">
            <button 
              onClick={() => setSessionSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className={`lg:w-7 lg:h-7 p-1.5 lg:p-0 rounded-lg transition-all flex items-center justify-center ${sessionSortOrder === 'asc' ? 'bg-zinc-700 text-zinc-100 lg:shadow-sm' : 'text-zinc-500 hover:text-white bg-zinc-900 lg:bg-transparent hover:bg-zinc-800 lg:hover:bg-zinc-700/50'} focus:scale-95`}
              title={sessionSortOrder === 'desc' ? 'Sorting Newest First' : 'Sorting Oldest First'}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
            <button 
              onClick={() => setIsCreatingGroupFromList(true)}
              className="lg:w-7 lg:h-7 p-1.5 lg:p-0 bg-zinc-900 hover:bg-zinc-800 lg:bg-transparent lg:hover:bg-zinc-700/50 rounded-lg text-zinc-400 hover:text-white transition-all flex items-center justify-center focus:scale-95"
              title="New Group"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
            </button>
            <div className="hidden lg:block w-[1px] h-3.5 bg-zinc-700/50 mx-0.5" />
            <button 
              onClick={() => {
                handleStartSession();
                scrollToTab('notes');
              }}
              className="lg:w-7 lg:h-7 p-1.5 lg:p-0 bg-zinc-900 hover:bg-zinc-800 lg:bg-zinc-700/80 lg:hover:bg-zinc-600 rounded-lg text-zinc-300 hover:text-white transition-all flex items-center justify-center focus:scale-95 lg:shadow-sm lg:border lg:border-zinc-600/50"
              title="New Session"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isCreatingGroupFromList && (
          <div className="mb-4 mx-3 lg:mx-6 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-3">
            <input
              type="text"
              value={newGroupNameInput}
              onChange={(e) => setNewGroupNameInput(e.target.value)}
              placeholder="New Group Name"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsCreatingGroupFromList(false);
                  setNewGroupNameInput('');
                }}
                className="px-3 py-1.5 text-xs font-bold text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (newGroupNameInput.trim()) {
                    await handleCreateSessionGroup(newGroupNameInput.trim());
                    setIsCreatingGroupFromList(false);
                    setNewGroupNameInput('');
                  }
                }}
                className="px-3 py-1.5 text-xs font-bold bg-zinc-100 text-zinc-950 rounded-lg hover:bg-white transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-3 lg:px-6 custom-scrollbar">
          <div className="space-y-6 pb-24 lg:pb-20">
          {sessions.length === 1 && sessions[0].id === activeSession?.id && (
            <div className="px-2 py-4 mb-2 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-700">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Getting Started</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This is your first session! As you play more, your history will build up here.
              </p>
            </div>
          )}
          {groupedSessions.map(group => {
            const isCollapsed = collapsedGroups.has(group.id);
            const isGroupTapped = activeTappedId === group.id;
            return (
            <div key={group.id} className={`bg-zinc-950/30 border border-zinc-800/50 rounded-2xl p-2 space-y-1 group relative ${(activeMenuId === group.id && activeMenuType === 'group') || (activeMenuType === 'session' && group.sessions.some(s => s.id === activeMenuId)) ? 'z-50' : 'z-10'}`}>
              <div 
                className={`flex items-center justify-between px-2 py-1.5 cursor-pointer transition-colors group/header ${activeMenuId === group.id && activeMenuType === 'group' ? 'bg-zinc-900/30 rounded-lg' : 'hover:bg-zinc-900/30 rounded-lg'}`}
                onClick={(e) => {
                  // Don't toggle if clicking on buttons or inputs
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || target.closest('input')) return;
                  setActiveTappedId(isGroupTapped ? null : group.id);
                  toggleGroupCollapse(group.id);
                }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 transition-colors group-hover/header:text-zinc-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-600 transition-colors group-hover/header:text-zinc-500 shrink-0" />
                  )}
                  
                  {editingGroupId === group.id ? (
                    <input
                      type="text"
                      value={editingGroupTitle}
                      onChange={(e) => setEditingGroupTitle(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                           if (editingGroupTitle.trim() && editingGroupTitle !== group.title) {
                             await handleUpdateSessionGroup(group.id, editingGroupTitle.trim());
                           }
                           await handleUpdateSessionGroupMembership(group.id, Array.from(selectedSessionIdsForGroup));
                           setEditingGroupId(null);
                        }
                      }}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-bold text-zinc-100 focus:outline-none focus:border-zinc-600 min-w-0"
                      autoFocus
                    />
                  ) : (
                    <h4 className="text-[11px] font-normal text-zinc-400 uppercase tracking-widest transition-colors group-hover/header:text-zinc-300 truncate">{group.title}</h4>
                  )}
                </div>
                
                <div className={`flex items-center gap-0.5 transition-opacity shrink-0 bg-zinc-950/80 rounded-md px-1 ${(activeMenuId === group.id && activeMenuType === 'group') || isGroupTapped ? 'opacity-100' : 'opacity-0 lg:group-hover/header:opacity-100'}`}>
                  {editingGroupId === group.id ? (
                    <>
                      <button
                        onClick={async () => {
                          if (editingGroupTitle.trim() && editingGroupTitle !== group.title) {
                            await handleUpdateSessionGroup(group.id, editingGroupTitle.trim());
                          }
                          await handleUpdateSessionGroupMembership(group.id, Array.from(selectedSessionIdsForGroup));
                          setEditingGroupId(null);
                        }}
                        className="p-1 text-green-500 hover:bg-zinc-800 rounded"
                        title="Save Changes"
                      >
                        <PenLine className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingGroupId(null)}
                        className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded"
                        title="Cancel Editing"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartSession(group.id);
                        }}
                        className="hidden sm:flex p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                        title="Add Session"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (activeMenuId === group.id && activeMenuType === 'group') {
                              setActiveMenuId(null);
                              setActiveMenuType(null);
                            } else {
                              setActiveMenuId(group.id);
                              setActiveMenuType('group');
                            }
                          }}
                          className={`p-1 rounded ${activeMenuId === group.id && activeMenuType === 'group' ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}
                          title="More Options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        {activeMenuId === group.id && activeMenuType === 'group' && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50 py-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartSession(group.id);
                                setActiveMenuId(null);
                                setActiveMenuType(null);
                              }}
                              className="sm:hidden w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 flex items-center gap-2"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Session
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingGroupId(group.id);
                                setEditingGroupTitle(group.title);
                                setSelectedSessionIdsForGroup(new Set(group.sessions.map(s => s.id)));
                                setActiveMenuId(null);
                                setActiveMenuType(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 flex items-center gap-2"
                            >
                              <PenLine className="w-3.5 h-3.5" /> Edit Group
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setGroupToDelete({ id: group.id, title: group.title });
                                setActiveMenuId(null);
                                setActiveMenuType(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:text-red-400 hover:bg-zinc-800 flex items-center gap-2 border-t border-zinc-800/50 mt-1 pt-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <div 
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isCollapsed ? 'grid-rows-[0fr] opacity-0 pointer-events-none' : 'grid-rows-[1fr] opacity-100'}`}
              >
                <div className={cn(
                  (activeMenuType === 'session' && group.sessions.some(s => s.id === activeMenuId)) ? "overflow-visible" : "overflow-hidden"
                )}>
                  <div className="grid grid-cols-1 gap-1 mt-1">
                    {group.sessions.map(session => {
                      const sessionContext = {
                        activeMenuId, activeMenuType, setActiveMenuId, setActiveMenuType,
                        editingGroupId, selectedSessionIdsForGroup, setSelectedSessionIdsForGroup,
                        editingSidebarSessionId, setEditingSidebarSessionId,
                        editingSidebarSessionName, setEditingSidebarSessionName,
                        handleUpdateSessionDetails, handleResumeSession, scrollToTab,
                        getSessionNotesCount, setSessionToDelete, activeSession
                      };
                      return <SidebarSessionItem key={session.id} session={session} ctx={sessionContext} />;
                    })}
                  {group.sessions.length > 0 && (
                    <div className={`grid transition-all duration-200 ease-in-out ${isGroupTapped ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] lg:group-hover:grid-rows-[1fr]'}`}>
                      <div className="overflow-hidden">
                        <button
                          onClick={() => handleStartSession(group.id)}
                          className={`w-full text-left p-2 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 transition-all flex items-center justify-center gap-2 h-10 ${isGroupTapped ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold uppercase tracking-wider">New Session</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {group.sessions.length === 0 && (
                    <p className="text-xs text-zinc-600 italic px-2">No sessions in this group</p>
                  )}
                  </div>
                </div>
              </div>
            </div>
          )})}

          {ungroupedSessions.length > 0 && (() => {
            const isGroupTapped = activeTappedId === 'ungrouped';
            const isWrapped = groupedSessions.length > 0;
            return (
            <div className={`space-y-1 group relative ${isWrapped ? 'bg-zinc-950/30 border border-zinc-800/50 rounded-2xl p-2' : ''} ${(activeMenuType === 'session' && ungroupedSessions.some(s => s.id === activeMenuId)) ? 'z-50' : 'z-10'}`}>
              {groupedSessions.length > 0 && (
                <div 
                  className={`flex items-center justify-between px-2 py-1.5 cursor-pointer transition-colors group/header ${activeMenuType === 'session' && activeMenuId === 'ungrouped' ? 'bg-zinc-900/30 rounded-lg' : 'hover:bg-zinc-900/30 rounded-lg'}`}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (target.closest('button') || target.closest('input')) return;
                    setActiveTappedId(isGroupTapped ? null : 'ungrouped');
                    toggleGroupCollapse('ungrouped');
                  }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {collapsedGroups.has('ungrouped') ? (
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-600 transition-colors group-hover/header:text-zinc-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-600 transition-colors group-hover/header:text-zinc-500 shrink-0" />
                    )}
                    <h4 className="text-[11px] font-normal text-zinc-400 uppercase tracking-widest transition-colors group-hover/header:text-zinc-300 truncate">Ungrouped</h4>
                  </div>
                  <div className={`flex items-center gap-0.5 transition-opacity shrink-0 bg-zinc-950/80 rounded-md px-1 ${isGroupTapped ? 'opacity-100' : 'opacity-0 lg:group-hover/header:opacity-100'}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartSession();
                      }}
                      className="hidden sm:flex p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                      title="Add Session"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
              <div 
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${collapsedGroups.has('ungrouped') ? 'grid-rows-[0fr] opacity-0 pointer-events-none' : 'grid-rows-[1fr] opacity-100'}`}
              >
                <div className={cn(
                  (activeMenuType === 'session' && ungroupedSessions.some(s => s.id === activeMenuId)) ? "overflow-visible" : "overflow-hidden"
                )}>
                  <div className="grid grid-cols-1 gap-1 mt-1">
                    {ungroupedSessions.map(session => {
                      const sessionContext = {
                        activeMenuId, activeMenuType, setActiveMenuId, setActiveMenuType,
                        editingGroupId, selectedSessionIdsForGroup, setSelectedSessionIdsForGroup,
                        editingSidebarSessionId, setEditingSidebarSessionId,
                        editingSidebarSessionName, setEditingSidebarSessionName,
                        handleUpdateSessionDetails, handleResumeSession, scrollToTab,
                        getSessionNotesCount, setSessionToDelete, activeSession
                      };
                      return <SidebarSessionItem key={session.id} session={session} ctx={sessionContext} />;
                    })}
                  {ungroupedSessions.length > 0 && groupedSessions.length > 0 && (
                     <div className={`grid transition-all duration-200 ease-in-out ${isGroupTapped ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] lg:group-hover:grid-rows-[1fr]'}`}>
                       <div className="overflow-hidden">
                         <button
                           onClick={() => handleStartSession()}
                           className={`w-full text-left p-2 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 transition-all flex items-center justify-center gap-2 h-10 ${isGroupTapped ? 'opacity-100' : 'opacity-0 lg:group-hover:opacity-100'}`}
                         >
                           <Plus className="w-3.5 h-3.5" />
                           <span className="text-xs font-bold uppercase tracking-wider">New Session</span>
                         </button>
                       </div>
                     </div>
                   )}
                  </div>
                </div>
              </div>
            </div>
            );
          })()}
        </div>
        </div>
        </div>
      </div>

      {/* Main Session View or Filtered View */}
      <div id="mobile-tab-notes" className="w-full shrink-0 snap-center snap-always lg:flex-1 lg:max-w-3xl xl:max-w-4xl flex-col min-w-0 min-h-0 flex lg:px-6">
        <div className="w-full md:max-w-2xl lg:max-w-none mx-auto flex flex-col h-full min-h-0 flex-1 pl-4 pr-4 sm:pl-6 sm:pr-6 lg:pl-0 lg:pr-0 pt-4 lg:pt-6">
        {filteredTag ? (
          <>
            <div className="mb-3 sm:mb-6 bg-zinc-900 border border-zinc-700/50 rounded-2xl p-4 shrink-0 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0">
                  <TagIcon className="w-5 h-5 text-zinc-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-zinc-100 truncate">
                    Notes tagged with "{filteredTag}"
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {filterScope === 'session' ? (
                      <>
                        {filteredNotesBySession[activeSession?.id || 'global']?.length || 0} found in this session. 
                        {Object.keys(filteredNotesBySession).length > (filteredNotesBySession[activeSession?.id || 'global'] ? 1 : 0) && (
                          <button 
                            onClick={() => setFilterScope('global')}
                            className="ml-1 text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2 transition-colors"
                          >
                            Also found in {Object.keys(filteredNotesBySession).length - (filteredNotesBySession[activeSession?.id || 'global'] ? 1 : 0)} other session(s).
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {globalNotesForTag.length} found across {Object.keys(filteredNotesBySession).length} session(s).{" "}
                        <button 
                          onClick={() => setFilterScope('session')}
                          className="ml-1 text-indigo-400 hover:text-indigo-300 font-medium underline underline-offset-2 transition-colors"
                        >
                          Return to current session
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setFilteredTag(null);
                  setFilterScope('session');
                }}
                className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700 flex items-center justify-center transition-colors"
                title="Clear Filter"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2">
              {Object.entries(filteredNotesBySession)
                .filter(([sid]) => filterScope === 'global' ? true : sid === (activeSession?.id || 'global'))
                .map(([sessionId, groupNotes]) => (
                <div key={sessionId} className="space-y-4">
                  <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur pb-2 pt-1 border-b border-zinc-800/50 mb-2">
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{getSessionName(sessionId === 'global' ? null : sessionId)}</h3>
                  </div>
                  <div className="space-y-4">
                    {groupNotes.map(note => (
                      <div key={note.id} className="relative pb-4">
                        <SortableNote 
                          note={note}
                          onUpdate={handleUpdateNote}
                          onDelete={handleDeleteNote}
                          onAddTag={handleAddTag}
                          onRemoveTag={handleRemoveTag}
                          taggingStatus={taggingStatus[note.id]}
                          onRetryTagging={handleRetryTagging}
                          onTagClick={setFilteredTag}
                          availableSessions={availableSessions}
                          onMoveNote={(targetSessionId) => handleMoveNote(note.id, targetSessionId === 'global' ? null : targetSessionId)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {(filterScope === 'session' ? (filteredNotesBySession[activeSession?.id || 'global']?.length || 0) : globalNotesForTag.length) === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 bg-zinc-900/50 rounded-full flex items-center justify-center mb-4">
                    <TagIcon className="w-8 h-8 text-zinc-700" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-400 mb-2">No notes found</h3>
                  <p className="text-zinc-600 max-w-sm">
                    No notes are currently tagged with "{filteredTag}" {filterScope === 'session' ? 'in this session' : ''}.
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Compact Session Header */}
            <div 
          className={`mb-3 sm:mb-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-3 sm:p-4 shrink-0 flex-col transition-all duration-300 ${isEditingSessionDetails ? 'flex' : 'hidden lg:flex'}`}
        >
          <div className="hidden lg:flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0 group/title flex-1">
              {isEditingTitleInline ? (
                <input
                  type="text"
                  value={inlineTitleInput}
                  onChange={(e) => setInlineTitleInput(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                       if (inlineTitleInput.trim() && inlineTitleInput !== (activeSession.name || activeSession.progressMarker)) {
                         await handleUpdateSessionDetails(inlineTitleInput.trim(), activeSession.chapter || '', activeSession.hoursPlayed ? activeSession.hoursPlayed.toString() : '', activeSession.groupId);
                       }
                       setIsEditingTitleInline(false);
                    } else if (e.key === 'Escape') {
                       setIsEditingTitleInline(false);
                    }
                  }}
                  autoFocus
                  onBlur={async () => {
                     if (inlineTitleInput.trim() && inlineTitleInput !== (activeSession.name || activeSession.progressMarker)) {
                       await handleUpdateSessionDetails(inlineTitleInput.trim(), activeSession.chapter || '', activeSession.hoursPlayed ? activeSession.hoursPlayed.toString() : '', activeSession.groupId);
                     }
                     setIsEditingTitleInline(false);
                  }}
                  className="text-xl font-bold bg-zinc-950 border border-zinc-800 rounded px-2 py-0.5 focus:outline-none focus:border-zinc-600 w-full"
                />
              ) : (
                <>
                  <h2 className="text-xl font-bold truncate">
                    {activeSession.name || activeSession.progressMarker}
                  </h2>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setInlineTitleInput(activeSession.name || activeSession.progressMarker);
                      setIsEditingTitleInline(true);
                    }}
                    className="p-1 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded opacity-0 group-hover/title:opacity-100 transition-opacity hidden sm:block shrink-0"
                    title="Edit Title"
                  >
                    <PenLine className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-3 text-zinc-400 text-xs flex-wrap mr-1">
                {activeSession.chapter && (
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate max-w-[100px] sm:max-w-none">{activeSession.chapter}</span>
                  </div>
                )}
                {(activeSession.hoursPlayed !== undefined && activeSession.hoursPlayed !== null) && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {decimalToHoursStr(activeSession.hoursPlayed)} hrs
                  </div>
                )}
              </div>
              
              <button
                onClick={() => {
                  if (isEditingSessionDetails) {
                    setIsEditingSessionDetails(false);
                    setIsCreatingNewGroup(false);
                    setNewGroupNameInput('');
                  } else {
                    setSessionNameInput(activeSession.name || '');
                    setSessionChapterInput(activeSession.chapter || '');
                    setSessionHoursInput(decimalToHoursStr(activeSession.hoursPlayed));
                    setSessionGroupIdInput(activeSession.groupId);
                    setIsEditingSessionDetails(true);
                  }
                }}
                className="p-1.5 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
              >
                {isEditingSessionDetails ? <X className="w-4 h-4" /> : <PenLine className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isEditingSessionDetails && (
            <div className="mt-0 pt-0 lg:mt-4 lg:pt-4 border-t-0 lg:border-t border-zinc-800/50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between mb-4 lg:hidden">
                <h3 className="font-bold">Edit Session Details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Session Name</label>
                  <input
                    type="text"
                    value={sessionNameInput}
                    onChange={(e) => setSessionNameInput(e.target.value)}
                    placeholder="e.g. Boss Fight"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Chapter / Level</label>
                  <input
                    type="text"
                    value={sessionChapterInput}
                    onChange={(e) => setSessionChapterInput(e.target.value)}
                    placeholder="e.g. Chapter 4"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Hours Played</label>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => setSessionHoursInput(prev => {
                         const current = parseFloat(hoursStrToDecimalStr(prev || '0')) || 0;
                         const next = Math.max(0, current - 0.25);
                         return decimalToHoursStr(next);
                      })}
                      className="w-10 h-10 shrink-0 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="text"
                      value={sessionHoursInput}
                      onChange={(e) => setSessionHoursInput(e.target.value)}
                      placeholder="H:MM"
                      className="w-full text-center bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                    />
                    <button 
                      type="button"
                      onClick={() => setSessionHoursInput(prev => {
                         const current = parseFloat(hoursStrToDecimalStr(prev || '0')) || 0;
                         const next = current + 0.25;
                         return decimalToHoursStr(next);
                      })}
                      className="w-10 h-10 shrink-0 bg-zinc-950 border border-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Session Group</label>
                  {!isCreatingNewGroup ? (
                    <select
                      value={sessionGroupIdInput || ''}
                      onChange={(e) => {
                        if (e.target.value === 'new') {
                          setIsCreatingNewGroup(true);
                          setSessionGroupIdInput(undefined);
                        } else {
                          setSessionGroupIdInput(e.target.value);
                        }
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                    >
                      <option value="">None</option>
                      {sessionGroups.map(group => (
                        <option key={group.id} value={group.id}>{group.title}</option>
                      ))}
                      <option value="new">+ Create New Group</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newGroupNameInput}
                        onChange={(e) => setNewGroupNameInput(e.target.value)}
                        placeholder="New Group Name"
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          setIsCreatingNewGroup(false);
                          setNewGroupNameInput('');
                        }}
                        className="p-2 text-zinc-400 hover:text-zinc-100 rounded-lg hover:bg-zinc-800 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => {
                    setIsEditingSessionDetails(false);
                    setIsCreatingNewGroup(false);
                    setNewGroupNameInput('');
                  }}
                  className="px-4 py-2 bg-transparent text-zinc-400 hover:text-zinc-100 rounded-xl text-sm font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSessionDetails}
                  className="px-4 py-2 bg-zinc-100 text-zinc-950 rounded-xl text-sm font-bold hover:bg-white transition-colors"
                >
                  Save Details
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Notes Feed */}
        <div 
          ref={parentRef} 
          className="flex-1 overflow-y-auto pr-2 custom-scrollbar"
          
        >
          {sessionNotes.length >= notesLimit && (
            <div className="flex justify-center mb-6 mt-2">
              <button 
                onClick={loadMoreNotes}
                className="bg-zinc-900 border border-zinc-800 text-zinc-400 px-6 py-2 rounded-full font-bold text-xs hover:text-zinc-100 hover:bg-zinc-800 transition-all"
              >
                Load Older Notes
              </button>
            </div>
          )}
          {sessionNotes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in-95 duration-700">
              <div className="w-16 h-16 bg-zinc-900/50 rounded-2xl flex items-center justify-center mb-6 rotate-3">
                <PenLine className="w-8 h-8 text-zinc-500" />
              </div>
              <h3 className="text-xl font-bold text-zinc-100 mb-3">Your Journey Begins</h3>
              <p className="text-zinc-500 max-w-xs text-sm leading-relaxed mb-8">
                Every great adventure deserves to be remembered. Start typing below to capture your first thought, discovery, or strategy.
              </p>
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={sessionNotes.map(n => n.id)}
                strategy={verticalListSortingStrategy}
              >
                <div
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                  }}
                >
                  {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const note = sessionNotes[virtualRow.index];
                    return (
                      <div
                        key={note.id}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        className=""
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                          paddingBottom: '16px', // space-y-4 equivalent
                        }}
                      >
                        <SortableNote 
                          note={note}
                          onUpdate={handleUpdateNote}
                          onDelete={handleDeleteNote}
                          onAddTag={handleAddTag}
                          onRemoveTag={handleRemoveTag}
                          taggingStatus={taggingStatus[note.id]}
                          onRetryTagging={handleRetryTagging}
                          onTagClick={setFilteredTag}
                          availableSessions={availableSessions}
                          onMoveNote={(targetSessionId) => handleMoveNote(note.id, targetSessionId === 'global' ? null : targetSessionId)}
                        />
                      </div>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          )}
          <div ref={notesEndRef} />
        </div>

        {/* Input Area */}
        <div className="shrink-0 bg-zinc-950 pt-2 hidden lg:block">
          <LayoutGroup>
            <div 
              ref={noteInputContainerRef}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl p-2 shadow-2xl transition-all duration-300 focus-within:border-zinc-700 hover:border-zinc-700"
              onFocus={() => setIsInputFocused(true)}
            >
              <motion.form 
                layout 
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                onSubmit={submitNote} 
                className="flex flex-col"
              >
              <div className="flex gap-2 items-end">
                <textarea 
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Type a note about your experience..."
                  rows={1}
                  className={`flex-1 bg-transparent border-none focus:ring-0 text-zinc-100 px-4 py-3 placeholder:text-zinc-600 outline-none transition-all duration-300 ease-in-out resize-none custom-scrollbar ${isInputFocused ? 'h-[120px]' : 'h-[48px] hover:h-[120px] focus:h-[120px]'}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submitNote();
                    }
                  }}
                />
                <AnimatePresence>
                  {!isInputFocused && (
                    <motion.button 
                      layoutId="save-note-btn"
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      type="submit"
                      disabled={!noteInput.trim() || isSubmittingNote}
                      className="bg-zinc-100 text-zinc-950 px-6 h-[48px] rounded-2xl font-bold hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 mb-0.5"
                    >
                      {isSubmittingNote ? (
                        <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          <span className="hidden sm:inline">Save</span>
                        </>
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              
              <AnimatePresence>
                {isInputFocused && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="pl-4 pr-0 pb-1 flex flex-wrap items-center justify-between gap-4 border-t border-zinc-800/50 pt-2 mt-1">
                      <div className="flex flex-wrap items-center gap-2 flex-1 min-h-[40px]">
                        <TagIcon className="w-4 h-4 text-zinc-500 shrink-0" />
                        {noteTags.map(tag => (
                          <span key={tag} className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-md flex items-center gap-1">
                            {tag}
                            <button 
                              type="button"
                              onClick={() => setNoteTags(prev => prev.filter(t => t !== tag))}
                              className="hover:text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <TagAutocompleteInput
                          gameId={selectedGame.id}
                          value={tagInput}
                          onChange={setTagInput}
                          onAddTag={(tag) => {
                            const trimmed = tag.trim().toLowerCase();
                            if (trimmed && !noteTags.includes(trimmed)) {
                              setNoteTags(prev => [...prev, trimmed]);
                              setTagInput('');
                            }
                          }}
                          onRemoveLastTag={() => {
                            setNoteTags(prev => prev.slice(0, -1));
                          }}
                          existingTags={noteTags}
                          additionalSuggestions={globalSessionTags}
                          placeholder="Add tags (press Enter)..."
                          className="bg-transparent border-none focus:ring-0 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none flex-1 py-1"
                        />
                      </div>
                      <motion.button 
                        layoutId="save-note-btn"
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        type="submit"
                        onMouseDown={(e) => e.preventDefault()}
                        disabled={!noteInput.trim() || isSubmittingNote}
                        className="bg-zinc-100 text-zinc-950 px-6 h-[48px] rounded-2xl font-bold hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shrink-0"
                      >
                        {isSubmittingNote ? (
                          <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-5 h-5" />
                            <span className="hidden sm:inline">Save</span>
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.form>
          </div>
        </LayoutGroup>
      </div>
        </>
        )}
        </div>
      </div>

      {/* Right Column: Trackers */}
      <div id="mobile-tab-trackers" className="w-full shrink-0 snap-center snap-always lg:w-[320px] flex-col lg:border-l border-zinc-800/50 min-h-0 flex relative">
        <div className="w-full flex flex-col h-full min-h-0 flex-1 relative z-10">
        <div className="flex items-center justify-between px-5 lg:px-6 pt-5 pb-5 z-10">
          <div className="flex items-center gap-3 text-zinc-100 cursor-pointer group" onClick={() => {
            setIsTrackersCollapsed(!isTrackersCollapsed);
            if (isTrackersCollapsed) {
              setCollapsedTrackerGroups(new Set());
            }
          }}>
            <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center border border-indigo-500/20">
              <Target className="w-4 h-4 text-indigo-400" />
            </div>
            <h2 className="text-lg font-normal tracking-[.016em] group-hover:text-zinc-300 transition-colors">Trackers</h2>
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsAddingMetric(true); setIsTrackersCollapsed(false); }}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all focus:scale-95 border border-zinc-800/50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 lg:px-6 flex flex-col pb-24 lg:pb-0">
          <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isTrackersCollapsed ? 'grid-rows-[0fr] opacity-0 pointer-events-none' : 'grid-rows-[1fr] opacity-100'}`}>
            <div className="overflow-hidden min-h-0 p-2 -m-2">
              <div className="space-y-6 pb-20">
          {(() => {
            let metrics = activeSession.metrics || [];
            
            // Backend migration test for Acme Gaming
            if (selectedGame.title === 'Acme Gaming') {
              const acmeMetrics: SessionMetric[] = [];
              const trackers = activeSession.trackers || [];
              
              trackers.forEach(tracker => {
                tracker.items.forEach(item => {
                  if (typeof item === 'string') {
                    acmeMetrics.push({
                      id: `${tracker.id}::${item}`,
                      title: item,
                      group: tracker.title,
                      measurementType: 'checkbox',
                      completed: false
                    });
                  } else {
                    let mt: any = 'checkbox';
                    if (item.quantifierType === 'stepper') mt = 'visual_counter';
                    if (item.quantifierType === 'progress') mt = 'progress';
                    if (item.quantifierType === 'none') mt = 'none';
                    
                    acmeMetrics.push({
                      id: item.id,
                      title: item.title,
                      description: item.description,
                      group: tracker.title === 'General' ? undefined : tracker.title,
                      measurementType: mt,
                      currentCount: item.currentValue,
                      targetCount: item.maxValue,
                      currentValue: item.currentValue,
                      maxValue: item.maxValue,
                      completed: item.completed
                    });
                  }
                });
                
                // Add an empty item if the tracker has no items so the group still exists?
                // Actually the old UI didn't show empty groups unless there was a metric in it.
              });
              
              metrics = acmeMetrics;
            }
            
            // Group metrics
            const groupedMetrics: Record<string, typeof metrics> = {};
            const ungroupedMetrics: typeof metrics = [];
            
            metrics.forEach(m => {
              if (m.group) {
                if (!groupedMetrics[m.group]) groupedMetrics[m.group] = [];
                groupedMetrics[m.group].push(m);
              } else {
                ungroupedMetrics.push(m);
              }
            });

            if (metrics.length === 0 && (!activeSession.trackers || activeSession.trackers.length === 0) && !anySessionHasTrackers) {
              return (
                <div className="md:col-span-full w-full py-12 px-6 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl text-center animate-in fade-in zoom-in-95 duration-700">
                  <div className="w-12 h-12 bg-zinc-900/50 rounded-xl flex items-center justify-center mb-4 mx-auto">
                    <LayoutDashboard className="w-6 h-6 text-zinc-600" />
                  </div>
                  <h4 className="text-sm font-bold text-zinc-300 mb-2">Stay Quantified</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed mb-6">
                    Track your health, collectibles, deaths, or any other numeric goal in real-time.
                  </p>
                </div>
              );
            }

            return (
              <>
                {ungroupedMetrics.map(metric => (
                  <MetricCard 
                    key={metric.id}
                    metric={metric}
                    onUpdate={handleUpdateMetric}
                    onDelete={() => setMetricToDelete({ id: metric.id, title: metric.title, type: 'metric' })}
                    onEdit={setEditingMetricId}
                    onView={setViewingMetricId}
                  />
                ))}
                
                {Object.entries(groupedMetrics)
                  .sort((a, b) => {
                    const aPinned = a[1].some(m => m.isGroupPinnedToTop);
                    const bPinned = b[1].some(m => m.isGroupPinnedToTop);
                    if (aPinned && !bPinned) return -1;
                    if (!aPinned && bPinned) return 1;
                    return 0;
                  })
                  .map(([groupName, groupMetrics]) => {
                  const isGroupCollapsed = collapsedTrackerGroups.has(groupName);
                  return (
                  <div key={groupName} className="bg-zinc-950/30 border border-zinc-800/50 rounded-2xl p-2 space-y-1 md:col-span-full xl:col-auto">
                    <div 
                      onClick={(e) => toggleTrackerGroup(groupName, e)}
                      className={`flex items-center justify-between px-2 py-1.5 cursor-pointer hover:bg-zinc-900/30 rounded-lg transition-colors group/header ${isGroupCollapsed ? 'mb-0' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {isGroupCollapsed ? (
                          <ChevronRight className="w-3.5 h-3.5 text-zinc-600 transition-colors group-hover/header:text-zinc-500" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-zinc-600 transition-colors group-hover/header:text-zinc-500" />
                        )}
                        <h4 className="text-[11px] font-normal text-zinc-400 uppercase tracking-widest transition-colors group-hover/header:text-zinc-300">{groupName}</h4>
                      </div>
                    </div>
                    <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isGroupCollapsed ? 'grid-rows-[0fr] opacity-0 pointer-events-none' : 'grid-rows-[1fr] opacity-100'}`}>
                      <div className="overflow-hidden min-h-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2 lg:flex lg:flex-col lg:space-y-1 lg:gap-0 lg:pt-1">
                          {groupMetrics.map(metric => (
                            <MetricCard 
                              key={metric.id}
                              metric={metric}
                              onUpdate={handleUpdateMetric}
                              onDelete={() => setMetricToDelete({ id: metric.id, title: metric.title, type: 'metric' })}
                              onEdit={setEditingMetricId}
                              onView={setViewingMetricId}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )})}
              </>
            );
          })()}

          {isAddingMetric ? (
            <div className="md:col-span-full lg:col-auto w-full mt-2 lg:mt-0">
              <AddMetricForm 
                onAddMetric={handleAddMetric}
                onCancel={() => setIsAddingMetric(false)}
                onSuccess={(id) => {
                  setIsAddingMetric(false);
                  setEditingMetricId(id);
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => setIsAddingMetric(true)}
              className="md:col-span-full lg:col-auto w-full py-3 px-4 rounded-xl border border-dashed border-zinc-700/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900/50 transition-all flex items-center justify-center gap-2 mt-2 lg:mt-0"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-wider">New Tracker</span>
            </button>
          )}

          {activeSession.trackers?.length && selectedGame.title !== 'Acme Gaming' ? (
            <div className="md:col-span-full lg:col-auto mt-8 border-t border-zinc-800 pt-6 space-y-4 w-full">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-normal text-zinc-500 uppercase tracking-widest">Legacy Trackers</h4>
                <button
                  onClick={handleMigrateLegacyTrackers}
                  className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  Migrate to New Format
                </button>
              </div>
              {activeSession.trackers.map(tracker => (
                <TrackerCard 
                  key={tracker.id}
                  tracker={tracker}
                  onAddItem={handleAddTrackerItem}
                  onUpdateItem={handleUpdateTrackerItem}
                  onRemoveItem={handleRemoveTrackerItem}
                  onUpdateTracker={handleUpdateTracker}
                  onDeleteTracker={() => setMetricToDelete({ id: tracker.id, title: tracker.title, type: 'legacy' })}
                  onViewItem={(trackerId, item) => setViewingTrackerItem({ trackerId, trackerTitle: tracker.title, item })}
                  itemSuggestions={trackerItemSuggestions[tracker.title] || []}
                />
              ))}
              <AddTrackerMenu onAddTracker={handleAddTracker} existingTrackers={existingTrackerTitles} />
            </div>
          ) : null}
              </div>
            </div>
          </div>
          
          {/* Always render tags module */}
          <div className="hidden lg:block lg:flex-1 min-h-[0px]"></div>
          <div className="space-y-4 w-full md:col-span-2 lg:col-span-1 border-zinc-800 lg:border-t-0 mt-6 lg:mt-auto">
            <div className="flex items-center gap-2 text-zinc-400">
              <TagIcon className="w-4 h-4 text-zinc-600" />
              <h3 className="font-normal uppercase tracking-widest text-xs">Session Tags</h3>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
              <div className="p-3 bg-zinc-900 border-b border-zinc-800">
                <TagAutocompleteInput
                  gameId={selectedGame?.id || null}
                  value={sessionTagInput}
                  onChange={setSessionTagInput}
                  onAddTag={(tag) => {
                    if (!activeSession) return;
                    const trimmed = tag.trim().toLowerCase();
                    if (trimmed && !activeSessionTags.includes(trimmed)) {
                      handleUpdateSessionTags(activeSession.id, [...activeSessionTags, trimmed]);
                      setSessionTagInput('');
                    }
                  }}
                  existingTags={allSessionTagsList}
                  additionalSuggestions={globalSessionTags}
                  placeholder="Add a tag..."
                  className="bg-transparent border-none focus:ring-0 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none w-full"
                />
              </div>
              <div className="p-5 flex-1 relative flex flex-col">
                {allSessionTagsList.length > 0 ? (
                  <div className="relative">
                    <div 
                      ref={tagsContainerRef}
                      className={cn(
                        "flex flex-wrap gap-2 transition-[max-height] duration-300 ease-in-out overflow-hidden relative p-2 -m-2",
                        isTagsExpanded ? "max-h-[1000px]" : "max-h-[104px]"
                      )}
                    >
                      {allSessionTagsList.map((tag) => (
                        <SessionTagItem
                          key={tag}
                          tag={tag}
                          count={tagCounts[tag] || 0}
                          setFilteredTag={setFilteredTag}
                          scrollToTab={scrollToTab}
                          handleDeleteSessionTag={handleDeleteSessionTag}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-xl text-left">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Pro Tip</p>
                    <p className="text-[11px] text-zinc-400 italic">"Use tags like #boss or #quest to stay organized! Add them below and drag to notes."</p>
                  </div>
                )}
                {/* Expand toggle */}
                {showTagsExpandButton && (
                  <div className="flex justify-center mt-3">
                    <button 
                      onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/50 hover:border-zinc-700 rounded-full transition-all text-zinc-400 hover:text-zinc-300 group"
                    >
                       <span className="text-[10px] font-bold uppercase tracking-widest">{isTagsExpanded ? 'Show Less' : `Show All (${allSessionTagsList.length})`}</span>
                       <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", isTagsExpanded && "rotate-180")} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

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
        onClick={() => navigateTo('note-editor')}
        className="lg:hidden fixed right-6 bottom-[66px] w-14 h-14 bg-zinc-100 text-zinc-950 rounded-full shadow-2xl flex items-center justify-center z-40 active:scale-90 transition-transform"
      >
        <Plus className="w-8 h-8" />
      </button>

      {editingMetricId && activeSession.metrics?.find(m => m.id === editingMetricId) && (
        <EditMetricModal
          metric={activeSession.metrics.find(m => m.id === editingMetricId)!}
          existingGroups={Array.from(new Set((activeSession.metrics || []).map(m => m.group).filter(Boolean) as string[]))}
          onUpdate={handleUpdateMetric}
          onClose={() => setEditingMetricId(null)}
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

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
