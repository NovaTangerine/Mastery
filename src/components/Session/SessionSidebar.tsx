import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { 
  List, 
  ArrowUpDown, 
  LayoutDashboard, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  PenLine, 
  X, 
  MoreVertical, 
  Trash2 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Game, GameSession, SessionGroup } from '../../types';

// Helper utilities
export const decimalToHoursStr = (decimalVal?: number | null | string): string => {
  if (decimalVal === undefined || decimalVal === null || decimalVal === '') return '';
  const val = typeof decimalVal === 'string' ? parseFloat(decimalVal) : decimalVal;
  if (isNaN(val)) return '';
  const h = Math.floor(val);
  const m = Math.round((val - h) * 60);
  return `${h}:${m.toString().padStart(2, '0')}`;
};

export const hoursStrToDecimalStr = (valStr: string): string => {
  if (!valStr) return '';
  if (valStr.includes(':')) {
    const parts = valStr.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const val = h + m / 60;
    return val.toFixed(2);
  }
  const floatVal = parseFloat(valStr);
  return isNaN(floatVal) ? '' : floatVal.toFixed(2);
};

export function SidebarSessionItem({ session, ctx }: { session: GameSession, ctx: any }) {
  const {
    activeMenuId, activeMenuType, setActiveMenuId, setActiveMenuType,
    editingGroupId, selectedSessionIdsForGroup, setSelectedSessionIdsForGroup,
    editingSidebarSessionId, setEditingSidebarSessionId,
    editingSidebarSessionName, setEditingSidebarSessionName,
    handleUpdateSessionDetails, handleResumeSession, scrollToTab,
    getSessionNotesCount, setSessionToDelete, activeSession, sessions
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
          className="w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-zinc-100 focus:ring-zinc-600 focus:ring-offset-zinc-950 shrink-0 self-center"
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
            <p className={`font-semibold text-sm line-clamp-1 mb-0.5 ${activeSession?.id === session.id ? 'bg-gradient-to-r from-white to-zinc-500 text-transparent bg-clip-text' : 'text-zinc-300'}`}>
              {session.name || session.progressMarker || 'Unnamed Session'}
            </p>
            <div className="flex items-center gap-3">
              <span className={`text-xs ${activeSession?.id === session.id ? 'text-zinc-300' : 'text-zinc-500'}`}>
                {format(session.startTime, 'MMM d, yyyy')}
              </span>
              {(session.hoursPlayed !== undefined && session.hoursPlayed !== null) && (
                <span className={`text-xs font-medium ${activeSession?.id === session.id ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {decimalToHoursStr(session.hoursPlayed)} hrs
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

export interface SessionSidebarProps {
  selectedGame: Game | null;
  sessions: GameSession[];
  sessionGroups: SessionGroup[];
  activeSession: GameSession | null;
  activeMobileTab: 'sessions' | 'notes' | 'trackers';
  sessionSortOrder: 'asc' | 'desc';
  setSessionSortOrder: React.Dispatch<React.SetStateAction<'asc' | 'desc'>>;
  isCreatingGroupFromList: boolean;
  setIsCreatingGroupFromList: React.Dispatch<React.SetStateAction<boolean>>;
  newGroupNameInput: string;
  setNewGroupNameInput: React.Dispatch<React.SetStateAction<string>>;
  handleCreateSessionGroup: (title: string) => Promise<any>;
  handleUpdateSessionGroup: (id: string, title: string) => Promise<void>;
  handleUpdateSessionGroupMembership: (id: string, sessionIds: string[]) => Promise<void>;
  handleDeleteSessionGroup: (id: string) => Promise<void>;
  isEligibleForGameOnboarding: boolean;
  groupedSessions: any[];
  collapsedGroups: Set<string>;
  toggleGroupCollapse: (groupId: string) => void;
  activeTappedId: string | null;
  setActiveTappedId: React.Dispatch<React.SetStateAction<string | null>>;
  activeMenuId: string | null;
  setActiveMenuId: React.Dispatch<React.SetStateAction<string | null>>;
  activeMenuType: 'group' | 'session' | null;
  setActiveMenuType: React.Dispatch<React.SetStateAction<'group' | 'session' | null>>;
  editingGroupId: string | null;
  setEditingGroupId: React.Dispatch<React.SetStateAction<string | null>>;
  editingGroupTitle: string;
  setEditingGroupTitle: React.Dispatch<React.SetStateAction<string>>;
  selectedSessionIdsForGroup: Set<string>;
  setSelectedSessionIdsForGroup: React.Dispatch<React.SetStateAction<Set<string>>>;
  editingSidebarSessionId: string | null;
  setEditingSidebarSessionId: React.Dispatch<React.SetStateAction<string | null>>;
  editingSidebarSessionName: string;
  setEditingSidebarSessionName: React.Dispatch<React.SetStateAction<string>>;
  wrappedHandleStartSession: (groupId?: string) => void;
  wrappedHandleResumeSession: (session: any) => void;
  scrollToTab: (tab: 'sessions' | 'notes' | 'trackers') => void;
  getSessionNotesCount: (sessionId: string) => Promise<number>;
  setSessionToDelete: React.Dispatch<React.SetStateAction<any>>;
  setGroupToDelete: React.Dispatch<React.SetStateAction<any>>;
  ungroupedSessions: GameSession[];
  handleUpdateSessionDetails: any;
}

export function SessionSidebar(props: SessionSidebarProps) {
  const {
    selectedGame,
    sessions,
    sessionGroups,
    activeSession,
    activeMobileTab,
    sessionSortOrder,
    setSessionSortOrder,
    isCreatingGroupFromList,
    setIsCreatingGroupFromList,
    newGroupNameInput,
    setNewGroupNameInput,
    handleCreateSessionGroup,
    handleUpdateSessionGroup,
    handleUpdateSessionGroupMembership,
    isEligibleForGameOnboarding,
    groupedSessions,
    collapsedGroups,
    toggleGroupCollapse,
    activeTappedId,
    setActiveTappedId,
    activeMenuId,
    setActiveMenuId,
    activeMenuType,
    setActiveMenuType,
    editingGroupId,
    setEditingGroupId,
    editingGroupTitle,
    setEditingGroupTitle,
    selectedSessionIdsForGroup,
    setSelectedSessionIdsForGroup,
    editingSidebarSessionId,
    setEditingSidebarSessionId,
    editingSidebarSessionName,
    setEditingSidebarSessionName,
    wrappedHandleStartSession,
    wrappedHandleResumeSession,
    scrollToTab,
    getSessionNotesCount,
    setSessionToDelete,
    setGroupToDelete,
    ungroupedSessions,
    handleUpdateSessionDetails
  } = props;

  return (
    <div 
      id="mobile-tab-sessions" 
      className={cn(
        "col-start-1 row-start-1 flex group/sidebar w-full h-full lg:h-auto shrink-0 lg:w-[320px] flex-col lg:border-r border-zinc-800/50 min-h-0 relative transition-transform duration-300 ease-out lg:!transform-none",
        activeMobileTab === 'sessions' ? "z-10" : "z-0 pointer-events-none lg:pointer-events-auto"
      )}
      style={{ transform: `translateX(${(0 - ['sessions', 'notes', 'trackers'].indexOf(activeMobileTab)) * 100}%)` }}
    >
      <div className="w-full flex flex-col h-full min-h-0 flex-1 relative z-10">
        <div className="flex items-center justify-between px-5 lg:px-6 pt-5 pb-5 z-10">
          <div className="flex items-center gap-3 text-zinc-100 hidden lg:flex">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-900 text-zinc-400 border border-zinc-800/50 shadow-sm">
              <List className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-normal tracking-[.016em]">Sessions</h2>
          </div>
          <h3 className="font-normal uppercase tracking-[.072em] text-xs text-zinc-400 lg:hidden">Sessions</h3>
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
                wrappedHandleStartSession();
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
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[16px] sm:text-sm focus:outline-none focus:border-zinc-600 transition-colors"
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
            {isEligibleForGameOnboarding && !selectedGame?.dismissedSessionBanner && sessions.length === 1 && sessions[0].id === activeSession?.id && (
              <div className="relative px-2 py-4 mb-2 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-700 pr-8">
                <button 
                  onClick={async () => {
                    if (!selectedGame) return;
                    try {
                      const { doc, updateDoc } = await import('firebase/firestore');
                      const { db } = await import('../../firebase');
                      await updateDoc(doc(db, 'games', selectedGame.id), {
                        dismissedSessionBanner: true,
                        updatedAt: Date.now()
                      });
                    } catch (err) {
                      console.error('Failed to dismiss banner', err);
                    }
                  }}
                  className="absolute top-3 right-3 text-indigo-400/50 hover:text-indigo-400 transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[.072em] mb-1">Getting Started</p>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  This is your first session! As you play more, your history will build up here.
                </p>
              </div>
            )}
            {groupedSessions.map(group => {
              const isCollapsed = collapsedGroups.has(group.id);
              const isGroupTapped = activeTappedId === group.id;
              return (
                <div key={group.id} className={`bg-zinc-950/30 border border-zinc-800/50 rounded-2xl p-2 flex flex-col group relative ${(activeMenuId === group.id && activeMenuType === 'group') || (activeMenuType === 'session' && group.sessions.some((s: any) => s.id === activeMenuId)) ? 'z-50' : 'z-10'}`}>
                  <div 
                    className={`flex items-center justify-between px-2 py-[2px] cursor-pointer transition-colors group/header ${activeMenuId === group.id && activeMenuType === 'group' ? 'bg-zinc-900/30 rounded-lg' : 'hover:bg-zinc-900/30 rounded-lg'}`}
                    onClick={(e) => {
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
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <h4 className="text-[11px] font-normal text-zinc-400 uppercase tracking-[.072em] transition-colors group-hover/header:text-zinc-300 truncate">{group.title}</h4>
                      )}
                    </div>
                    
                    <div className={`flex items-center gap-0.5 transition-opacity shrink-0 bg-zinc-950/80 rounded-md px-1 ${(activeMenuId === group.id && activeMenuType === 'group') || isGroupTapped ? 'opacity-100' : 'opacity-0 lg:group-hover/header:opacity-100'}`}>
                      {editingGroupId === group.id ? (
                        <>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
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
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingGroupId(null);
                            }}
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
                              wrappedHandleStartSession(group.id);
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
                                    wrappedHandleStartSession(group.id);
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
                                    setSelectedSessionIdsForGroup(new Set(group.sessions.map((s: any) => s.id)));
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
                      (activeMenuType === 'session' && group.sessions.some((s: any) => s.id === activeMenuId)) ? "overflow-visible" : "overflow-hidden"
                    )}>
                      <div className="grid grid-cols-1 gap-1 pt-[10px]">
                        {group.sessions.map((session: any) => {
                          const sessionContext = {
                            activeMenuId, activeMenuType, setActiveMenuId, setActiveMenuType,
                            editingGroupId, selectedSessionIdsForGroup, setSelectedSessionIdsForGroup,
                            editingSidebarSessionId, setEditingSidebarSessionId,
                            editingSidebarSessionName, setEditingSidebarSessionName,
                            handleUpdateSessionDetails, handleResumeSession: wrappedHandleResumeSession, scrollToTab,
                            getSessionNotesCount, setSessionToDelete, activeSession, sessions
                          };
                          return <SidebarSessionItem key={session.id} session={session} ctx={sessionContext} />;
                        })}
                        {group.sessions.length > 0 && (
                          <div className={`grid transition-all duration-200 ease-in-out ${isGroupTapped ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] lg:group-hover:grid-rows-[1fr]'}`}>
                            <div className="overflow-hidden">
                              <button
                                onClick={() => wrappedHandleStartSession(group.id)}
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
              );
            })}

            {ungroupedSessions.length > 0 && (() => {
              const isGroupTapped = activeTappedId === 'ungrouped';
              const isWrapped = groupedSessions.length > 0;
              return (
                <div className={`flex flex-col group relative ${isWrapped ? 'bg-zinc-950/30 border border-zinc-800/50 rounded-2xl p-2' : ''} ${(activeMenuType === 'session' && ungroupedSessions.some(s => s.id === activeMenuId)) ? 'z-50' : 'z-10'}`}>
                  {groupedSessions.length > 0 && (
                    <div 
                      className={`flex items-center justify-between px-2 py-[2px] cursor-pointer transition-colors group/header ${activeMenuType === 'session' && activeMenuId === 'ungrouped' ? 'bg-zinc-900/30 rounded-lg' : 'hover:bg-zinc-900/30 rounded-lg'}`}
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
                        <h4 className="text-[11px] font-normal text-zinc-400 uppercase tracking-[.072em] transition-colors group-hover/header:text-zinc-300 truncate">Ungrouped</h4>
                      </div>
                      <div className={`flex items-center gap-0.5 transition-opacity shrink-0 bg-zinc-950/80 rounded-md px-1 ${isGroupTapped ? 'opacity-100' : 'opacity-0 lg:group-hover/header:opacity-100'}`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            wrappedHandleStartSession();
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
                      <div className="grid grid-cols-1 gap-1 pt-[10px]">
                        {ungroupedSessions.map(session => {
                          const sessionContext = {
                            activeMenuId, activeMenuType, setActiveMenuId, setActiveMenuType,
                            editingGroupId, selectedSessionIdsForGroup, setSelectedSessionIdsForGroup,
                            editingSidebarSessionId, setEditingSidebarSessionId,
                            editingSidebarSessionName, setEditingSidebarSessionName,
                            handleUpdateSessionDetails, handleResumeSession: wrappedHandleResumeSession, scrollToTab,
                            getSessionNotesCount, setSessionToDelete, activeSession, sessions
                          };
                          return <SidebarSessionItem key={session.id} session={session} ctx={sessionContext} />;
                        })}
                        {ungroupedSessions.length > 0 && groupedSessions.length > 0 && (
                          <div className={`grid transition-all duration-200 ease-in-out ${isGroupTapped ? 'grid-rows-[1fr]' : 'grid-rows-[0fr] lg:group-hover:grid-rows-[1fr]'}`}>
                            <div className="overflow-hidden">
                              <button
                                onClick={() => wrappedHandleStartSession()}
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
  );
}
