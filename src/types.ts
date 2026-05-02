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

export type QuantifierType = 'none' | 'checkbox' | 'progress' | 'stepper';

export interface TrackerItem {
  id: string;
  title: string;
  description?: string;
  quantifierType: QuantifierType;
  
  // For 'progress' and 'stepper'
  currentValue?: number;
  maxValue?: number;
  
  // For 'checkbox'
  completed?: boolean;
  
  // For 'stepper' (optional labels)
  steps?: string[]; 
}

export interface SessionTracker {
  id: string;
  title: string;
  items: (string | TrackerItem)[];
  order: string;
}

export interface SessionGroup {
  id: string;
  gameId: string;
  uid: string;
  title: string;
  createdAt: number;
  order: string;
}

export interface GameSession {
  id: string;
  gameId: string;
  uid: string;
  groupId?: string;
  startTime: number;
  endTime?: number;
  progressMarker: string; // e.g., "Chapter 4", "Level 12", "15 hours"
  name?: string;
  chapter?: string;
  hoursPlayed?: number;
  trackers?: SessionTracker[];
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

export interface Draft {
  id: string;
  gameId: string;
  sessionId?: string;
  content: string;
  tags: string[];
  updatedAt: number;
}

export type ViewMode = 'home' | 'dashboard' | 'game-detail' | 'session-view' | 'all-insights' | 'all-notes' | 'note-editor' | 'profile' | 'igdb-game';
