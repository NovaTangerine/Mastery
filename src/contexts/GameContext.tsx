import React from 'react';
import { GameLibraryProvider, useGameLibrary } from './GameLibraryContext';
import { ActiveSessionProvider, useActiveSession } from './ActiveSessionContext';

// --- Re-exports for absolute compatibility ---
export { GameLibraryProvider, useGameLibrary } from './GameLibraryContext';
export { ActiveSessionProvider, useActiveSession } from './ActiveSessionContext';

// --- Compound GameProvider ---
export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <GameLibraryProvider>
      <ActiveSessionProvider>
        {children}
      </ActiveSessionProvider>
    </GameLibraryProvider>
  );
};

// --- Backwards Compatibility Hook (combined useGameContext facade) ---
export const useGameContext = () => {
  const library = useGameLibrary();
  const session = useActiveSession();
  return { ...library, ...session };
};
