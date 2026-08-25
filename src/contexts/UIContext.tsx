import React, { createContext, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ViewMode, Game, GameSession } from '../types';

interface UIContextType {
  view: ViewMode;
  history: { view: ViewMode, gameId: string | null, sessionId: string | null, igdbId: number | null, state: any }[];
  selectedGameId: string | null;
  activeSessionId: string | null;
  selectedIgdbId: number | null;
  viewState: any;
  defaultTagVisibility: boolean;
  setDefaultTagVisibility: (v: boolean) => void;
  navigateTo: (newView: ViewMode, game?: Game | null, session?: GameSession | null, igdbId?: number | null, state?: any) => void;
  goBack: () => void;
  clearHistory: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

// Helper to map view mode string to path
export function getPathFromView(
  newView: ViewMode, 
  gameId?: string | null, 
  igdbId?: number | null
): string {
  if (newView === 'dashboard') return '/';
  if (newView === 'session-view' || newView === 'game-detail') {
    return gameId ? `/game/${gameId}` : '/';
  }
  if (newView === 'profile') return '/profile';
  if (newView === 'home') return '/home';
  if (newView === 'all-insights') return '/insights';
  if (newView === 'all-notes') return '/notes';
  if (newView === 'note-editor') return '/notes/edit';
  if (newView === 'igdb-game') {
    return igdbId ? `/igdb/${igdbId}` : '/';
  }
  // Any other mockup view
  return `/mockups/${newView}`;
}

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [defaultTagVisibility, setDefaultTagVisibility] = React.useState<boolean>(() => {
    const saved = localStorage.getItem('capsule_default_tag_visibility');
    return saved !== null ? JSON.parse(saved) : true;
  });

  React.useEffect(() => {
    localStorage.setItem('capsule_default_tag_visibility', JSON.stringify(defaultTagVisibility));
  }, [defaultTagVisibility]);

  // Parse current view mode and state from path
  const { view, selectedGameId, selectedIgdbId } = useMemo(() => {
    // Strip trailing slash and decode
    const pathname = decodeURIComponent(location.pathname).replace(/\/$/, '') || '/';

    if (pathname === '/') {
      return { view: 'dashboard' as ViewMode, selectedGameId: null, selectedIgdbId: null };
    }
    if (pathname === '/profile') {
      return { view: 'profile' as ViewMode, selectedGameId: null, selectedIgdbId: null };
    }
    if (pathname === '/home') {
      return { view: 'home' as ViewMode, selectedGameId: null, selectedIgdbId: null };
    }
    if (pathname === '/insights') {
      return { view: 'all-insights' as ViewMode, selectedGameId: null, selectedIgdbId: null };
    }
    if (pathname === '/notes') {
      return { view: 'all-notes' as ViewMode, selectedGameId: null, selectedIgdbId: null };
    }
    if (pathname === '/notes/edit') {
      return { view: 'note-editor' as ViewMode, selectedGameId: null, selectedIgdbId: null };
    }

    // Match /game/:id
    const gameMatch = pathname.match(/^\/game\/([^/]+)$/);
    if (gameMatch) {
      return { view: 'session-view' as ViewMode, selectedGameId: gameMatch[1], selectedIgdbId: null };
    }

    // Match /igdb/:id
    const igdbMatch = pathname.match(/^\/igdb\/([^/]+)$/);
    if (igdbMatch) {
      return { view: 'igdb-game' as ViewMode, selectedGameId: null, selectedIgdbId: parseInt(igdbMatch[1], 10) || null };
    }

    // Match /mockups/:view
    const mockupMatch = pathname.match(/^\/mockups\/([^/]+)$/);
    if (mockupMatch) {
      return { view: mockupMatch[1] as ViewMode, selectedGameId: null, selectedIgdbId: null };
    }

    // Default Fallback
    return { view: 'dashboard' as ViewMode, selectedGameId: null, selectedIgdbId: null };
  }, [location.pathname]);

  // Extract activeSessionId from query parameter "?session=..."
  const activeSessionId = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('session');
  }, [location.search]);

  const viewState = location.state;

  // Track simple history array for backward compatibility
  const history = useMemo(() => {
    return [] as { view: ViewMode, gameId: string | null, sessionId: string | null, igdbId: number | null, state: any }[];
  }, []);

  const navigateTo = (
    newView: ViewMode,
    game?: Game | null,
    session?: GameSession | null,
    igdbId?: number | null,
    state?: any
  ) => {
    // Determine the target IDs
    const targetGameId = game !== undefined ? (game?.id || null) : selectedGameId;
    const targetIgdbId = igdbId !== undefined ? igdbId : selectedIgdbId;
    
    let targetSessionId: string | null = null;
    if (session !== undefined) {
      targetSessionId = session?.id || null;
    } else {
      targetSessionId = activeSessionId;
    }

    let targetPath = getPathFromView(newView, targetGameId, targetIgdbId);

    if (targetSessionId) {
      targetPath += `?session=${targetSessionId}`;
    }

    navigate(targetPath, { state });
  };

  const goBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/', { replace: true });
    }
  };

  const clearHistory = () => {
    // Standard react-router navigations handle history natively
  };

  return (
    <UIContext.Provider value={{
      view,
      history,
      selectedGameId,
      activeSessionId,
      selectedIgdbId,
      viewState,
      defaultTagVisibility,
      setDefaultTagVisibility,
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
