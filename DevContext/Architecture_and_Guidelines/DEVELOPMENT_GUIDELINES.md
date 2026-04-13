# QuestLog: Development & Architecture Guidelines

This document serves as the source of truth for architectural decisions, performance standards, and coding patterns for QuestLog. Any new features or refactors must adhere to these guidelines to ensure the application remains scalable, performant, and cost-effective.

## 1. Core Principles
*   **Performance as a Feature:** The app must remain buttery smooth, even for power users with thousands of notes.
*   **Optimistic UI:** User actions (creating notes, moving items) should reflect immediately in the UI, with background syncing to the database.
*   **Defensive Data Fetching:** Never assume a collection is small. Always protect against "Data Firehoses."
*   **Graceful Degradation:** If AI features fail or rate-limit, the core journaling experience must continue to work flawlessly.

## 2. Data Fetching & Firestore (The "Anti-Firehose" Rule)
*   **Never fetch unbounded collections.** Every `query()` against a potentially growing collection (like `notes`) MUST include a `limit()`.
*   **Pagination:** Implement "Load More" or infinite scrolling for lists that exceed the initial limit.
*   **Real-time Sync:** Use `onSnapshot` for real-time updates, but ensure the listener is properly cleaned up on unmount.
*   **Offline Support:** Design features assuming the user might briefly lose internet connection. Rely on Firestore's local cache for offline writes.

## 3. Rendering & DOM Management
*   **Virtualization is Mandatory:** Any list that can contain more than 50 complex items (like the Notes feed) MUST use `@tanstack/react-virtual`.
*   **Avoid DOM Bloat:** Do not render hidden elements unnecessarily. Use conditional rendering (`{condition && <Component />}`).
*   **Memoization:** Use `React.memo`, `useMemo`, and `useCallback` judiciously for complex components (like `SortableNote`) to prevent unnecessary re-renders during drag-and-drop or typing.

## 4. Sorting & Ordering
*   **Fractional Indexing:** For user-defined ordering (drag-and-drop), ALWAYS use fractional indexing (e.g., the `fractional-indexing` library). 
*   **Never use integer reassignment:** Re-calculating integer indexes for an entire list when one item moves is strictly forbidden as it causes massive Firestore write spikes ($$$).

## 5. AI Integration & Discovery
*   **Non-Blocking:** AI calls (like auto-tagging) must happen asynchronously in the background. They should never block the user from continuing to type or interact with the app.
*   **The "Split Brain" Strategy:** Use cheap, lightning-fast **Hybrid Vector Embeddings** (combining user text with IGDB metadata) for background matchmaking and social feeds. Reserve expensive **Generative AI** exclusively for high-value, user-triggered actions (like summarizing a journal into a review).
*   **Server-Side Execution (Upcoming):** All Gemini API calls must eventually be routed through a secure backend proxy to protect the API key and enforce rate limits.
*   **Error Handling:** Always catch AI errors silently or with a subtle UI toast. A failed AI call should never crash the app or prevent a note from saving.

## 6. Content Visibility & Promotion (The Journal-to-Feed Pipeline)
*   **Private by Default:** Journal entries and session notes are hidden from the social feed to prevent clutter and encourage honest, unpolished reflection.
*   **The "Promotion" Mechanic:** Users have the agency to "promote" specific, high-value journal entries directly to their feed as **Posts**.
*   **Scaffolding Integration:** These promoted entries can later serve as the foundation for **Topics**, **Reviews**, or the final **Cartridge** snapshot.

## 7. UX & UI Patterns
*   **Empty States:** Every view that depends on user data MUST have a thoughtfully designed empty state with an icon, helpful text, and a clear Call-to-Action (CTA).
*   **Loading States:** Use skeleton loaders or subtle spinners for data fetching. Avoid full-page loading screens where possible.
*   **Styling:** Use Tailwind CSS. Stick to the established `zinc` color palette for the dark-mode aesthetic.
*   **Icons:** Use `lucide-react` consistently.

## 8. Adding New Features (Checklist)
Before implementing a new feature, ask:
1.  *Will this query scale if the user has 10,000 records?* (If no, add a limit/pagination).
2.  *Will this render too many DOM nodes?* (If yes, add virtualization).
3.  *Does this require AI?* (If yes, make it async and non-blocking, and prefer Vector Embeddings over Generative AI for background tasks).
4.  *What happens if the user has no data yet?* (Design the empty state).
