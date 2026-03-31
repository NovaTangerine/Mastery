# QuestLog: Alpha Launch Project Plan

**Target Audience:** 100 Closed Alpha Users
**Primary Objective:** Secure the application infrastructure, control costs, and ensure data resilience before exposing the app to external users.

## Executive Summary
This document outlines the required sprints to transition QuestLog from a client-side MVP to a secure, production-ready application suitable for a 100-user Alpha test. The absolute highest priority is securing the Gemini API key, which currently resides in the client bundle.

---

## Sprint 1: Security & Infrastructure (The Blocker)
**Goal:** Eliminate the risk of API key theft and unbounded API costs.
**Estimated Effort:** 1-2 Weeks

*   **Task 1.1: Backend Migration Strategy**
    *   *Option A:* Stand up a lightweight Express.js server to serve the Vite frontend and proxy API requests.
    *   *Option B:* Implement Firebase Cloud Functions (requires Firebase Blaze plan).
    *   *Deliverable:* Architecture decision record (ADR) and initial backend scaffolding.
*   **Task 1.2: API Proxy Implementation**
    *   Move `suggestTags` and any other Gemini API calls from `src/services/geminiService.ts` to the new backend.
    *   Update the client to call our own backend endpoints (e.g., `POST /api/tags/suggest`) instead of the Gemini API directly.
    *   Pass the user's Firebase Auth token in the request headers to verify identity on the backend.
*   **Task 1.3: Client-Side Cleanup**
    *   Remove `GEMINI_API_KEY` from client-side `.env` files and Vite configuration.
    *   Ensure no Google GenAI SDK code remains in the client bundle.
*   **Task 1.4: Rate Limiting**
    *   Implement strict rate limiting on the new backend endpoints (e.g., max 50 note tagging requests per user per hour).
    *   Return `429 Too Many Requests` when limits are exceeded, and handle this gracefully in the client UI.

---

## Sprint 2: Resilience & Offline Capabilities
**Goal:** Ensure gamers don't lose data when playing on unstable connections (e.g., commuting, poor Wi-Fi).
**Estimated Effort:** 1 Week

*   **Task 2.1: Firestore Offline Persistence**
    *   Enable `enableIndexedDbPersistence` (or the newer `initializeFirestore` with `localCache`) in `src/firebase.ts`.
    *   Configure cache size limits to prevent browser storage bloat.
*   **Task 2.2: Offline State UI**
    *   Add a subtle connection status indicator (e.g., a cloud icon with a slash when offline).
    *   Ensure the UI clearly indicates when notes are "Saved Locally" vs. "Synced to Cloud".
*   **Task 2.3: Conflict Resolution Testing**
    *   Test edge cases: User edits a note offline, while another session (e.g., on their phone) edits the same note online. Ensure Firestore's default last-write-wins behavior is acceptable or implement custom merging if necessary.

---

## Sprint 3: UX Polish & Scalability Monitoring
**Goal:** Improve edge-case UX and monitor database performance under load.
**Estimated Effort:** 1 Week

*   **Task 3.1: Asynchronous AI Feedback**
    *   Update the UI to show a "processing" state (e.g., a spinning sparkle icon) on individual notes while the backend is generating tags.
    *   Implement error boundaries and toast notifications if the AI tagging fails (e.g., due to safety filters or rate limits).
    *   Add a manual "Retry Tagging" button for notes that failed auto-categorization.
*   **Task 3.2: Monitor Fractional Indexing**
    *   *Context:* We are currently using `fractional-indexing` for drag-and-drop sorting, which is excellent for minimizing writes.
    *   *Action:* Set up Firebase monitoring to track write volume during heavy drag-and-drop usage to ensure the fractional keys aren't growing too long and requiring re-balancing.
*   **Task 3.3: Alpha Telemetry**
    *   Implement basic, privacy-respecting analytics (e.g., via Firebase Analytics) to track feature usage (e.g., how often are users using the "Quick Note" vs. full session notes?).
    *   Set up budget alerts in Google Cloud for Firestore reads/writes and Gemini API usage.

---

## Launch Checklist
- [x] Backend proxy deployed and tested.
- [x] Client-side API keys revoked/removed.
- [x] Rate limiting active.
- [x] Offline persistence verified.
- [ ] Budget alerts configured at $10, $50, and $100 thresholds.
- [ ] Alpha tester feedback channels (e.g., Discord server or feedback form) established.

---

## Addendum: Principal Engineer Risk Assessment (Pre-Launch)
**Date:** March 28, 2026

### 1. Client-Side Performance & State Management (High Risk)
**The Problem:** The "God Context" (`GameContext.tsx`). Currently, `GameContext` is an 800+ line monolith that holds *everything*.
*   **Re-render Cascades:** Updating a single note's status causes the entire application to re-render.
*   **Memory Bloat:** Loading a user's *entire* history of notes into memory on boot.
**Recommendation:** Before beta, break up the Context. Separate UI state from Data state. Consider React Query or SWR for data fetching and caching.

### 2. Runaway Costs & Database Scalability (Medium-High Risk)
**The Problem:** Firestore Read Amplification.
*   **The Math:** Global state structure likely attaches `onSnapshot` listeners to the entire `notes` collection. 100 users opening the app 5 times a day with 500 notes each = 250,000 reads/day just for initialization.
*   **Gemini API:** Rate limiting (50 requests/hour/user) protects from abuse, but token usage must be monitored.
**Recommendation:** Implement query pagination or cursor-based loading for notes (e.g., only fetch notes for the `activeSession` or most recent 50).

### 3. Security & Data Privacy (Medium Risk)
**The Problem:** Backend Trust & Firestore Rules.
*   **Backend Verification:** Ensure the Express proxy strictly verifies the Firebase Auth ID token via `firebase-admin` SDK.
*   **Firestore Rules:** Must enforce ownership (`request.auth.uid == resource.data.uid`) to prevent cross-tenant data access.
**Recommendation:** Execute a strict audit of `firestore.rules` and verify backend auth token validation.

### 4. Data Integrity & Edge Cases (Low-Medium Risk)
**The Problem:** Fractional Indexing Limits & Offline Eviction.
*   **Fractional Indexing:** String keys can grow too long and hit precision/Firestore limits after hundreds of drag-and-drops.
*   **Offline Storage:** Browsers can evict IndexedDB data if storage is low, potentially losing unsynced offline writes.
**Recommendation:** Log events for fractional indexing fallbacks. Ensure UI clearly communicates that "Saved Locally" requires eventual internet connection.

### The Verdict: GO for 100-User Alpha, with conditions.
Safe to launch provided **Firestore Rules** and **Backend Auth Verification** are locked down. 100 users will provide necessary telemetry. Scaling to 1,000+ users (Beta) will require refactoring `GameContext` and implementing paginated Firestore queries to manage read costs and client-side performance.
