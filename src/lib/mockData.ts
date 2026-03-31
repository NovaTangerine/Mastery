export interface User {
  uid: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  joinDate: string;
}

export interface LogBlock {
  id: string;
  type: 'paragraph' | 'image';
  text?: string;
  url?: string;
  alt_text?: string;
}

export interface Log {
  log_id: string;
  user_id: string;
  game_id: string;
  game_title: string;
  game_cover_url: string;
  created_at: string;
  updated_at: string;
  session_metadata: {
    platform: string;
    playtime_delta_minutes: number;
    total_playtime_minutes: number;
    difficulty_level: string;
    completion_status: string;
    custom_milestone?: string;
  };
  content: {
    blocks: LogBlock[];
  };
  ai_analysis?: {
    processed_at: string;
    sentiment_score: number;
    primary_emotion: string;
    topics_detected: string[];
    entities_mentioned: string[];
    session_blurb: string;
    suggested_review_prompts: string[];
    contains_potential_spoilers: boolean;
  };
}

export const mockUser: User = {
  uid: "usr_123",
  username: "rpg_master",
  displayName: "Alex Mercer",
  bio: "Completionist. Lore hunter. Currently diving deep into Elden Ring and waiting for the next big JRPG.",
  avatarUrl: "https://picsum.photos/seed/alex/150/150",
  joinDate: "2026-01-15T00:00:00Z"
};

export const mockLogs: Log[] = [
  {
    log_id: "log_9a8b7c6d",
    user_id: "usr_123",
    game_id: "igdb_7890",
    game_title: "Elden Ring",
    game_cover_url: "https://picsum.photos/seed/eldenring/300/400",
    created_at: "2026-03-30T16:36:22Z",
    updated_at: "2026-03-30T16:36:22Z",
    session_metadata: {
      platform: "PlayStation 5",
      playtime_delta_minutes: 150,
      total_playtime_minutes: 840,
      difficulty_level: "Standard",
      completion_status: "In Progress",
      custom_milestone: "Defeated the Abyss Watchers"
    },
    content: {
      blocks: [
        {
          id: "blk_1",
          type: "paragraph",
          text: "Finally beat the Abyss Watchers. The second phase caught me completely off guard, but the music was incredible."
        }
      ]
    },
    ai_analysis: {
      processed_at: "2026-03-30T16:36:25Z",
      sentiment_score: 0.85,
      primary_emotion: "Triumphant",
      topics_detected: ["boss_fight", "soundtrack", "difficulty_spike"],
      entities_mentioned: ["Abyss Watchers"],
      session_blurb: "Overcame a major boss fight, praising the surprise second phase and incredible soundtrack.",
      suggested_review_prompts: [
        "You mentioned the music during the Abyss Watchers fight—how did the soundtrack impact your overall experience?"
      ],
      contains_potential_spoilers: true
    }
  },
  {
    log_id: "log_1x2y3z4w",
    user_id: "usr_123",
    game_id: "igdb_4567",
    game_title: "Persona 5 Royal",
    game_cover_url: "https://picsum.photos/seed/p5r/300/400",
    created_at: "2026-03-28T20:15:00Z",
    updated_at: "2026-03-28T20:15:00Z",
    session_metadata: {
      platform: "PC",
      playtime_delta_minutes: 240,
      total_playtime_minutes: 4500,
      difficulty_level: "Hard",
      completion_status: "Rolled Credits",
    },
    content: {
      blocks: [
        {
          id: "blk_2",
          type: "paragraph",
          text: "What a journey. Saying goodbye to these characters feels like leaving real friends behind. The final palace was a masterpiece of level design."
        }
      ]
    },
    ai_analysis: {
      processed_at: "2026-03-28T20:16:00Z",
      sentiment_score: 0.95,
      primary_emotion: "Bittersweet",
      topics_detected: ["ending", "characters", "level_design"],
      entities_mentioned: ["Palace"],
      session_blurb: "Finished the game with strong emotional attachment to the characters and high praise for the final level design.",
      suggested_review_prompts: [
        "How did the final palace compare to the earlier ones in terms of design and pacing?"
      ],
      contains_potential_spoilers: false
    }
  }
];
