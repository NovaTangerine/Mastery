import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Target, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Tag as TagIcon,
  X,
  Edit2,
  Trash2,
  MoreVertical,
  Check
} from 'lucide-react';
import { useFloating, offset, flip, shift, autoUpdate, FloatingPortal } from '@floating-ui/react';
import { cn } from '../../lib/utils';
import { MetricCard } from '../MetricCard';
import { TrackerCard } from '../TrackerCard';
import { AddTrackerMenu } from '../AddTrackerMenu';
import { Game, GameSession, SessionMetric } from '../../types';

export function SessionTagItem({ tag, count, setFilteredTag, scrollToTab, onRequestDeleteTag, handleRenameTag }: { 
  tag: string; 
  count: number; 
  setFilteredTag: (tag: string) => void; 
  scrollToTab: (tab: any) => void;
  onRequestDeleteTag: (tag: string, count: number) => void;
  handleRenameTag?: (oldTag: string, newTag: string) => void;
}) {
  const [isBouncing, setIsBouncing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(tag.replace(/^#/, ''));
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { refs, floatingStyles } = useFloating({
    open: isMenuOpen,
    onOpenChange: setIsMenuOpen,
    middleware: [offset(4), flip(), shift({ padding: 8 })],
    whileElementsMounted: autoUpdate,
    placement: 'bottom-start'
  });

  React.useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (refs.reference.current && (refs.reference.current as HTMLElement).contains(target)) {
        return;
      }
      if (refs.floating.current && (refs.floating.current as HTMLElement).contains(target)) {
        return;
      }
      setIsMenuOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen, refs]);

  const handleSaveRename = () => {
    const trimmed = editValue.trim().toLowerCase().replace(/^#/, '');
    if (trimmed && trimmed !== tag.replace(/^#/, '')) {
      handleRenameTag?.(tag, trimmed);
    }
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div 
        className="relative flex items-center rounded-full border border-zinc-700 bg-zinc-900 px-2 h-[26px] z-30 gap-1"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-[10px] font-mono text-zinc-500 select-none">#</span>
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSaveRename();
            } else if (e.key === 'Escape') {
              setIsEditing(false);
              setEditValue(tag.replace(/^#/, ''));
            }
          }}
          autoFocus
          className="bg-transparent text-zinc-100 text-[10px] font-mono outline-none w-16 px-0.5 py-0"
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleSaveRename();
          }}
          className="text-zinc-400 hover:text-emerald-400 p-0.5 transition-colors"
          title="Save tag"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(false);
            setEditValue(tag.replace(/^#/, ''));
          }}
          className="text-zinc-400 hover:text-red-400 p-0.5 transition-colors"
          title="Cancel"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      ref={refs.setReference}
      className={cn(
        "group relative flex overflow-hidden rounded-full border border-zinc-800 bg-zinc-950 transition-colors hover:border-zinc-700 hover:bg-zinc-800 h-[26px] z-10 lg:hover:z-20 cursor-grab active:cursor-grabbing",
        isMenuOpen && "!border-zinc-600 !bg-zinc-800"
      )}
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
          <span className="text-[10px] font-mono font-medium text-zinc-400 uppercase tracking-wide transition-colors group-hover:text-zinc-300">{tag}</span>
        </div>
        
        {/* Container for Count / Ellipsis Button */}
        <div className="overflow-hidden h-full w-[26px] relative shrink-0">
          {/* Default State (Count) */}
          <div 
            className={cn(
              "absolute inset-0 flex items-center shrink-0 cursor-pointer w-full transition-opacity duration-300 group-hover:opacity-0",
              isMenuOpen && "opacity-0"
            )}
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
          
          {/* Hover State (Ellipsis Menu Button) */}
          <div className={cn(
            "absolute inset-0 flex items-center shrink-0 w-full transition-opacity duration-300 opacity-0 group-hover:opacity-100",
            isMenuOpen && "opacity-100"
          )}>
            <div className="w-4 flex items-center justify-center">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="text-zinc-500 hover:text-zinc-200 transition-colors flex items-center justify-center h-5 w-5"
                title="Tag options"
              >
                <MoreVertical className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <FloatingPortal>
        {isMenuOpen && (
          <div 
            ref={refs.setFloating}
            style={floatingStyles}
            className="min-w-[140px] w-auto bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-[9999] py-1 flex flex-col whitespace-nowrap"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsEditing(true);
                setEditValue(tag.replace(/^#/, ''));
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800 transition-colors text-left whitespace-nowrap"
            >
              <Edit2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Edit tag</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(false);
                onRequestDeleteTag(tag, count);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left border-t border-zinc-800/60 mt-0.5 pt-1.5 whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Delete tag</span>
            </button>
          </div>
        )}
      </FloatingPortal>
    </motion.div>
  );
}

export interface TrackersPanelProps {
  activeMobileTab: 'sessions' | 'notes' | 'trackers';
  activeSession: GameSession;
  selectedGame: Game;
  collapsedTrackerGroups: Set<string>;
  toggleTrackerGroup: (groupName: string, e?: React.MouseEvent) => void;
  handleAddMetric: (metric: any) => Promise<string | undefined>;
  setEditingMetricId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsEditingNewMetric: React.Dispatch<React.SetStateAction<boolean>>;
  isEligibleForTrackerOnboarding: boolean;
  handleUpdateMetric: any;
  setMetricToDelete: React.Dispatch<React.SetStateAction<any>>;
  setViewingMetricId: React.Dispatch<React.SetStateAction<string | null>>;
  handleMigrateLegacyTrackers: any;
  handleAddTrackerItem: any;
  handleUpdateTrackerItem: any;
  handleRemoveTrackerItem: any;
  handleUpdateTracker: any;
  setViewingTrackerItem: React.Dispatch<React.SetStateAction<any>>;
  trackerItemSuggestions: Record<string, string[]>;
  handleAddTracker: any;
  existingTrackerTitles: string[];
  activeSessionTags: string[];
  handleUpdateSessionTags: any;
  structuredTags: any;
  globalSessionTags: string[];
  tagsContainerRef: React.RefObject<HTMLDivElement | null>;
  isTagsExpanded: boolean;
  setIsTagsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  tagCounts: Record<string, number>;
  setFilteredTag: React.Dispatch<React.SetStateAction<string | null>>;
  scrollToTab: (tab: 'sessions' | 'notes' | 'trackers') => void;
  handleDeleteSessionTag: (tag: string, e: React.MouseEvent) => Promise<void>;
  handleRenameTag?: (oldTag: string, newTag: string) => Promise<void> | void;
  showTagsExpandButton: boolean;
}

export function TrackersPanel(props: TrackersPanelProps) {
  const {
    activeMobileTab,
    activeSession,
    selectedGame,
    collapsedTrackerGroups,
    toggleTrackerGroup,
    handleAddMetric,
    setEditingMetricId,
    setIsEditingNewMetric,
    isEligibleForTrackerOnboarding,
    handleUpdateMetric,
    setMetricToDelete,
    setViewingMetricId,
    handleMigrateLegacyTrackers,
    handleAddTrackerItem,
    handleUpdateTrackerItem,
    handleRemoveTrackerItem,
    handleUpdateTracker,
    setViewingTrackerItem,
    trackerItemSuggestions,
    handleAddTracker,
    existingTrackerTitles,
    activeSessionTags,
    handleUpdateSessionTags,
    structuredTags,
    globalSessionTags,
    tagsContainerRef,
    isTagsExpanded,
    setIsTagsExpanded,
    tagCounts,
    setFilteredTag,
    scrollToTab,
    handleDeleteSessionTag,
    handleRenameTag,
    showTagsExpandButton
  } = props;

  const [tagToDelete, setTagToDelete] = useState<{ tag: string; count: number } | null>(null);

  const handleRequestDeleteTag = async (tag: string, localCount: number) => {
    const cleanTag = tag.trim().toLowerCase().replace(/^#/, '');
    // Check total count across all notes in the game
    try {
      const { getCountFromServer, query, collection, where } = await import('firebase/firestore');
      const { db, auth } = await import('../../firebase');
      if (auth.currentUser && selectedGame?.id) {
        const q = query(
          collection(db, 'notes'),
          where('gameId', '==', selectedGame.id),
          where('uid', '==', auth.currentUser.uid),
          where('tags', 'array-contains', cleanTag)
        );
        const snapshot = await getCountFromServer(q);
        const totalCount = snapshot.data().count;
        setTagToDelete({ tag: cleanTag, count: totalCount });
        return;
      }
    } catch (err) {
      console.error('Failed to get total tag count', err);
    }
    setTagToDelete({ tag: cleanTag, count: localCount });
  };

  return (
    <div 
      id="mobile-tab-trackers" 
      className={cn(
        "col-start-1 row-start-1 flex w-full h-full lg:h-auto shrink-0 lg:w-[320px] flex-col lg:border-l border-zinc-800/50 min-h-0 relative transition-transform duration-300 ease-out lg:!transform-none",
        activeMobileTab === 'trackers' ? "z-10" : "z-0 pointer-events-none lg:pointer-events-auto"
      )}
      style={{ transform: `translateX(${(2 - ['sessions', 'notes', 'trackers'].indexOf(activeMobileTab)) * 100}%)` }}
    >
      <div className="w-full flex flex-col h-full min-h-0 flex-1 relative z-10">
        <div className="flex items-center justify-between px-5 lg:px-6 pt-5 pb-5 z-10">
          <div className="flex items-center gap-3 text-zinc-100 cursor-pointer group" onClick={() => {
            const allGroups = new Set<string>();
            if (activeSession.metrics) {
              activeSession.metrics.forEach(m => allGroups.add(m.group || 'Ungrouped'));
            }
            if (activeSession.trackers) {
              activeSession.trackers.forEach(t => allGroups.add(t.title || 'Ungrouped'));
            }
            let allCollapsed = true;
            for (const group of allGroups) {
              if (!collapsedTrackerGroups.has(group)) {
                allCollapsed = false;
                break;
              }
            }
            // Toggle groups collapsibility
            const toggledSet = new Set<string>();
            if (!allCollapsed) {
              allGroups.forEach(g => toggledSet.add(g));
            }
            // Update external collapsibles
            allGroups.forEach(g => {
              if (!allCollapsed && !collapsedTrackerGroups.has(g)) {
                toggleTrackerGroup(g);
              } else if (allCollapsed && collapsedTrackerGroups.has(g)) {
                toggleTrackerGroup(g);
              }
            });
          }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-zinc-900 text-zinc-400 group-hover:text-zinc-300 transition-colors border border-zinc-800/50 shadow-sm">
              <Target className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-normal tracking-[.016em] group-hover:text-zinc-300 transition-colors">Trackers</h2>
          </div>
          <button 
            onClick={async (e) => { 
              e.stopPropagation(); 
              const newId = await handleAddMetric({ title: '', measurementType: 'none' });
              if (newId) {
                setEditingMetricId(newId);
                setIsEditingNewMetric(true);
              }
            }}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all focus:scale-95 border border-zinc-800/50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 lg:px-6 flex flex-col pb-24 lg:pb-0">
          <div className="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out grid-rows-[1fr] opacity-100">
            <div className="overflow-hidden min-h-0 p-2 -m-2">
              <div className="space-y-6 lg:space-y-2 pb-20">
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

                  if (metrics.length === 0 && (!activeSession.trackers || activeSession.trackers.length === 0)) {
                    return !isEligibleForTrackerOnboarding ? (
                      <div className="md:col-span-full w-full py-8 text-center animate-in fade-in zoom-in-95 duration-700">
                        <p className="text-zinc-600 text-sm font-medium italic">
                          No trackers added to this session.
                        </p>
                      </div>
                    ) : (
                      <div className="md:col-span-full w-full py-12 px-6 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-3xl text-center animate-in fade-in zoom-in-95 duration-700">
                        <div className="w-12 h-12 bg-zinc-900/50 rounded-xl flex items-center justify-center mb-4 mx-auto">
                          <Target className="w-6 h-6 text-zinc-600" />
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
                            <div key={groupName} className="bg-zinc-950/30 border border-zinc-800/50 rounded-2xl p-2 md:col-span-full xl:col-auto flex flex-col">
                              <div 
                                onClick={(e) => toggleTrackerGroup(groupName, e)}
                                className="flex items-center justify-between px-2 py-[2px] cursor-pointer hover:bg-zinc-900/30 rounded-lg transition-colors group/header"
                              >
                                <div className="flex items-center gap-2">
                                  {isGroupCollapsed ? (
                                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 transition-colors group-hover/header:text-zinc-500" />
                                  ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-zinc-600 transition-colors group-hover/header:text-zinc-500" />
                                  )}
                                  <h4 className="text-[11px] font-normal text-zinc-400 uppercase tracking-[.072em] transition-colors group-hover/header:text-zinc-300">{groupName}</h4>
                                </div>
                              </div>
                              <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${isGroupCollapsed ? 'grid-rows-[0fr] opacity-0 pointer-events-none' : 'grid-rows-[1fr] opacity-100'}`}>
                                <div className="overflow-hidden min-h-0">
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2 lg:flex lg:flex-col lg:space-y-1 lg:gap-0 pt-[10px]">
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
                          );
                        })}
                    </>
                  );
                })()}

                <button
                  onClick={async () => {
                    const newId = await handleAddMetric({ title: '', measurementType: 'none' });
                    if (newId) {
                      setEditingMetricId(newId);
                      setIsEditingNewMetric(true);
                    }
                  }}
                  className="md:col-span-full lg:col-auto w-full py-3 px-4 rounded-xl border border-dashed border-zinc-700/50 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900/50 transition-all flex items-center justify-center gap-2 mt-2 lg:mt-0"
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-bold uppercase tracking-wider">New Tracker</span>
                </button>

                {activeSession.trackers?.length && selectedGame.title !== 'Acme Gaming' ? (
                  <div className="md:col-span-full lg:col-auto mt-8 border-t border-zinc-800 pt-6 space-y-4 w-full">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-xs font-normal text-zinc-500 uppercase tracking-[.072em]">Legacy Trackers</h4>
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
              <h3 className="font-normal uppercase tracking-[.072em] text-xs">Game Tags</h3>
            </div>
            
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl flex flex-col overflow-hidden">
              <div className="p-5 flex-1 relative flex flex-col">
                {structuredTags.totalTagsCount > 0 ? (
                  <div className="relative">
                    <div 
                      ref={tagsContainerRef}
                      className={cn(
                        "flex flex-wrap gap-2 transition-[max-height] duration-300 ease-in-out overflow-hidden relative p-2 -m-2",
                        isTagsExpanded ? "max-h-[5000px]" : "max-h-[148px]"
                      )}
                    >
                      {structuredTags.sessionTagsList.map((tag: string) => (
                        <SessionTagItem
                          key={tag}
                          tag={tag}
                          count={tagCounts[tag] || 0}
                          setFilteredTag={setFilteredTag}
                          scrollToTab={scrollToTab}
                          onRequestDeleteTag={handleRequestDeleteTag}
                          handleRenameTag={handleRenameTag}
                        />
                      ))}

                      {structuredTags.sessionTagsList.length > 0 && structuredTags.gameTagsList.length > 0 && (
                        <div className="w-full flex items-center gap-3 pt-2 pb-1 mt-1">
                          <div className="h-px bg-zinc-800/80 flex-1"></div>
                          <span className="text-[9px] uppercase tracking-[0.1em] text-zinc-500 font-bold">Game Tags</span>
                          <div className="h-px bg-zinc-800/80 flex-1"></div>
                        </div>
                      )}

                      {structuredTags.gameTagsByLetter.map((group: any) => (
                        <React.Fragment key={group.letter}>
                          <div className="w-full flex items-center mt-1">
                            <span className="text-[10px] font-bold text-zinc-600 w-4 shrink-0 text-center">{group.letter}</span>
                            <div className="h-px bg-zinc-800/40 flex-1 ml-2"></div>
                          </div>
                          {group.tags.map((tag: string) => (
                            <SessionTagItem
                              key={tag}
                              tag={tag}
                              count={tagCounts[tag] || 0}
                              setFilteredTag={setFilteredTag}
                              scrollToTab={scrollToTab}
                              onRequestDeleteTag={handleRequestDeleteTag}
                              handleRenameTag={handleRenameTag}
                            />
                          ))}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-zinc-900/30 border border-zinc-800/50 rounded-xl text-left">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[.072em] mb-1">Pro Tip</p>
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
                       <span className="text-[10px] font-bold uppercase tracking-[.072em]">{isTagsExpanded ? 'Show Less' : `Show All (${structuredTags.totalTagsCount})`}</span>
                       <ChevronDown className={cn("w-3.5 h-3.5 transition-transform duration-300", isTagsExpanded && "rotate-180")} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <FloatingPortal>
        {tagToDelete && (
          <div 
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setTagToDelete(null)}
          >
            <div 
              className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-zinc-100 mb-1">
                  Delete #{tagToDelete.tag}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {tagToDelete.count > 1 ? (
                    <>
                      This tag is currently used on <span className="font-semibold text-zinc-200">{tagToDelete.count} notes</span>. Deleting it will permanently remove the tag from all notes in this game.
                    </>
                  ) : tagToDelete.count === 1 ? (
                    <>
                      This tag is used on <span className="font-semibold text-zinc-200">1 note</span>. Deleting it will remove the tag from the note and your game tags.
                    </>
                  ) : (
                    <>
                      Are you sure you want to delete <span className="font-semibold text-zinc-200">#{tagToDelete.tag}</span> from your game tags?
                    </>
                  )}
                </p>
              </div>
              <div className="p-4 bg-zinc-950/50 border-t border-zinc-800/50 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setTagToDelete(null)}
                  className="px-4 py-2 text-sm font-semibold text-zinc-400 hover:text-zinc-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const tag = tagToDelete.tag;
                    setTagToDelete(null);
                    await handleDeleteSessionTag(tag, undefined as any);
                  }}
                  className="px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Tag
                </button>
              </div>
            </div>
          </div>
        )}
      </FloatingPortal>
    </div>
  );
}
