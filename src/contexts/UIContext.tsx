import React, { createContext, useContext, useState } from 'react';
import { ViewMode, Game, GameSession } from '../types';

interface UIContextType {
  view: ViewMode;
  history: { view: ViewMode, gameId: string | null, sessionId: string | null }[];
  selectedGameId: string | null;
  activeSessionId: string | null;
  navigateTo: (newView: ViewMode, game?: Game | null, session?: GameSession | null) => void;
  goBack: () => void;
  clearHistory: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [history, setHistory] = useState<{ view: ViewMode, gameId: string | null, sessionId: string | null }[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  const navigateTo = (newView: ViewMode, game?: Game | null, session?: GameSession | null) => {
    const newGameId = game !== undefined ? (game?.id || null) : selectedGameId;
    const newSessionId = session !== undefined ? (session?.id || null) : activeSessionId;

    if (view !== newView || selectedGameId !== newGameId) {
      setHistory(prev => [...prev, { view, gameId: selectedGameId, sessionId: activeSessionId }]);
    }
    setView(newView);
    if (game !== undefined) setSelectedGameId(game?.id || null);
    if (session !== undefined) setActiveSessionId(session?.id || null);
  };

  const goBack = () => {
    if (history.length === 0) {
      setView('dashboard');
      setSelectedGameId(null);
      setActiveSessionId(null);
      return;
    }

    const last = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setView(last.view);
    setSelectedGameId(last.gameId);
    setActiveSessionId(last.sessionId);
  };

  const clearHistory = () => setHistory([]);

  return (
    <UIContext.Provider value={{
      view,
      history,
      selectedGameId,
      activeSessionId,
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
