# Launch Follow-Up

The following are the three most recent MVP/launch suggestions that have not yet been implemented, prioritized for the next development cycles:

## 1. Runaway Costs & Database Scalability
**The Problem:** Firestore Read Amplification and Gemini API Token Monitoring.
*   **Firestore:** While notes are scoped to the active session, secondary collections (`games`, `sessions`, `drafts`) still need reasonable upper bounds (`limit(100)`) to prevent unbounded queries and read amplification.
*   **Gemini API:** We need to capture `usageMetadata` from the `@google/genai` SDK and store it in an `api_usage` collection to monitor token volume and accurately forecast costs.

## 2. Security & Data Privacy Audit
**The Problem:** Backend Trust & Firestore Rules.
*   **Backend Verification:** The Express proxy needs to check for revoked tokens (`verifyIdToken(idToken, true)`) to ensure disabled accounts are immediately cut off.
*   **Firestore Rules:** A strict audit is required to enforce size limits on optional string fields (preventing 1MB payload DoS attacks), validate deep arrays (like `tags`), enforce schema shapes (`hasOnlyAllowedFields`), and protect immutable fields (`createdAt`, `gameId`).

## 3. Data Integrity & Edge Cases
**The Problem:** Fractional Indexing Limits & Offline Eviction.
*   **Fractional Indexing:** We need to monitor the length of generated string keys during drag-and-drop operations. If they exceed a safe threshold, we should log a telemetry event and safely fallback to appending to prevent UI crashes.
*   **Offline Storage:** We need to implement a global network status listener (`navigator.onLine`) and display a persistent UI banner when offline, setting the correct user expectation that changes are saved locally until reconnected.
