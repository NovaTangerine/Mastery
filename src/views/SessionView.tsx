import React, { useRef, useEffect, useState } from 'react';
import { Plus, BookOpen, Clock, PenLine, X, Send, ChevronRight, Trash2, List, LayoutDashboard, ChevronUp, ChevronDown, Tag as TagIcon, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'motion/react';
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

import { useGameContext } from '../contexts/GameContext';
import { useUI } from '../contexts/UIContext';
import { useNotes } from '../hooks/useNotes';
import { SortableNote } from '../components/SortableNote';
import { TrackerCard } from '../components/TrackerCard';
import { AddTrackerMenu } from '../components/AddTrackerMenu';
import { MetricCard } from '../components/MetricCard';
import { AddMetricForm } from '../components/AddMetricForm';
import { EditMetricModal } from '../components/EditMetricModal';
import { TagAutocompleteInput } from '../components/TagAutocompleteInput';
import { useVirtualizer } from '@tanstack/react-virtual';

export default function SessionView() {
  const { goBack, navigateTo } = useUI();
  const {
    selectedGame,
    sessions,
    activeSession,
    handleStartSession,
    handleResumeSession,
    handleUpdateSessionDetails,
    handleAddTracker,
    handleAddTrackerItem,
    handleUpdateTrackerItem,
    handleRemoveTrackerItem,
    handleDeleteTracker,
    handleMigrateLegacyTrackers,
    handleAddMetric,
    handleUpdateMetric,
    handleDeleteMetric,
    sessionGroups,
    handleCreateSessionGroup,
    handleUpdateSessionGroup,
    handleDeleteSessionGroup,
    handleUpdateSessionGroupMembership,
    handleDeleteSession,
    handleDeleteSessionAndShiftFocus,
    checkSessionHasNotes,
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
    handleRetryTagging
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
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [allSessionNotes]);

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
  const [isCreatingGroupFromList, setIsCreatingGroupFromList] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [activeMobileTab, setActiveMobileTab] = useState<'sessions' | 'notes' | 'trackers'>('notes');
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<{id: string, title: string} | null>(null);

  const [isInputFocused, setIsInputFocused] = useState(false);
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isEditingTitleInline, setIsEditingTitleInline] = useState(false);
  const [inlineTitleInput, setInlineTitleInput] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState<{ id: string, name: string, hasNotes: boolean } | null>(null);
  const [editingSidebarSessionId, setEditingSidebarSessionId] = useState<string | null>(null);
  const [editingSidebarSessionName, setEditingSidebarSessionName] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [activeMenuType, setActiveMenuType] = useState<'group' | 'session' | null>(null);

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
        setSessionHoursInput(activeSession.hoursPlayed ? activeSession.hoursPlayed.toString() : '');
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

  const parentRef = useRef<HTMLDivElement>(null);
  const notesEndRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollY = e.currentTarget.scrollTop;
    if (currentScrollY > lastScrollY.current && currentScrollY > 20 && !isHeaderCollapsed) {
      setIsHeaderCollapsed(true);
    } else if (currentScrollY < 10 && isHeaderCollapsed) {
      setIsHeaderCollapsed(false);
    }
    lastScrollY.current = currentScrollY;
  };

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

    await handleUpdateSessionDetails(sessionNameInput, sessionChapterInput, sessionHoursInput, finalGroupId === undefined ? '' : finalGroupId);
    setIsEditingSessionDetails(false);
    setIsCreatingNewGroup(false);
    setNewGroupNameInput('');
  };

  const groupedSessions = sessionGroups.map(group => ({
    ...group,
    sessions: sessions.filter(s => s.groupId === group.id)
  }));

  const ungroupedSessions = sessions.filter(s => !s.groupId);

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 min-h-0 pb-[58px] sm:pb-[58px] lg:pb-0 flex flex-row overflow-x-auto snap-x snap-mandatory lg:overflow-x-visible lg:snap-none justify-start lg:justify-center gap-12 lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative scrollbar-hide"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {groupToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-4">Delete "{groupToDelete.title}"?</h3>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              Are you sure you want to delete this group? Sessions will be ungrouped.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => {
                  handleDeleteSessionGroup(groupToDelete.id);
                  setGroupToDelete(null);
                }}
                className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-bold hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
              <button 
                onClick={() => setGroupToDelete(null)}
                className="flex-1 bg-zinc-800 text-zinc-100 py-3 rounded-2xl font-bold hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {sessionToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-bold mb-4">Delete Session?</h3>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              Are you sure you want to delete the session "{sessionToDelete.name}"?
              <br/><br/>
              <span className="text-red-400 font-bold">Warning:</span> Because this session has notes, deleting it will also permanently delete all its notes.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={async () => {
                  if (sessionToDelete) {
                    setSessionToDelete(null); // Close modal first for better UX
                    await handleDeleteSessionAndShiftFocus(sessionToDelete.id);
                  }
                }}
                className="flex-1 bg-red-600 text-white py-3 rounded-2xl font-bold hover:bg-red-500 transition-colors"
              >
                Delete Session
              </button>
              <button 
                onClick={() => setSessionToDelete(null)}
                className="flex-1 bg-zinc-800 text-zinc-100 py-3 rounded-2xl font-bold hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar for Sessions */}
      <div id="mobile-tab-sessions" className="w-full shrink-0 snap-center snap-always lg:w-72 flex-col lg:border-r border-zinc-800/50 lg:pr-6 min-h-0 flex">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold uppercase tracking-widest text-xs text-zinc-400">Sessions</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsCreatingGroupFromList(true)}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
              title="New Group"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
            <button 
              onClick={() => {
                handleStartSession();
                scrollToTab('notes');
              }}
              className="p-1.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
              title="New Session"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {isCreatingGroupFromList && (
          <div className="mb-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-3">
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

        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 pb-24">
          {sessions.length === 1 && sessions[0].id === activeSession.id && (
            <div className="px-2 py-4 mb-2 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-700">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Getting Started</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                This is your first session! As you play more, your history will build up here.
              </p>
            </div>
          )}
          {groupedSessions.map(group => {
            const isCollapsed = collapsedGroups.has(group.id);
            return (
            <div key={group.id} className={`space-y-2 group relative ${(activeMenuId === group.id && activeMenuType === 'group') || (activeMenuType === 'session' && group.sessions.some(s => s.id === activeMenuId)) ? 'z-50' : 'z-10'}`}>
              <div 
                className="flex items-center justify-between px-2 cursor-pointer hover:bg-zinc-900/50 rounded py-1 -mx-2"
                onClick={(e) => {
                  // Don't toggle if clicking on buttons or inputs
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || target.closest('input')) return;
                  toggleGroupCollapse(group.id);
                }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
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
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider truncate">{group.title}</h4>
                  )}
                </div>
                
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 bg-zinc-950/80 rounded-md px-1">
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
                <div className={(activeMenuType === 'session' && group.sessions.some(s => s.id === activeMenuId)) ? "overflow-visible" : "overflow-hidden"}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2 pt-1">
                    {group.sessions.map(session => (
                    <div key={session.id} className={`flex items-stretch gap-2 relative group/session ${activeMenuId === session.id && activeMenuType === 'session' ? 'z-50' : 'z-10'}`}>
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
                          className={`flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm font-bold focus:outline-none focus:border-zinc-600 min-w-0 ${activeSession.id === session.id ? 'text-zinc-100' : 'text-zinc-400'}`}
                        />
                      ) : (
                        <button
                          onClick={() => {
                            handleResumeSession(session);
                            scrollToTab('notes');
                          }}
                          className={`flex-1 text-left p-3 rounded-xl transition-all min-w-0 h-full flex flex-col justify-center border ${activeSession.id === session.id ? 'bg-zinc-800 border-zinc-600 shadow-sm' : 'bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/80 hover:border-zinc-700'}`}
                        >
                          <p className={`font-bold text-sm truncate pr-14 ${activeSession.id === session.id ? 'text-zinc-100' : 'text-zinc-400'}`}>{session.name || session.progressMarker}</p>
                          <p className={`text-[10px] mt-1 ${activeSession.id === session.id ? 'text-zinc-400' : 'text-zinc-500'}`}>{format(session.startTime, 'MMM d, yyyy')}</p>
                        </button>
                      )}
                      
                      {editingSidebarSessionId !== session.id && editingGroupId === null && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/session:opacity-100 transition-opacity bg-zinc-900/90 rounded px-1 group-hover/session:visible invisible">
                          <div className="relative flex items-center">
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
                              className={`p-1 rounded ${activeMenuId === session.id && activeMenuType === 'session' ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}
                              title="More Options"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            {activeMenuId === session.id && activeMenuType === 'session' && (
                              <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50 py-1" onClick={(e) => e.stopPropagation()}>
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
                                    const hasNotes = await checkSessionHasNotes(session.id);
                                    if (hasNotes) {
                                      setSessionToDelete({ id: session.id, name: session.name || session.progressMarker, hasNotes: true });
                                    } else {
                                      await handleDeleteSessionAndShiftFocus(session.id);
                                    }
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
                        </div>
                      )}
                    </div>
                  ))}
                  {group.sessions.length > 0 && (
                    <div className="md:col-span-2 lg:col-span-1 grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-200 ease-in-out">
                      <div className="overflow-hidden">
                        <button
                          onClick={() => handleStartSession(group.id)}
                          className="w-full text-left p-2 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 h-10"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold uppercase tracking-wider">New Session</span>
                        </button>
                      </div>
                    </div>
                  )}
                  {group.sessions.length === 0 && (
                    <p className="text-xs text-zinc-600 italic px-2 md:col-span-2 lg:col-span-1">No sessions in this group</p>
                  )}
                  </div>
                </div>
              </div>
            </div>
          )})}

          {ungroupedSessions.length > 0 && (
            <div className="space-y-2 group">
              {groupedSessions.length > 0 && (
                <div 
                  className="flex items-center justify-between px-2 mt-4 cursor-pointer hover:bg-zinc-900/50 rounded py-1 -mx-2 group/ungrouped"
                  onClick={() => toggleGroupCollapse('ungrouped')}
                >
                  <div className="flex items-center gap-2">
                    {collapsedGroups.has('ungrouped') ? (
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                    )}
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Ungrouped</h4>
                  </div>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover/ungrouped:opacity-100 transition-opacity shrink-0 bg-zinc-950/80 rounded-md px-1">
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
                <div className={(activeMenuType === 'session' && ungroupedSessions.some(s => s.id === activeMenuId)) ? "overflow-visible" : "overflow-hidden"}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2 pt-1">
                    {ungroupedSessions.map(session => (
                    <div key={session.id} className={`flex items-stretch gap-2 relative group/session ${activeMenuId === session.id && activeMenuType === 'session' ? 'z-50' : 'z-10'}`}>
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
                          className={`flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-2 text-sm font-bold focus:outline-none focus:border-zinc-600 min-w-0 ${activeSession.id === session.id ? 'text-zinc-100' : 'text-zinc-400'}`}
                        />
                      ) : (
                        <button
                          onClick={() => {
                            handleResumeSession(session);
                            scrollToTab('notes');
                          }}
                          className={`flex-1 text-left p-3 rounded-xl transition-all min-w-0 h-full flex flex-col justify-center border ${activeSession.id === session.id ? 'bg-zinc-800 border-zinc-600 shadow-sm' : 'bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/80 hover:border-zinc-700'}`}
                        >
                          <p className={`font-bold text-sm truncate pr-14 ${activeSession.id === session.id ? 'text-zinc-100' : 'text-zinc-400'}`}>{session.name || session.progressMarker}</p>
                          <p className={`text-[10px] mt-1 ${activeSession.id === session.id ? 'text-zinc-400' : 'text-zinc-500'}`}>{format(session.startTime, 'MMM d, yyyy')}</p>
                        </button>
                      )}

                      {editingSidebarSessionId !== session.id && editingGroupId === null && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/session:opacity-100 transition-opacity bg-zinc-900/90 rounded px-1 group-hover/session:visible invisible">
                          <div className="relative flex items-center">
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
                              className={`p-1 rounded ${activeMenuId === session.id && activeMenuType === 'session' ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'}`}
                              title="More Options"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                            {activeMenuId === session.id && activeMenuType === 'session' && (
                              <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50 py-1" onClick={(e) => e.stopPropagation()}>
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
                                    const hasNotes = await checkSessionHasNotes(session.id);
                                    if (hasNotes) {
                                      setSessionToDelete({ id: session.id, name: session.name || session.progressMarker, hasNotes: true });
                                    } else {
                                      await handleDeleteSessionAndShiftFocus(session.id);
                                    }
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
                        </div>
                      )}
                    </div>
                  ))}
                  {ungroupedSessions.length > 0 && groupedSessions.length > 0 && (
                     <div className="md:col-span-2 lg:col-span-1 grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-all duration-200 ease-in-out">
                       <div className="overflow-hidden">
                         <button
                           onClick={() => handleStartSession()}
                           className="w-full text-left p-2 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 h-10"
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
          )}
        </div>
      </div>

      {/* Main Session View or Filtered View */}
      <div id="mobile-tab-notes" className="w-full shrink-0 snap-center snap-always lg:flex-1 lg:max-w-2xl flex-col min-w-0 min-h-0 flex">
        <div className="w-full md:max-w-2xl lg:max-w-none mx-auto flex flex-col h-full min-h-0 flex-1">
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

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
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
          onMouseEnter={() => setIsHeaderCollapsed(false)}
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
            
            <div className="flex items-center gap-2 shrink-0">
              <button 
                onClick={goBack}
                className="hidden sm:block px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors shrink-0 text-center"
              >
                End Session
              </button>
              <button 
                onClick={() => setIsHeaderCollapsed(!isHeaderCollapsed)}
                className="p-1.5 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
              >
                {isHeaderCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className={`hidden lg:flex flex-col overflow-hidden transition-all duration-300 ${isHeaderCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100 mt-1 sm:mt-2'}`}>
            <div className="flex flex-col gap-2 sm:gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex flex-row items-center justify-start gap-4 w-full">
                <div className="flex items-center gap-3 text-zinc-400 text-xs flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    Live
                  </div>
                  {activeSession.chapter && (
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className="truncate max-w-[100px] sm:max-w-none">{activeSession.chapter}</span>
                    </div>
                  )}
                  {activeSession.hoursPlayed && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-zinc-500" />
                      {activeSession.hoursPlayed} hrs
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
                      setSessionHoursInput(activeSession.hoursPlayed ? activeSession.hoursPlayed.toString() : '');
                      setSessionGroupIdInput(activeSession.groupId);
                      setIsEditingSessionDetails(true);
                    }
                  }}
                  className="p-1.5 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
                >
                  {isEditingSessionDetails ? <X className="w-4 h-4" /> : <PenLine className="w-4 h-4" />}
                </button>
              </div>
              
              <button 
                onClick={goBack}
                className="sm:hidden w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors shrink-0 text-center"
              >
                End Session
              </button>
            </div>
          </div>

          {isEditingSessionDetails && (
            <div className={`mt-0 pt-0 lg:mt-4 lg:pt-4 border-t-0 lg:border-t border-zinc-800/50 animate-in fade-in slide-in-from-top-2 duration-200 ${isHeaderCollapsed ? 'hidden' : ''}`}>
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
                  <input
                    type="number"
                    step="0.1"
                    value={sessionHoursInput}
                    onChange={(e) => setSessionHoursInput(e.target.value)}
                    placeholder="e.g. 2.5"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
                  />
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
          onScroll={handleScroll}
          onMouseEnter={() => {
            if (parentRef.current && parentRef.current.scrollTop > 20) {
              setIsHeaderCollapsed(true);
            }
          }}
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
              <div className="flex flex-col gap-3 w-full max-w-[240px]">
                <div className="p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-xl text-left">
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Pro Tip</p>
                  <p className="text-[11px] text-zinc-400 italic">"Use tags like #boss or #quest to stay organized!"</p>
                </div>
              </div>
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
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-3xl p-2 shadow-2xl transition-all duration-300 focus-within:border-zinc-700 hover:border-zinc-700"
            onFocus={() => setIsInputFocused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget)) {
                setIsInputFocused(false);
              }
            }}
          >
            <form onSubmit={submitNote} className="flex flex-col gap-2">
              <div className="flex gap-2 items-end">
                <textarea 
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Type a note about your experience..."
                  rows={1}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-zinc-100 px-4 py-3 placeholder:text-zinc-600 outline-none transition-all duration-300 resize-none h-[48px] hover:h-[120px] focus:h-[120px] custom-scrollbar"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      submitNote();
                    }
                  }}
                />
                <button 
                  type="submit"
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
                </button>
              </div>
              
              {isInputFocused && (
                <div className="px-4 pb-2 flex flex-wrap items-center gap-2 border-t border-zinc-800/50 pt-2 mt-1">
                  <TagIcon className="w-4 h-4 text-zinc-500" />
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
                    placeholder="Add tags (press Enter)..."
                    className="bg-transparent border-none focus:ring-0 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none w-48"
                  />
                </div>
              )}
            </form>
          </div>
        </div>
        </>
        )}
        </div>
      </div>

      {/* Right Column: Trackers */}
      <div id="mobile-tab-trackers" className="w-full shrink-0 snap-center snap-always lg:w-80 flex-col lg:border-l border-zinc-800/50 lg:pl-6 min-h-0 flex">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold uppercase tracking-widest text-xs text-zinc-400">Trackers</h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-col gap-4 items-start lg:items-stretch content-start pb-20">
          {(() => {
            const metrics = activeSession.metrics || [];
            
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

            if (metrics.length === 0 && (!activeSession.trackers || activeSession.trackers.length === 0)) {
              return (
                <div className="w-full py-12 px-6 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl text-center animate-in fade-in zoom-in-95 duration-700">
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
                    onDelete={handleDeleteMetric}
                    onEdit={setEditingMetricId}
                  />
                ))}
                
                {Object.entries(groupedMetrics).map(([groupName, groupMetrics]) => (
                  <div key={groupName} className="space-y-3">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1 mt-2">{groupName}</h4>
                    <div className="space-y-3">
                      {groupMetrics.map(metric => (
                        <MetricCard 
                          key={metric.id}
                          metric={metric}
                          onUpdate={handleUpdateMetric}
                          onDelete={handleDeleteMetric}
                          onEdit={setEditingMetricId}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </>
            );
          })()}

          {isAddingMetric ? (
            <AddMetricForm 
              onAddMetric={handleAddMetric}
              onCancel={() => setIsAddingMetric(false)}
              onSuccess={(id) => {
                setIsAddingMetric(false);
                setEditingMetricId(id);
              }}
            />
          ) : (
            <button
              onClick={() => setIsAddingMetric(true)}
              className="w-full py-3 px-4 rounded-xl border border-dashed border-zinc-700/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900/50 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-bold uppercase tracking-wider">New Tracker</span>
            </button>
          )}

          {activeSession.trackers?.length ? (
            <div className="mt-8 border-t border-zinc-800 pt-6 space-y-4">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Legacy Trackers</h4>
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
                  onDeleteTracker={handleDeleteTracker}
                />
              ))}
              <AddTrackerMenu onAddTracker={handleAddTracker} />
            </div>
          ) : null}
          
          {tagCounts.length > 0 && (
            <div className="mt-4 lg:mt-8 space-y-4 w-full md:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 text-zinc-400">
                <TagIcon className="w-4 h-4 text-zinc-600" />
                <h3 className="font-bold uppercase tracking-widest text-xs">Session Tags</h3>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-5">
                <div className="flex flex-wrap gap-2">
                  {tagCounts.map(([tag, count]) => (
                    <button 
                      key={tag}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/x-game-log-tag', tag);
                        e.dataTransfer.effectAllowed = 'copy';
                        
                        // Create a custom drag image that looks like the tag
                        const dragPreview = e.currentTarget.cloneNode(true) as HTMLElement;
                        dragPreview.style.position = 'absolute';
                        dragPreview.style.top = '-1000px';
                        dragPreview.style.opacity = '0.7';
                        dragPreview.style.pointerEvents = 'none';
                        document.body.appendChild(dragPreview);
                        e.dataTransfer.setDragImage(dragPreview, 0, 0);
                        setTimeout(() => document.body.removeChild(dragPreview), 0);
                      }}
                      onClick={() => {
                        setFilteredTag(tag);
                        scrollToTab('notes');
                      }}
                      className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg flex items-center gap-2 group hover:border-zinc-700 hover:bg-zinc-800 transition-colors animate-in fade-in cursor-grab active:cursor-grabbing"
                    >
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter group-hover:text-zinc-300">{tag}</span>
                      <span className="text-[10px] font-mono text-zinc-600 bg-zinc-900 px-1.5 py-0.5 rounded group-hover:bg-zinc-950">{count}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
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

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
