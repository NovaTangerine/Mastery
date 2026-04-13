import React, { useRef, useEffect, useState } from 'react';
import { Plus, BookOpen, Clock, PenLine, X, Send, ChevronRight, Trash2, List, LayoutDashboard, ChevronUp, ChevronDown, Tag as TagIcon } from 'lucide-react';
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
    sessionGroups,
    handleCreateSessionGroup,
    handleUpdateSessionGroup,
    handleDeleteSessionGroup,
    handleUpdateSessionGroupMembership,
  } = useGameContext();

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
  } = useNotes(selectedGame?.id || null, activeSession?.id || null);

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
  const [selectedSessionIdsForGroup, setSelectedSessionIdsForGroup] = useState<Set<string>>(new Set());
  const [isCreatingGroupFromList, setIsCreatingGroupFromList] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [activeMobileTab, setActiveMobileTab] = useState<'sessions' | 'notes' | 'trackers'>('notes');
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<{id: string, title: string} | null>(null);

  const [isInputFocused, setIsInputFocused] = useState(false);
  const [noteTags, setNoteTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToTab = (tab: 'sessions' | 'notes' | 'trackers') => {
    setActiveMobileTab(tab);
    if (window.innerWidth >= 1024) return;
    const index = ['sessions', 'notes', 'trackers'].indexOf(tab);
    if (scrollContainerRef.current) {
      const width = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollTo({ left: index * width, behavior: 'smooth' });
    }
  };

  const handleHorizontalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (window.innerWidth >= 1024) return;
    const container = e.currentTarget;
    const scrollLeft = container.scrollLeft;
    const width = container.clientWidth;
    if (width === 0) return;
    const index = Math.round(scrollLeft / width);
    const tabs = ['sessions', 'notes', 'trackers'] as const;
    if (tabs[index] && activeMobileTab !== tabs[index]) {
      setActiveMobileTab(tabs[index]);
    }
  };

  useEffect(() => {
    if (window.innerWidth < 1024 && scrollContainerRef.current) {
      const index = ['sessions', 'notes', 'trackers'].indexOf(activeMobileTab);
      const width = scrollContainerRef.current.clientWidth;
      scrollContainerRef.current.scrollLeft = index * width;
    }
  }, []);

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

    await handleUpdateSessionDetails(sessionNameInput, sessionChapterInput, sessionHoursInput, finalGroupId);
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
      onScroll={handleHorizontalScroll}
      className="flex-1 min-h-0 pb-[58px] sm:pb-[58px] lg:pb-0 flex flex-row overflow-x-auto snap-x snap-mandatory lg:overflow-x-visible lg:snap-none justify-start lg:justify-center gap-0 lg:gap-4 sm:lg:gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative scrollbar-hide"
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

      {/* Sidebar for Sessions */}
      <div className="w-full shrink-0 snap-center lg:w-72 flex-col lg:border-r border-zinc-800/50 lg:pr-6 min-h-0 flex">
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

        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
          {groupedSessions.map(group => {
            const isCollapsed = collapsedGroups.has(group.id);
            return (
            <div key={group.id} className="space-y-2">
              <div 
                className="flex items-center justify-between px-2 group/header cursor-pointer hover:bg-zinc-900/50 rounded py-1 -mx-2"
                onClick={(e) => {
                  // Don't toggle if clicking on buttons or inputs
                  const target = e.target as HTMLElement;
                  if (target.closest('button') || target.closest('input')) return;
                  toggleGroupCollapse(group.id);
                }}
              >
                <div className="flex items-center gap-2 flex-1">
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                  )}
                  {editingGroupId === group.id ? (
                    <input
                      type="text"
                      value={editingGroupTitle}
                      onChange={(e) => setEditingGroupTitle(e.target.value)}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-xs font-bold text-zinc-100 focus:outline-none focus:border-zinc-600"
                      autoFocus
                    />
                  ) : (
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{group.title}</h4>
                  )}
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
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
                      >
                        <PenLine className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingGroupId(null)}
                        className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingGroupId(group.id);
                          setEditingGroupTitle(group.title);
                          setSelectedSessionIdsForGroup(new Set(group.sessions.map(s => s.id)));
                        }}
                        className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded"
                      >
                        <PenLine className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setGroupToDelete({ id: group.id, title: group.title });
                        }}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-zinc-800 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {!isCollapsed && (
                <div className="space-y-2">
                  {group.sessions.map(session => (
                    <div key={session.id} className="flex items-center gap-2">
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
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-zinc-600 focus:ring-offset-zinc-950"
                        />
                      )}
                      <button
                        onClick={() => {
                          handleResumeSession(session);
                          scrollToTab('notes');
                        }}
                        className={`flex-1 text-left p-3 rounded-xl transition-all ${activeSession.id === session.id ? 'bg-zinc-800 border border-zinc-700' : 'bg-transparent hover:bg-zinc-900 border border-transparent'}`}
                      >
                        <p className={`font-bold text-sm truncate ${activeSession.id === session.id ? 'text-zinc-100' : 'text-zinc-400'}`}>{session.name || session.progressMarker}</p>
                        <p className="text-zinc-500 text-[10px] mt-1">{format(session.startTime, 'MMM d, yyyy')}</p>
                      </button>
                    </div>
                  ))}
                  {group.sessions.length === 0 && (
                    <p className="text-xs text-zinc-600 italic px-2">No sessions in this group</p>
                  )}
                </div>
              )}
            </div>
          )})}

          {ungroupedSessions.length > 0 && (
            <div className="space-y-2">
              {groupedSessions.length > 0 && (
                <div 
                  className="flex items-center justify-between px-2 mt-4 cursor-pointer hover:bg-zinc-900/50 rounded py-1 -mx-2"
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
                </div>
              )}
              {!collapsedGroups.has('ungrouped') && (
                <div className="space-y-2">
                  {ungroupedSessions.map(session => (
                    <div key={session.id} className="flex items-center gap-2">
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
                          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-zinc-600 focus:ring-offset-zinc-950"
                        />
                      )}
                      <button
                        onClick={() => {
                          handleResumeSession(session);
                          scrollToTab('notes');
                        }}
                        className={`flex-1 text-left p-3 rounded-xl transition-all ${activeSession.id === session.id ? 'bg-zinc-800 border border-zinc-700' : 'bg-transparent hover:bg-zinc-900 border border-transparent'}`}
                      >
                        <p className={`font-bold text-sm truncate ${activeSession.id === session.id ? 'text-zinc-100' : 'text-zinc-400'}`}>{session.name || session.progressMarker}</p>
                        <p className="text-zinc-500 text-[10px] mt-1">{format(session.startTime, 'MMM d, yyyy')}</p>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Session View */}
      <div className="w-full shrink-0 snap-center lg:flex-1 lg:max-w-2xl flex-col min-w-0 min-h-0 flex">
        {/* Compact Session Header */}
        <div 
          className="mb-3 sm:mb-6 bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-3 sm:p-4 shrink-0 flex flex-col transition-all duration-300"
          onMouseEnter={() => setIsHeaderCollapsed(false)}
        >
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold truncate">
              {activeSession.name || activeSession.progressMarker}
            </h2>
            
            <div className="flex items-center gap-2">
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

          <div className={`flex flex-col overflow-hidden transition-all duration-300 ${isHeaderCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100 mt-1 sm:mt-2'}`}>
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
            <div className={`mt-4 pt-4 border-t border-zinc-800/50 animate-in fade-in slide-in-from-top-2 duration-200 ${isHeaderCollapsed ? 'hidden' : ''}`}>
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
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 bg-zinc-900/50 rounded-full flex items-center justify-center mb-4">
                <PenLine className="w-8 h-8 text-zinc-700" />
              </div>
              <h3 className="text-xl font-bold text-zinc-400 mb-2">No notes yet</h3>
              <p className="text-zinc-600 max-w-sm">
                Start typing below to add your first note for this session. Notes will appear here.
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
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        if (tagInput.trim() && !noteTags.includes(tagInput.trim())) {
                          setNoteTags(prev => [...prev, tagInput.trim()]);
                          setTagInput('');
                        }
                      } else if (e.key === 'Backspace' && !tagInput && noteTags.length > 0) {
                        setNoteTags(prev => prev.slice(0, -1));
                      }
                    }}
                    placeholder="Add tags (press Enter)..."
                    className="bg-transparent border-none focus:ring-0 text-sm text-zinc-300 placeholder:text-zinc-600 outline-none w-48"
                  />
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Right Column: Trackers */}
      <div className="w-full shrink-0 snap-center lg:w-80 flex-col lg:border-l border-zinc-800/50 lg:pl-6 min-h-0 flex">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold uppercase tracking-widest text-xs text-zinc-400">Trackers</h3>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-col gap-4 items-start lg:items-stretch content-start">
          {activeSession.trackers?.map(tracker => (
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

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
