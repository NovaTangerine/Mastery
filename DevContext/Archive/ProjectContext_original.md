# Project Context & Technical Brief

## 1. The Big Picture (Vision)
The project is a next-generation social platform for gamers, focused on deep, meaningful engagement rather than just backlog tracking. The core philosophy is to "scaffold" the intimidating process of writing a game review by encouraging micro-interactions that eventually compile into a larger narrative.

**The Ideal User Journey:**
1. **Set Currently Playing:** Select active games to unlock logging, reviewing, and posting.
2. **Customize Profile:** Avatars and bios to build community identity.
3. **Set Top Games:** Baseline curation for social recommendations.
4. **Answer Topics:** Low-friction, game-specific prompts (e.g., "Most impactful moment?").
5. **Post / Tag:** Short-form, Twitter-like posts to build a digital presence.
6. **Generate Cartridges:** The viral engine. Highly shareable, interactive summary cards of a playthrough, combining stats, posts, and tags.
7. **Review Games:** The ultimate goal. Scaffolded by the data generated in steps 4-6.
8. **Journal Games:** Real-time logging alongside a playthrough, feeding into the Cartridge and Review generation.

## 2. Tech Stack & Architecture
* **Frontend:** React 18+, Vite, TypeScript.
* **Styling:** Tailwind CSS, Lucide React (icons), Framer Motion (animations).
* **Backend / Database:** Firebase (Firestore for NoSQL data, Firebase Auth for authentication).
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

* **Data Taxonomy (Source of Truth):** We cannot maintain our own game database. We need to integrate with IGDB or RAWG to handle remasters, DLCs, and regional variants consistently.
* **AI vs. Vector Embeddings:** The vision includes AI analyzing and tagging "Topic" answers to connect users. Running generative LLMs on every post is too expensive/slow. We should use Vector Embeddings and similarity search instead.
* **Database Evolution:** We are currently using Firestore (NoSQL). As the social graph grows (finding users who answered Topic X, like Game Y, and posted Z), the relational complexity will increase. We may eventually need to migrate to PostgreSQL or a Graph Database (Neo4j).
* **The "Cartridge" State:** Cartridges should likely be "immutable snapshots" rather than live dashboards to prevent cascading database updates if a user deletes an old post embedded in a cartridge.
* **Spoiler Architecture:** A system-wide, robust spoiler tagging system is mandatory before the social feed goes live.
* **MVP Phasing Strategy:** 
  * *Phase 1 (Single-Player Utility):* Focus on tracking, journaling, and generating shareable Cartridges.
  * *Phase 2 (Scaffolding):* Build out the review pipeline.
  * *Phase 3 (The Network):* Turn on social feeds and AI matching once we have a critical mass of user-generated content.
