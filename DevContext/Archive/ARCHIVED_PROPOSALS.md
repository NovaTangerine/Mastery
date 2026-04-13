# Archived Architectural Proposals

## Basic Profile Page (2026-03-30)

**1. Strategic Alignment**
While full public profiles are technically "Phase 3" in our roadmap, building a *foundational* private profile now is essential for "Phase 1: The Single-Player Core." The user needs a home base to view their identity and access their logs. We will build this with future multiplayer scalability in mind, but focus purely on the single-player utility for now.

**2. Proposed Data Model (`User`)**
To support this UI, we need to establish the basic User schema:
```json
{
  "uid": "usr_123",
  "username": "gamer_tag",
  "displayName": "John Doe",
  "bio": "RPG enthusiast and completionist.",
  "avatarUrl": "https://...",
  "joinDate": "2026-03-30T00:00:00Z"
}
```

**3. UI/UX Layout & Components**
*   **Navigation:** A global navigation bar/layout to move back and forth between the QuestLog (Home/Feed) and the User Profile.
*   **Profile Header:** Avatar, Display Name, @username, and a short bio.
*   **Action Bar:** A primary Call-to-Action (CTA) to "Log a Game" and a secondary "Edit Profile" button.
*   **Tabbed Navigation (Future-Proofing):** We will use a tabbed layout. Right now, it will only have a "Logs" tab, but this perfectly sets up the architecture to add "Reviews," "Cards," and "Top 10 Lists" later.
*   **Logs Feed:** A list of the user's recent logs. 
    *   *Guideline Adherence:* Per the "Anti-Firehose" rule, this feed will be designed with pagination/limits in mind from day one.
    *   *Guideline Adherence:* Per the "Empty States" rule, we will design a beautiful empty state for when the user has zero logs, prompting them to start their journey.

**4. Tech Stack & Styling**
*   React (Vite) for the frontend.
*   React Router for navigation between QuestLog and Profile.
*   Tailwind CSS using the `zinc` dark-mode aesthetic (as mandated in the guidelines).
*   `lucide-react` for consistent iconography.
*   Mock data (based on our `LOG_SCHEMA_GUIDELINES.md`) to build the UI rapidly before wiring up a real database.

**5. Development Plan**
1.  Initialize the basic routing structure.
2.  Create the mock data for the User and a few sample Logs.
3.  Build the global Layout with navigation.
4.  Build the `ProfileHeader` and Tab navigation.
5.  Build the `LogFeed` (including the `LogCard` component and the Empty State).
6.  Apply Tailwind styling and ensure mobile responsiveness.

## Horizontal Scroll Snapping (2026-03-31)

**Context & Alignment with Guidelines:**
The goal is to create a spatial, horizontally scrolling transition between the "Sessions", "Notes", and "Trackers" tabs on mobile/tablet. This aligns with the vision of a premium, polished UX. However, we must balance this with the *Performance as a Feature* and *Avoid DOM Bloat* principles from `DEVELOPMENT_GUIDELINES.md`, especially since the Notes feed uses virtualization.

**Proposed Approach: CSS Scroll Snapping with State Sync**
Instead of unmounting inactive tabs (which destroys the spatial illusion) or using heavy JS-based drag physics, we will use native CSS Scroll Snapping.

1.  **Layout Architecture:**
    *   Wrap the three mobile views (Sessions, Notes, Trackers) in a horizontal flex container (e.g., `flex flex-row w-[300vw]`).
    *   Each individual view will take up exactly `100vw` (or `100%` of the visible container) and act as a snap center point (`snap-center shrink-0 w-full`).
    *   The parent container will have `overflow-x-auto snap-x snap-mandatory` to create a native, hardware-accelerated swipe feel.
    *   Hide the horizontal scrollbar using CSS.

2.  **State Synchronization (Two-Way Binding):**
    *   **Tab Click to Scroll:** When a user taps a bottom navigation tab, we use a `useRef` to programmatically scroll the container to the corresponding index using `.scrollTo({ left: index * width, behavior: 'smooth' })`.
    *   **Swipe to Tab Update:** Attach a debounced `onScroll` listener to the horizontal scroll container. When the user manually swipes to a new pane, we detect which pane is in view and update the `activeMobileTab` state. This ensures the bottom navigation pill highlight stays in sync with the user's swipe actions.

3.  **Performance & DOM Management:**
    *   *Virtualization:* The Notes feed already uses `@tanstack/react-virtual`. We will ensure the virtualizer's scroll container is strictly isolated to the Notes pane so vertical scrolling doesn't interfere with the horizontal swipe.
    *   *DOM Bloat Mitigation:* While all three panes will be mounted simultaneously on mobile, the Sessions and Trackers lists are relatively lightweight. The heavy Notes list is virtualized, meaning off-screen notes aren't rendered anyway. This keeps the overall DOM node count well within performance budgets.
    *   *Desktop View:* We will use responsive Tailwind classes to ensure this horizontal scrolling structure only applies to mobile/tablet breakpoints (`max-width: 1024px`), preserving the standard side-by-side desktop layout.

## Enhanced Trackers (2026-03-31)

**Context & Alignment with Guidelines:**
The goal is to evolve Trackers from simple string lists into structured, quantifiable tracking tools. This directly aligns with the `future_vision.md` principle of "Atomic and Structured" data. By decoupling the tracker item's title from its metadata (description, progress, quantifier type), we create a richer, more interactive experience that can later be aggregated or visualized on user profiles.

**1. Data Model Evolution (`src/types.ts`)**
We will migrate `SessionTracker.items` from an array of strings to an array of structured `TrackerItem` objects.

```typescript
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
  items: (string | TrackerItem)[]; // Union type for backward compatibility during migration
  order: string;
}
```

**2. Context & State Management (`src/contexts/GameContext.tsx`)**
*   **Migration:** When loading sessions, we will gracefully handle legacy string items by mapping them to `{ id: uuid(), title: string, quantifierType: 'none' }` on the fly.
*   **New Methods:**
    *   `handleAddTrackerItem(trackerId: string, item: TrackerItem)`
    *   `handleUpdateTrackerItem(trackerId: string, itemId: string, updates: Partial<TrackerItem>)` (for optimistic UI updates when incrementing progress or toggling checkboxes).
    *   `handleRemoveTrackerItem(trackerId: string, itemId: string)` (migrating away from index-based removal for stability).

**3. UI/UX Implementation (`src/components/TrackerCard.tsx` & new components)**
*   **Item Rendering:** A new `TrackerItemRow` component will handle the display logic based on `quantifierType`.
    *   `none`: Just the title.
    *   `checkbox`: A clickable checkbox.
    *   `progress`: A visual progress bar with `-` and `+` increment controls.
    *   `stepper`: A breadcrumb/dot indicator showing discrete steps.
*   **Description Toggle:** A chevron icon next to the title will expand a smooth accordion (`framer-motion` or CSS transition) revealing the description.
*   **Add/Edit Flow:** The "Add Item" UI will be expanded into a small inline form or popover allowing the user to specify the Title, Description (optional), and Quantifier Type (with max values if applicable).

**4. Performance & Guidelines Adherence**
*   **Optimistic UI:** All progress increments and toggles will update the local React state immediately before the Firestore write completes.
*   **DOM Management:** Descriptions will be conditionally rendered or hidden via CSS to prevent unnecessary layout thrashing.
*   **Data Limits:** Trackers remain embedded within the `Session` document. Since trackers are scoped to a session, they will not grow unbounded, safely avoiding the 1MB Firestore document limit.
