import React, { createContext, useContext, useState } from 'react';
import { ViewMode, Game, GameSession } from '../types';

interface UIContextType {
  view: ViewMode;
  history: { view: ViewMode, gameId: string | null, sessionId: string | null, igdbId: number | null, state: any }[];
  selectedGameId: string | null;
  activeSessionId: string | null;
  selectedIgdbId: number | null;
  viewState: any;
  navigateTo: (newView: ViewMode, game?: Game | null, session?: GameSession | null, igdbId?: number | null, state?: any) => void;
  goBack: () => void;
  clearHistory: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [history, setHistory] = useState<{ view: ViewMode, gameId: string | null, sessionId: string | null, igdbId: number | null, state: any }[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedIgdbId, setSelectedIgdbId] = useState<number | null>(null);
  const [viewState, setViewState] = useState<any>(null);

  const navigateTo = (newView: ViewMode, game?: Game | null, session?: GameSession | null, igdbId?: number | null, state?: any) => {
    const newGameId = game !== undefined ? (game?.id || null) : selectedGameId;
    const newSessionId = session !== undefined ? (session?.id || null) : activeSessionId;
    const newIgdbId = igdbId !== undefined ? igdbId : selectedIgdbId;

    if (view !== newView || selectedGameId !== newGameId || selectedIgdbId !== newIgdbId || viewState !== state) {
      setHistory(prev => [...prev, { view, gameId: selectedGameId, sessionId: activeSessionId, igdbId: selectedIgdbId, state: viewState }]);
    }
    setView(newView);
    if (game !== undefined) setSelectedGameId(game?.id || null);
    if (session !== undefined) setActiveSessionId(session?.id || null);
    if (igdbId !== undefined) setSelectedIgdbId(igdbId);
    setViewState(state !== undefined ? state : null);
  };

  const goBack = () => {
    if (history.length === 0) {
      setView('dashboard');
      setSelectedGameId(null);
      setActiveSessionId(null);
      setSelectedIgdbId(null);
      setViewState(null);
      return;
    }

    const last = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setView(last.view);
    setSelectedGameId(last.gameId);
    setActiveSessionId(last.sessionId);
    setSelectedIgdbId(last.igdbId);
    setViewState(last.state);
  };

  const clearHistory = () => setHistory([]);

  return (
    <UIContext.Provider value={{
      view,
      history,
      selectedGameId,
      activeSessionId,
      selectedIgdbId,
      viewState,
      navigateTo,
      goBack,
      clearHistory
    }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
