export interface Game {
  id: string;
  title: string;
  platform?: string;
  status: 'playing' | 'completed' | 'backlog' | 'abandoned';
  coverUrl?: string;
  overallNotes: string;
  storySynopsis: string;
  createdAt: number;
  updatedAt: number;
}

export interface GameSession {
  id: string;
  gameId: string;
  uid: string;
  startTime: number;
  endTime?: number;
  progressMarker: string; // e.g., "Chapter 4", "Level 12", "15 hours"
  name?: string;
  chapter?: string;
  hoursPlayed?: number;
}

export interface Note {
  id: string;
  gameId: string;
  sessionId?: string;
  content: string;
  tags: string[];
  isGlobal: boolean; // If true, shows up in overall notes too
  timestamp: number;
  order: string;
}

export type ViewMode = 'dashboard' | 'game-detail' | 'session-view' | 'all-insights' | 'all-notes' | 'quick-note';
