import React from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'motion/react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { 
  Tag as TagIcon, 
  X, 
  Check, 
  PenLine, 
  Clock, 
  Minus, 
  Plus, 
  ChevronDown 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { SortableNote } from '../SortableNote';
import { TagAutocompleteInput } from '../TagAutocompleteInput';
import { Game, GameSession } from '../../types';

export interface NotesFeedProps {
  selectedGame: Game;
  activeSession: GameSession;
  filteredTag: string | null;
  setFilteredTag: React.Dispatch<React.SetStateAction<string | null>>;
  filterScope: 'session' | 'global';
  setFilterScope: React.Dispatch<React.SetStateAction<'session' | 'global'>>;
  filteredNotesBySession: Record<string, any[]>;
  activeMobileTab: 'sessions' | 'notes' | 'trackers';
  getSessionName: (sessionId: string | null) => string;
  handleUpdateNote: any;
  handleDeleteNote: any;
  handleAddTag: any;
  handleRemoveTag: any;
  handleRenameTag?: (oldTag: string, newTag: string) => Promise<void> | void;
  handleDeleteTagGlobally?: (tag: string) => Promise<void> | void;
  taggingStatus: any;
  handleRetryTagging: any;
  availableSessions: any[];
  handleMoveNote: any;
  globalNotesForTag: any[];
  isEditingSessionDetails: boolean;
  setIsEditingSessionDetails: React.Dispatch<React.SetStateAction<boolean>>;
  isEditingTitleInline: boolean;
  setIsEditingTitleInline: React.Dispatch<React.SetStateAction<boolean>>;
  inlineTitleInput: string;
  setInlineTitleInput: React.Dispatch<React.SetStateAction<string>>;
  handleUpdateSessionDetails: any;
  prevHoursPlayed: number;
  decimalToHoursStr: (v: any) => string;
  hoursStrToDecimalStr: (v: any) => string;
  sessionNameInput: string;
  setSessionNameInput: React.Dispatch<React.SetStateAction<string>>;
  sessionChapterInput: string;
  setSessionChapterInput: React.Dispatch<React.SetStateAction<string>>;
  sessionHoursInput: string;
  setSessionHoursInput: React.Dispatch<React.SetStateAction<string>>;
  totalHoursInput: string;
  setTotalHoursInput: React.Dispatch<React.SetStateAction<string>>;
  sessionGroupIdInput: string | undefined;
  setSessionGroupIdInput: React.Dispatch<React.SetStateAction<string | undefined>>;
  isCreatingNewGroup: boolean;
  setIsCreatingNewGroup: React.Dispatch<React.SetStateAction<boolean>>;
  newGroupNameInput: string;
  setNewGroupNameInput: React.Dispatch<React.SetStateAction<string>>;
  sessionGroups: any[];
  saveSessionDetails: () => Promise<void>;
  parentRef: React.RefObject<HTMLDivElement | null>;
  sessionNotes: any[];
  notesLimit: number;
  loadMoreNotes: () => void;
  hasCreatedAnyNote: boolean;
  sensors: any;
  handleDragEnd: any;
  notesEndRef: React.RefObject<HTMLDivElement | null>;
  noteInputContainerRef: React.RefObject<HTMLDivElement | null>;
  isInputFocused: boolean;
  setIsInputFocused: React.Dispatch<React.SetStateAction<boolean>>;
  noteInput: string;
  setNoteInput: React.Dispatch<React.SetStateAction<string>>;
  submitNote: (e?: React.FormEvent) => Promise<void>;
  noteTags: string[];
  setNoteTags: React.Dispatch<React.SetStateAction<string[]>>;
  tagInput: string;
  setTagInput: React.Dispatch<React.SetStateAction<string>>;
  globalSessionTags: string[];
  isSubmittingNote: boolean;
}

export function NotesFeed(props: NotesFeedProps) {
  const {
    selectedGame,
    activeSession,
    filteredTag,
    setFilteredTag,
    filterScope,
    setFilterScope,
    filteredNotesBySession,
    activeMobileTab,
    getSessionName,
    handleUpdateNote,
    handleDeleteNote,
    handleAddTag,
    handleRemoveTag,
    handleRenameTag,
    handleDeleteTagGlobally,
    taggingStatus,
    handleRetryTagging,
    availableSessions,
    handleMoveNote,
    globalNotesForTag,
    isEditingSessionDetails,
    setIsEditingSessionDetails,
    isEditingTitleInline,
    setIsEditingTitleInline,
    inlineTitleInput,
    setInlineTitleInput,
    handleUpdateSessionDetails,
    prevHoursPlayed,
    decimalToHoursStr,
    hoursStrToDecimalStr,
    sessionNameInput,
    setSessionNameInput,
    sessionChapterInput,
    setSessionChapterInput,
    sessionHoursInput,
    setSessionHoursInput,
    totalHoursInput,
    setTotalHoursInput,
    sessionGroupIdInput,
    setSessionGroupIdInput,
    isCreatingNewGroup,
    setIsCreatingNewGroup,
    newGroupNameInput,
    setNewGroupNameInput,
    sessionGroups,
    saveSessionDetails,
    parentRef,
    sessionNotes,
    notesLimit,
    loadMoreNotes,
    hasCreatedAnyNote,
    sensors,
    handleDragEnd,
    notesEndRef,
    noteInputContainerRef,
    isInputFocused,
    setIsInputFocused,
    noteInput,
    setNoteInput,
    submitNote,
    noteTags,
    setNoteTags,
    tagInput,
    setTagInput,
    globalSessionTags,
    isSubmittingNote
  } = props;

  return (
    <div 
      id="mobile-tab-notes" 
      className={cn(
        "col-start-1 row-start-1 flex w-full h-full lg:h-auto shrink-0 lg:flex-1 lg:max-w-3xl xl:max-w-4xl flex-col min-w-0 min-h-0 transition-transform duration-300 ease-out lg:!transform-none",
        activeMobileTab === 'notes' ? "z-10" : "z-0 pointer-events-none lg:pointer-events-auto"
      )}
      style={{ transform: `translateX(${(1 - ['sessions', 'notes', 'trackers'].indexOf(activeMobileTab)) * 100}%)` }}
    >
      <div className="w-full mx-auto flex flex-col h-full min-h-0 flex-1 pt-4 lg:pt-0">
        {filteredTag ? (
          <>
            <div className="mb-3 sm:mb-6 bg-zinc-900 border border-zinc-700/50 rounded-2xl p-4 mx-4 sm:mx-6 lg:mx-8 shrink-0 flex items-center justify-between shadow-lg mt-4 lg:mt-6">
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

            <div 
              className="flex-1 overflow-y-auto custom-scrollbar"
              style={{
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0px, rgba(0,0,0,1) 120px)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0px, rgba(0,0,0,1) 120px)'
              }}
            >
              {Object.entries(filteredNotesBySession)
                .filter(([sid]) => filterScope === 'global' ? true : sid === (activeSession?.id || 'global'))
                .map(([sessionId, groupNotes]) => (
                  <div key={sessionId} className="flex flex-col">
                    <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur pb-2 pt-1 border-y border-zinc-800/50 px-4 sm:px-6 lg:px-8 bg-zinc-900/20">
                      <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">{getSessionName(sessionId === 'global' ? null : sessionId)}</h3>
                    </div>
                    <div className="flex flex-col gap-0 divide-y divide-zinc-800/50">
                      {groupNotes.map(note => (
                        <div key={note.id} className="relative">
                          <SortableNote 
                            note={note}
                            onUpdate={handleUpdateNote}
                            onDelete={handleDeleteNote}
                            onAddTag={handleAddTag}
                            onRemoveTag={handleRemoveTag}
                            onRenameTag={handleRenameTag}
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
            <div className={`grid transition-[grid-template-rows,margin,opacity] duration-300 ease-in-out lg:!grid-rows-[1fr] lg:!opacity-100 lg:!mb-0 lg:!pointer-events-auto ${isEditingSessionDetails ? 'grid-rows-[1fr] opacity-100 mb-0 pointer-events-auto' : 'grid-rows-[0fr] opacity-0 mb-0 pointer-events-none'}`}>
              <div className="overflow-hidden min-h-0 border-b border-zinc-800/50">
                <div className="px-4 py-4 sm:px-6 lg:px-8 flex flex-col shrink-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 min-w-0 group/title flex-1">
                      {isEditingTitleInline ? (
                        <div className="flex items-center gap-1 w-full max-w-md bg-zinc-900 border border-zinc-700 focus-within:border-zinc-500 rounded-lg pr-0.5 shadow-sm overflow-hidden">
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
                            className="text-xl font-medium bg-transparent px-3 py-1.5 focus:outline-none w-full text-white"
                          />
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (inlineTitleInput.trim() && inlineTitleInput !== (activeSession.name || activeSession.progressMarker)) {
                                await handleUpdateSessionDetails(inlineTitleInput.trim(), activeSession.chapter || '', activeSession.hoursPlayed ? activeSession.hoursPlayed.toString() : '', activeSession.groupId);
                              }
                              setIsEditingTitleInline(false);
                            }}
                            className="p-2 text-zinc-400 hover:text-green-400 hover:bg-zinc-800 transition-colors shrink-0"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsEditingTitleInline(false);
                            }}
                            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors shrink-0"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          className="flex items-center gap-2 cursor-pointer group/heading w-full min-w-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInlineTitleInput(activeSession.name || activeSession.progressMarker);
                            setIsEditingTitleInline(true);
                          }}
                          title="Edit Session Title"
                        >
                          <h2 className="text-xl font-medium truncate border-b border-transparent group-hover/heading:border-zinc-700 transition-colors pb-0.5 text-white">
                            {activeSession.name || activeSession.progressMarker}
                          </h2>
                          <PenLine className="w-4 h-4 text-zinc-500 opacity-100 sm:opacity-0 sm:group-hover/title:opacity-100 transition-opacity shrink-0" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-3 text-zinc-400 text-xs flex-wrap mr-1">
                        {(activeSession.hoursPlayed !== undefined && activeSession.hoursPlayed !== null) && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Clock className="w-3.5 h-3.5 text-zinc-500" />
                            <span className="text-zinc-300">
                              {decimalToHoursStr(Math.max(0, activeSession.hoursPlayed - prevHoursPlayed))} hrs
                            </span>
                            {(activeSession.hoursPlayed > 0 && activeSession.hoursPlayed > prevHoursPlayed) ? (
                              <span className="text-zinc-500 text-xs ml-1">({decimalToHoursStr(activeSession.hoursPlayed)} Total)</span>
                            ) : null}
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
                          }
                        }}
                        className="p-1.5 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors shrink-0"
                      >
                        {isEditingSessionDetails ? <X className="w-4 h-4" /> : <PenLine className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className={`grid transition-all duration-300 ease-in-out border-zinc-800/50 ${isEditingSessionDetails ? 'grid-rows-[1fr] opacity-100 mt-3 pt-3 sm:mt-4 sm:pt-4 border-t' : 'grid-rows-[0fr] opacity-0 pointer-events-none mt-0 pt-0 border-t-0'}`}>
                    <div className="overflow-hidden min-h-0">
                      <div className="flex flex-col w-full max-w-sm mx-auto gap-4 sm:gap-5 pt-4 pb-6 sm:py-4">
                        <div className="flex flex-col justify-end space-y-1.5">
                          <div className="flex items-center justify-between min-h-[16px]">
                            <label className="text-[11px] font-normal text-zinc-500 uppercase tracking-[.072em]">Session Hours</label>
                            {totalHoursInput && (
                              <span className="text-[10px] text-zinc-500">
                                ({totalHoursInput} total)
                              </span>
                            )}
                          </div>
                          <div className="relative flex items-center h-[42px] bg-zinc-950 border border-zinc-800 focus-within:border-zinc-600 rounded-xl transition-colors">
                            <button 
                              type="button"
                              onClick={() => {
                                 const current = parseFloat(hoursStrToDecimalStr(sessionHoursInput || '0')) || 0;
                                 const next = Math.max(0, current - 0.25);
                                 setSessionHoursInput(decimalToHoursStr(next));
                                 setTotalHoursInput(decimalToHoursStr(prevHoursPlayed + next));
                              }}
                              className="absolute left-1.5 w-7 h-7 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <input
                              type="text"
                              value={sessionHoursInput}
                              onChange={(e) => {
                                setSessionHoursInput(e.target.value);
                                const parsed = parseFloat(hoursStrToDecimalStr(e.target.value));
                                if (!isNaN(parsed)) {
                                  setTotalHoursInput(decimalToHoursStr(prevHoursPlayed + parsed));
                                } else if (e.target.value === '') {
                                  setTotalHoursInput('');
                                }
                              }}
                              placeholder="0:00"
                              className="w-full text-center bg-transparent px-10 text-[16px] sm:text-sm focus:outline-none text-white"
                            />
                            <button 
                              type="button"
                              onClick={() => {
                                 const current = parseFloat(hoursStrToDecimalStr(sessionHoursInput || '0')) || 0;
                                 const next = current + 0.25;
                                 setSessionHoursInput(decimalToHoursStr(next));
                                 setTotalHoursInput(decimalToHoursStr(prevHoursPlayed + next));
                              }}
                              className="absolute right-1.5 w-7 h-7 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col justify-end space-y-1.5">
                          <div className="flex items-center min-h-[16px]">
                            <label className="text-[11px] font-normal text-zinc-500 uppercase tracking-[.072em]">Session Group</label>
                          </div>
                          {!isCreatingNewGroup ? (
                            <div className="relative">
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
                                className="w-full h-[42px] bg-zinc-950 border border-zinc-800 rounded-xl pl-3 pr-10 text-[16px] sm:text-sm focus:outline-none focus:border-zinc-600 transition-colors appearance-none text-white"
                              >
                                <option value="">None</option>
                                {sessionGroups.map(group => (
                                  <option key={group.id} value={group.id}>{group.title}</option>
                                ))}
                                <option value="new">+ Create New Group</option>
                              </select>
                              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 h-[42px]">
                              <input
                                type="text"
                                value={newGroupNameInput}
                                onChange={(e) => setNewGroupNameInput(e.target.value)}
                                placeholder="New Group Name"
                                className="flex-1 h-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 text-[16px] sm:text-sm focus:outline-none focus:border-zinc-600 transition-colors text-white"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  setIsCreatingNewGroup(false);
                                  setNewGroupNameInput('');
                                }}
                                className="w-[42px] h-[42px] flex items-center justify-center shrink-0 text-zinc-400 hover:text-zinc-100 rounded-xl hover:bg-zinc-800 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-3 pt-3 sm:mt-4 sm:pt-4 border-t border-zinc-800/50 w-full max-w-sm mx-auto">
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
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Feed List */}
            <div 
              ref={parentRef} 
              className="flex-1 overflow-y-auto pr-2 custom-scrollbar"
              style={{
                maskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0px, rgba(0,0,0,1) 120px)',
                WebkitMaskImage: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0px, rgba(0,0,0,1) 120px)'
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
                hasCreatedAnyNote ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in-95 duration-700">
                    <p className="text-zinc-600 text-sm font-medium italic">
                      No notes yet. Start typing below.
                    </p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in-95 duration-700">
                    <div className="w-16 h-16 bg-zinc-900/50 rounded-2xl flex items-center justify-center mb-6 rotate-3">
                      <PenLine className="w-8 h-8 text-zinc-500" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-100 mb-3">Your Journey Begins</h3>
                    <p className="text-zinc-500 max-w-xs text-sm leading-relaxed mb-8">
                      Every great adventure deserves to be remembered. Start typing below to capture your first thought, discovery, or strategy.
                    </p>
                  </div>
                )
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
                    <div className="w-full flex flex-col gap-0 divide-y divide-zinc-800/50 border-t border-zinc-800/50 mt-2 lg:mt-0">
                      {sessionNotes.map((note) => (
                        <div key={note.id} className="w-full">
                          <SortableNote 
                            note={note}
                            onUpdate={handleUpdateNote}
                            onDelete={handleDeleteNote}
                            onAddTag={handleAddTag}
                            onRemoveTag={handleRemoveTag}
                            onRenameTag={handleRenameTag}
                            taggingStatus={taggingStatus[note.id]}
                            onRetryTagging={handleRetryTagging}
                            onTagClick={setFilteredTag}
                            availableSessions={availableSessions}
                            onMoveNote={(targetSessionId) => handleMoveNote(note.id, targetSessionId === 'global' ? null : targetSessionId)}
                          />
                        </div>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
              <div ref={notesEndRef} />
            </div>

            {/* Input Area */}
            <div className="shrink-0 bg-zinc-950 pt-2 hidden lg:block px-4 sm:px-6 lg:px-8 pb-4 lg:pb-8">
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
                                <span key={tag} className="px-2 py-0.5 bg-zinc-800 border border-zinc-700/50 text-zinc-300 text-[10px] font-mono font-medium uppercase tracking-wide rounded-md flex items-center gap-1 transition-colors has-[button:hover]:!bg-red-500/15 has-[button:hover]:!border-red-500/30 has-[button:hover]:!text-red-400">
                                  #{tag.replace(/^#/, '')}
                                  <button 
                                    type="button"
                                    onClick={() => setNoteTags(prev => prev.filter(t => t !== tag))}
                                    className="text-zinc-400 hover:text-red-400 transition-colors"
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
  );
}
