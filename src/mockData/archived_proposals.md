### Architectural Proposal: Data Visibility & Pagination

**1. The Problem: Hard Limits & Missing Data**
Currently, our global `onSnapshot` listeners in `GameContext.tsx` have hardcoded `.limit(100)` clauses for `games`, `sessions`, `sessionGroups`, and `drafts`. In `useNotes.ts`, notes are limited to 50. While this prevents massive initial read costs (Read Amplification), we lack a UI mechanism to fetch older data. If a user has 101 games, the oldest game simply vanishes from the UI.

**2. The Solution: Real-time "Load More" Pagination**
Because we rely on `onSnapshot` for real-time, multi-device synchronization, traditional cursor-based pagination (using `startAfter`) is complex (it requires managing and merging multiple active listeners). 

Instead, we will implement a dynamic limit approach:
*   **Stateful Limits:** We will introduce state variables in `GameContext` (e.g., `gamesLimit`, `sessionsLimit`) that default to 50 or 100.
*   **Load More Functions:** We will expose functions like `loadMoreGames()` and `loadMoreSessions()` that increment these limits by a fixed chunk (e.g., +50).
*   **UI Integration:** In our main views (`DashboardView`, `GameDetailView`, `AllNotesView`, `SessionView`), we will render a "Load More" button at the bottom of the lists *only if* the current number of items fetched equals the current limit (indicating there might be more data in the database).

**3. Implementation Steps**
1.  **Update `GameContext.tsx`:** Add state and functions for `gamesLimit`, `sessionsLimit`, `sessionGroupsLimit`, and `draftsLimit`. Update the `query` calls to use these dynamic limits instead of hardcoded `100`.
2.  **Update `DashboardView.tsx`:** Add a "Load More Games" button.
3.  **Update `GameDetailView.tsx`:** Add a "Load More Sessions" button.
4.  **Update `AllNotesView.tsx` & `SessionView.tsx`:** Utilize the existing `loadMoreNotes` function from `useNotes.ts` and add the corresponding UI buttons.

---

### Architectural Proposal: Data Integrity & Edge Cases

**1. Fractional Indexing Monitoring & Fallback**
*   **The Problem:** The `fractional-indexing` algorithm generates string keys to maintain order. Repeatedly dragging and dropping items into the exact same position can cause these string keys to grow indefinitely, eventually hitting performance or database limits.
*   **The Solution:** We will wrap our `generateKeyBetween` calls (primarily in `useNotes.ts` during drag-and-drop operations) in a protective utility function.
    *   **Length Monitoring:** If a generated key exceeds a safe threshold (e.g., 60 characters), we will fire a telemetry event (`logAppEvent('fractional_index_warning')`). This gives us data on whether a full "rebalancing" algorithm is needed for the Beta.
    *   **Error Fallback:** If `generateKeyBetween` throws an error (e.g., due to identical adjacent keys), we will catch it, log an error event, and safely fallback to appending the item to the end of the list to prevent the UI from crashing.

**2. Offline State UI Communication**
*   **The Problem:** Firebase Firestore caches writes in IndexedDB when offline. If the user clears their browser data or the browser evicts storage due to low disk space before they reconnect, those writes are permanently lost.
*   **The Solution:** We will implement a global network status listener using `navigator.onLine` and window `online`/`offline` events.
    *   **UI Indicator:** When the user goes offline, we will display a persistent, non-intrusive banner (or update the header status) that clearly states: *"⚠️ Offline Mode: Changes are saved locally. Reconnect to sync and prevent data loss."*
    *   This sets the correct user expectation that "Saved" currently means "Saved to this specific device's temporary storage" until the connection is restored.

---

### Architectural Proposal: Security & Data Privacy Audit

**1. Backend Auth Verification**
*   **Current State:** Our Express proxy (`server.ts`) currently uses `admin.auth().verifyIdToken(idToken)` to validate requests to the `/api/tags/suggest` endpoint. This correctly prevents unauthenticated access.
*   **Hardening:** To make this *strictly* secure, we will update the verification to check for revoked tokens by passing `true` as the second argument: `verifyIdToken(idToken, true)`. This ensures that if a user's session is terminated or their account is disabled, their API access is immediately cut off.

**2. Firestore Rules Audit & Hardening (The Core Task)**
A strict audit of our current `firestore.rules` reveals several vulnerabilities related to optional fields and schema enforcement that violate the "Devil's Advocate" security guidelines:
*   **Resource Exhaustion / DoS Risks (Missing Size Limits):** Several optional string fields are currently unvalidated. A malicious actor could write a 1MB string to these fields. We will add strict size limits to:
    *   `Game`: `coverUrl` (< 2000 chars), `overallNotes` (< 10000 chars), `storySynopsis` (< 10000 chars).
    *   `GameSession`: `endTime` (must be a number).
*   **Deep Array Inspection:** The `tags` array on `Note` and `Draft` documents is currently unvalidated. We will add a helper function to ensure `tags` is a list of maximum 20 items, where each item is a string of less than 50 characters.
*   **Schema Pollution:** Currently, users can add arbitrary, undefined fields to their documents. We will enforce `hasOnlyAllowedFields()` on all `create` and `update` operations to strictly lock down the document shapes.
*   **Immutable Fields:** We will explicitly protect fields like `createdAt`, `gameId`, and `sessionId` from being modified during an `update` operation.

**3. Adherence to Guidelines**
*   **Security Guidelines:** This proposal directly addresses the "No Mixed Content", "Resource Exhaustion/DoS", and "Deep Array Inspection" rules outlined in the Firebase Security Rules directives.

---

### Architectural Proposal: Runaway Costs & Database Scalability

**1. Firestore Read Amplification (Defensive Fetching)**
*   **Notes Collection:** We have already successfully mitigated the primary risk here by extracting notes into the `useNotes` hook, scoping the query to the `activeSession`, and applying a `limit(50)` with pagination. This prevents the "Data Firehose" scenario.
*   **Secondary Collections:** To ensure complete adherence to Guideline #2 (Defensive Data Fetching), we will apply reasonable upper bounds (`limit(100)`) to the remaining global listeners in `GameContext.tsx` (`games`, `sessions`, `drafts`). While these collections are naturally smaller, an unbounded query is always a scalability risk.

**2. Gemini API Token Monitoring**
*   **The Problem:** While our Express rate limiter (50 req/hr) prevents spam abuse, it doesn't give us visibility into the actual *cost* (token volume) being consumed by the Alpha testers.
*   **The Solution:** We will update the `/api/tags/suggest` endpoint in `server.ts` to capture the `usageMetadata` returned by the `@google/genai` SDK.
*   **Telemetry Storage:** We will write this token usage data to a new `api_usage` collection in Firestore. Each document will record the user's `uid`, `timestamp`, `promptTokenCount`, `candidatesTokenCount`, and `totalTokenCount`.
*   **Benefit:** This provides granular, per-user cost tracking, allowing us to identify expensive edge cases (e.g., users pasting massive blocks of text) and accurately forecast costs for the Beta launch.

**3. Adherence to Guidelines**
*   **Guideline #2 (Defensive Fetching):** All Firestore `onSnapshot` listeners will now have explicit `limit()` bounds.
*   **Guideline #5 (AI Integration):** We are adding observability to our AI integration, ensuring we can monitor and control the financial impact of the feature.

---

### Architectural Proposal: Client-Side Performance & State Management Refactor

**1. Deconstruct the "God Context" (`GameContext.tsx`)**
Currently, any change to a single note or UI toggle forces the entire component tree to re-render. We will break `GameContext` into smaller, strictly focused contexts:
*   **`AuthContext`:** Manages `user` and `isAuthReady`. (Rarely changes).
*   **`UIContext`:** Manages `view`, `history`, `isCompactMode`, and navigation functions. (Changes on user navigation).
*   **`GameDataContext`:** Manages the relatively small, top-level collections (`games`, `sessions`, `sessionGroups`, `drafts`).

**2. Isolate and Paginate Notes Data (Addressing Memory Bloat)**
Notes are the primary source of memory bloat and frequent updates. We will remove `notes` from the global context entirely.
*   **Custom Hook (`useSessionNotes`)**: We will create a dedicated hook that attaches an `onSnapshot` listener *only* for the notes belonging to the currently `activeSession`.
*   **Pagination/Limits**: We will enforce the "Anti-Firehose" rule (Guideline #2) by applying a `limit()` to the notes query, preventing the app from loading a user's entire lifetime history of notes into memory on boot.
*   **Targeted Re-renders**: By consuming `useSessionNotes` only within `SessionView`, adding, dragging, or AI-tagging a note will no longer re-render the dashboard, sidebar, or other unrelated components.

**3. State Management Strategy**
*   While the addendum mentions React Query/SWR, introducing a new caching library right before an Alpha launch introduces significant risk and requires rewriting all our real-time Firestore listeners.
*   Instead, **Context Splitting** combined with **Localized Custom Hooks** achieves the exact same performance goals (preventing re-render cascades and memory bloat) using our existing Firestore `onSnapshot` patterns, making it the safest and most efficient path to the Alpha launch.

**4. Adherence to Guidelines**
*   **Guideline #1 & #3 (Performance & Memoization):** Splitting contexts ensures that typing in a note doesn't re-render the entire app.
*   **Guideline #2 (Defensive Fetching):** Notes will be scoped to the active session and limited, preventing unbounded memory growth.

---

### Architectural Proposal: Sprint 3 - UX Polish & Scalability Monitoring

**1. Asynchronous AI Feedback (Task 3.1)**
*   **State Management:** Instead of writing temporary "loading" states to Firestore, we will track AI tagging status locally in `GameContext.tsx` using a state object: `taggingStatus: Record<string, 'loading' | 'error'>`.
*   **UI Updates (`NoteCard` / `SortableNote`):**
    *   When a note's ID is in the `'loading'` state, we will render a spinning `Sparkles` icon (from `lucide-react`) next to the tags area.
    *   When a note's ID is in the `'error'` state, we will render a subtle warning icon and a "Retry Tagging" button.
*   **Retry Logic:** We will expose a new `handleRetryTagging(noteId: string, content: string)` function in `GameContext` that re-triggers the `suggestTags` API call and updates the note in Firestore upon success.

**2. Alpha Telemetry & Monitoring (Tasks 3.2 & 3.3)**
*   **Firebase Analytics:** We will initialize Firebase Analytics in `src/firebase.ts` (`getAnalytics`).
*   **Telemetry Utility:** We will create a wrapper function `logAppEvent(eventName, params)` to safely log events only if analytics is supported and initialized.
*   **Key Events to Track:**
    *   `note_created` (with a parameter indicating if it was from 'quick-note' or 'session-view').
    *   `note_reordered` (to monitor Task 3.2: Fractional Indexing usage volume).
    *   `ai_tagging_success` / `ai_tagging_error`.
*   **Operational Tasks:** (Note: Budget alerts and Firebase console monitoring are operational tasks done outside the codebase, but I will ensure the checklist reflects their completion status).

**3. Adherence to Guidelines**
*   **Guideline #5 (AI Integration):** The AI feedback mechanism ensures the user is never blocked while waiting for tags, and errors are handled gracefully with a manual retry option.
*   **Guideline #6 (UX & UI Patterns):** We will use `lucide-react` icons (`Sparkles`, `AlertCircle`, `RefreshCw`) and Tailwind's `animate-spin` to create subtle, non-intrusive loading states.

---

### Architectural Proposal: Freeform Session Trackers

**1. Data Model (Firestore)**
Instead of creating a new sub-collection (which would require additional queries and complex state management), we will store this freeform data directly on the `GameSession` document. Text data is extremely lightweight, so we will stay well under Firestore's 1MB document limit while avoiding "Data Firehoses" (Guideline #2).

We will update the `GameSession` type in `src/types.ts` to include an array of `SessionTracker` objects:
```typescript
interface SessionTracker {
  id: string;
  title: string;       // e.g., "Key Characters", "Locations", or a custom user string
  items: string[];     // Array of text items (e.g., ["John Doe", "Jane Smith"])
  order: string;       // Fractional indexing string for drag-and-drop reordering (Guideline #4)
}
```

**2. UI/UX Design**
*   **Location:** We will add a horizontal, scrollable "Trackers" ribbon or a collapsible sidebar in the `SessionView`, keeping the main focus on the Notes feed.
*   **Interaction:** 
    *   An "Add Tracker" button opens a dropdown with presets (Objectives, Characters, Locations, Loot) and a "Custom..." option.
    *   Each tracker renders as a small, focused card. Users can quickly type an item and hit "Enter" to add it to the list.
*   **Empty States (Guideline #6):** If no trackers exist, a subtle dashed-border dropzone will invite the user to add their first one.

**3. Performance & State Management (Guidelines #1 & #3)**
*   **Optimistic UI:** Adding a tracker or a new item to a tracker will update the local React state immediately, followed by a debounced or background `updateDoc` call to Firestore.
*   **Memoization:** Tracker cards will be wrapped in `React.memo` so that typing in the main Notes feed doesn't cause the trackers to re-render.

---

### Project Plan

**Phase 1: Data Layer & Context**
*   Update `types.ts` with the new `SessionTracker` interface.
*   Add optimistic update functions to `GameContext.tsx` (`handleAddTracker`, `handleAddTrackerItem`, `handleRemoveTrackerItem`, `handleDeleteTracker`).

**Phase 2: UI Components**
*   Build the `TrackerCard` component (displays the title, list of items, and a quick-add input).
*   Build the `AddTrackerMenu` component (dropdown with presets + custom input).

**Phase 3: Integration & Polish**
*   Integrate the components into `SessionView.tsx`.
*   Ensure empty states and loading states match the existing app aesthetic.
*   Verify that adding/removing items feels instantaneous (Optimistic UI).

---

### Architectural Proposal: Responsive Session Layout & Mobile Tabs

**1. Layout Architecture (Desktop)**
We will transition `SessionView.tsx` from a 2-column layout to a 3-column layout on large screens (`lg:`).
*   **Left Column (`w-72`):** Sessions List (Existing).
*   **Center Column (`flex-1 max-w-2xl`):** Session Details, Notes Feed (Virtualization maintained per Guideline #3), and Input Area.
*   **Right Column (`w-80`):** Trackers. We will change the trackers from a horizontal scrolling ribbon to a vertical stack, giving them dedicated vertical real estate.

**2. Mobile Architecture (Tabs)**
To solve the cramped mobile experience without causing DOM bloat (Guideline #3), we will implement a tabbed interface.
*   **State:** Introduce `activeMobileTab` state (`'sessions' | 'notes' | 'trackers'`), defaulting to `'notes'`.
*   **Navigation:** Add a fixed bottom navigation bar (visible only on `< lg` screens) with three distinct tabs.
*   **Conditional Rendering:** On mobile, we will strictly render *only* the active tab's content to keep the DOM light. On desktop (`lg:`), we will render all three columns side-by-side and hide the bottom navigation bar.

**3. Component Updates**
*   **`TrackerCard.tsx`:** Remove the strict `min-w-[240px]` constraints so the cards can fluidly fill the width of the right column (desktop) or the full screen (mobile).
*   **`AddTrackerMenu.tsx`:** Adjust the styling to fit a vertical stack rather than a horizontal ribbon.

---

### Project Plan

**Phase 1: State & Mobile Navigation**
*   Add `activeMobileTab` state to `SessionView.tsx`.
*   Build the mobile bottom navigation bar (visible `flex lg:hidden`) with icons for Sessions, Notes, and Trackers.

**Phase 2: Desktop 3-Column Layout**
*   Update the main container to support 3 columns (`hidden lg:flex` for the outer columns).
*   Extract the Trackers logic from the center column and move it to the new right column.
*   Update the Trackers container to be a vertically scrolling list (`flex-col space-y-4`) instead of a horizontal ribbon.

**Phase 3: Responsive Polish & Virtualization Check**
*   Ensure the `useVirtualizer` for the Notes feed correctly recalculates its size when switching tabs on mobile.
*   Verify empty states look correct in both the narrow mobile view and the dedicated desktop column (Guideline #6).

---

### Architectural Proposal: Session Grouping

**1. Data Model Updates**
*   **New Entity (`SessionGroup`)**:
    *   `id` (string)
    *   `gameId` (string)
    *   `title` (string)
    *   `createdAt` (number)
    *   `order` (string) - For fractional indexing if reordering is needed later.
*   **Modified Entity (`GameSession`)**:
    *   Add `groupId?: string` to link a session to a specific group.
*   **Firebase**:
    *   Update `firebase-blueprint.json` with the new schema.
    *   Update `firestore.rules` to secure the `sessionGroups` collection (owner-only access).

**2. State Management (`GameContext.tsx`)**
*   **State**: Add `sessionGroups` array to track groups for the currently selected game.
*   **Listeners**: Add a real-time `onSnapshot` listener for `sessionGroups` when a game is selected.
*   **Mutations**:
    *   `handleCreateSessionGroup(title: string)`
    *   `handleUpdateSessionGroup(groupId: string, title: string)`
    *   `handleDeleteSessionGroup(groupId: string)`
    *   `handleUpdateSessionGroupMembership(groupId: string, sessionIds: string[])` - Uses a Firestore `writeBatch` to atomically update the `groupId` of multiple sessions at once.
    *   Update existing `handleUpdateSessionDetails` to accept an optional `groupId`.

**3. UI/UX Implementation**
*   **Session List View (`SessionView.tsx` / `GameDetailView.tsx`)**:
    *   **Group Display**: Render groups above the main session list. Each group will display its title and the sessions belonging to it.
    *   **Edit Mode**: Introduce a local state `editingGroupId`. When active:
        *   A "Save" and "Cancel" floating bar appears.
        *   Checkboxes appear next to *all* sessions in the list.
        *   The user toggles checkboxes to add/remove sessions from the currently editing group.
*   **Session Details/Edit Modal**:
    *   Add a dropdown selector for "Group".
    *   Include an option to "Create New Group..." directly from the dropdown, which will prompt for a name, create the group, and auto-select it.

**4. Adherence to Guidelines**
*   **Performance**: Group membership updates will use batched writes.
*   **Empty States**: The group section will remain hidden if no groups exist, maintaining a clean UI.
*   **Optimistic UI**: Context state will be updated immediately while Firestore syncs in the background.

---

### Architectural Proposal: Sprint 1 - Security & Infrastructure

**1. Backend Architecture Decision (Task 1.1)**
*   **Decision:** Option A (Express.js Server proxying Vite).
*   **Rationale:** The current environment natively supports running a full-stack Express + Vite setup on a single port. This avoids the need for a paid Firebase Blaze plan (Option B - Cloud Functions), keeping costs at zero for the alpha launch while fully securing the API key server-side.

**2. API Proxy Implementation (Task 1.2)**
*   **Server Setup (`server.ts`):** We will create an Express server that serves the Vite frontend in production and uses Vite middleware in development.
*   **New Endpoint (`POST /api/tags/suggest`):**
    *   Accepts the note content and the user's Firebase Auth ID token in the `Authorization` header.
    *   Uses `firebase-admin` to verify the ID token, ensuring only authenticated users can access the AI.
    *   Calls the Gemini API using the server-side `@google/genai` SDK and the `GEMINI_API_KEY` environment variable.
    *   Returns the generated tags.

**3. Client-Side Cleanup (Task 1.3)**
*   Update `src/services/geminiService.ts` to remove the `@google/genai` client SDK.
*   Refactor `suggestTags` to make a `fetch` request to `/api/tags/suggest`, passing the Firebase Auth token (`await auth.currentUser.getIdToken()`).
*   Remove `VITE_GEMINI_API_KEY` from client-side code, relying solely on the server-side `GEMINI_API_KEY`.

**4. Rate Limiting (Task 1.4)**
*   Implement an in-memory rate limiter (e.g., using `express-rate-limit`) on the Express server for the `/api/tags/suggest` endpoint.
*   **Limit:** 50 requests per user (based on the verified Firebase UID) per hour.
*   **Client UI:** Update the client to catch `429 Too Many Requests` errors from the new API and display a graceful toast notification to the user (adhering to Guideline #5: Graceful Degradation).

**5. Adherence to Guidelines**
*   **Guideline #5 (AI Integration):** The AI call remains non-blocking and asynchronous, but is now securely routed through our backend proxy. Errors (like rate limits) will be caught and handled gracefully without crashing the app.

---

### Architectural Proposal: Sprint 2 - Resilience & Offline Capabilities

**1. Firestore Offline Persistence (Task 2.1)**
*   **Implementation:** We will update `src/firebase.ts`. Instead of the standard `getFirestore(app)`, we will use `initializeFirestore` with `persistentLocalCache` and `persistentMultipleTabManager`.
*   **Rationale:** This enables robust offline support even if the user has multiple tabs open. Any writes (creating notes, editing sessions) performed while offline will be queued in IndexedDB and automatically synced to the cloud when the connection is restored. This directly aligns with **Guideline #2 (Offline Support)**.

**2. Offline State UI & Network Hook (Task 2.2)**
*   **Custom Hook (`useNetworkStatus`):** We will create a React hook to listen to the browser's `online` and `offline` events to track the user's network state.
*   **Global Indicator:** We will add a subtle, non-intrusive banner or icon (using `lucide-react`'s `WifiOff` icon) to the main application layout (e.g., in the top navigation bar or sidebar). It will display a message like *"Offline. Changes are saved locally."*
*   **Sync Status (Pending Writes):** Firestore snapshots include `metadata.hasPendingWrites`. We can optionally use this to show a subtle "Syncing..." or "Cloud" icon on individual notes or at the top of the session view to indicate when local changes have successfully reached the server.

**3. Conflict Resolution Strategy (Task 2.3)**
*   **Decision:** We will rely on Firestore's default "last-write-wins" strategy.
*   **Rationale:** Since QuestLog is a personal journaling app (users are editing their *own* data, not collaborating simultaneously with others on the same document), the risk of complex merge conflicts is extremely low. If a user edits a note on their phone offline, and then edits the same note on their desktop, the last device to sync with the cloud will overwrite the field. This is standard and acceptable for this scale.

**4. Adherence to Guidelines**
*   **Guideline #2 (Offline Support):** The app will gracefully handle network drops without losing user data.
*   **Guideline #6 (UX & UI Patterns):** The offline indicators will be styled consistently with the existing `zinc` dark-mode aesthetic and use `lucide-react` icons to avoid UI clutter.
