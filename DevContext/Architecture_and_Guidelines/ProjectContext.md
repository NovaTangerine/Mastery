# Project Context & Technical Brief

## 1. The Big Picture (Vision)
The project is a next-generation social platform for gamers, focused on deep, meaningful engagement rather than just backlog tracking. The core philosophy is the **"Anti-Backlog"**—treating gaming as a celebration of active engagement rather than a list of chores. The goal is to "scaffold" the intimidating process of writing a game review by encouraging micro-interactions (journals, posts) that eventually compile into a larger narrative.

**The Ideal User Journey:**
1. **Set Currently Playing:** Select active games to unlock logging, reviewing, and posting.
2. **Customize Profile:** Avatars and bios to build community identity.
3. **Set Top Games:** Baseline curation for social recommendations.
4. **Answer Topics:** Low-friction, game-specific prompts (e.g., "Most impactful moment?").
5. **Post / Tag:** Short-form, Twitter-like posts to build a digital presence (promoted from private journals).
6. **Generate Cartridges:** The viral engine ("The Digital Postcard"). Highly shareable, interactive summary cards of a playthrough, combining stats, posts, and tags.
7. **Review Games:** The ultimate goal. Scaffolded by the data generated in steps 4-6.
8. **Journal Games:** Real-time logging alongside a playthrough, acting as a private workshop that feeds into the Cartridge and Review generation.

## 2. Tech Stack & Architecture
* **Frontend:** React 18+, Vite, TypeScript.
* **Styling:** Tailwind CSS, Lucide React (icons), Framer Motion (animations).
* **Backend / Database:** Firebase (Firestore for NoSQL data, Firebase Auth for authentication).
* **AI & Discovery:** Hybrid Vector Embeddings (combining text and IGDB metadata) for matchmaking, with Generative AI reserved for user-triggered actions.
* **Key Libraries:** `@dnd-kit` for drag-and-drop sorting (used in notes/sessions), `@tanstack/react-virtual` for performance optimization on long lists.

## 3. Current Progress
We have been actively building out the core tracking and session management features (Phase 1/2 of the MVP):
* **Game & Session Management:** Users can track games, start sessions, and group sessions together.
* **Session Groups:** Implemented the ability to group sessions, edit group names, and safely delete groups (with custom UI confirmation modals to bypass iframe restrictions).
* **Notes & Journaling:** Users can add notes to sessions, tag them, and drag-and-drop to reorder them.
* **Trackers:** Custom tracking cards for specific game metrics.
* **UI/UX:** A highly polished, dark-mode, responsive interface with horizontal scrolling for mobile and sidebar layouts for desktop.

## 4. Principal Engineer's Notes & Risks (For AI Context)
When discussing this project with other AI instances, keep these architectural constraints and strategic decisions in mind:

* **Data Taxonomy (Source of Truth):** We are integrating with IGDB using the **"Anchor" Model**. Original releases act as the "Anchor," while remasters/ports act as "Satellites" with a `canonical_anchor_id`.
* **AI vs. Vector Embeddings:** We use a **"Split Brain" AI Strategy**. Hybrid Vector Embeddings (Text + Metadata) power similarity search and social feeds cheaply and instantly. Generative LLMs are reserved for high-value, user-triggered actions (like summarizing a journal).
* **Database Evolution:** We are currently using Firestore (NoSQL) for Phase 1. As the social graph grows, we will migrate to PostgreSQL (Phase 2), potentially evolving into a Hybrid (Postgres + Graph/Vector) architecture (Phase 3).
* **The "Cartridge" State:** Cartridges are **immutable snapshots** (hardcoded IGDB metadata) rather than live dashboards to prevent cascading database updates if a user deletes an old post embedded in a cartridge. Cartridge generation is gated based on exit state (e.g., Abandoned games are restricted).
* **Spoiler Architecture:** Spoiler tagging is suggestive, not restrictive. Cartridges inherit spoiler tags from source content, but users maintain "Creative Director" rights to toggle them.
* **Content Visibility:** Journals are private by default. Users can "promote" high-value entries to the public feed as Posts.
* **MVP Phasing Strategy:** 
  * *Phase 1 (Single-Player Utility):* Focus on tracking, journaling, and generating shareable Cartridges.
  * *Phase 2 (Scaffolding):* Build out the review pipeline.
  * *Phase 3 (The Network):* Turn on social feeds and AI matching once we have a critical mass of user-generated content.
