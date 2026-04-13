# Project Decisions & Edge Cases

This document serves as a long-term repository for architectural decisions, edge cases, and specific project details. It provides illustrative context for anyone (human or AI) contributing to the project, ensuring consistency in how complex scenarios are handled.

## Data Management & State

### 1. Cartridge Immutability
**Context / Edge Case:** A "Cartridge" is generated using various pieces of user-generated content (Posts, Reviews, Topic answers, Tags). What happens to a Cartridge if a user later edits or deletes a Post or Topic answer that is embedded within it? Are Cartridges "snapshots in time" (immutable) or "live dashboards" (mutable)?

**Decision:** Cartridges function as **immutable snapshots**. 
* They are treated as their own finished products rather than a combination of multiple live elements. 
* If a user edits or deletes a post or topic that was previously embedded in a Cartridge, the Cartridge remains exactly as it was at the time of creation. 
* **Reasoning:** This preserves the Cartridge as a historical artifact of the user's playthrough and prevents massive cascading database update issues (where deleting one post would require querying and updating every cartridge that ever referenced it).

### 2. Exit States & Cartridge Eligibility
**Context / Edge Case:** Should users be able to generate a Cartridge for a game they abandoned out of frustration?

**Decision:** Cartridge generation is gated based on the exit state to maintain a constructive community culture.
* **Completed:** Standard generation.
* **Backburnered:** Locked. Encourages returning to complete the game.
* **Abandoned:** Gated/Restricted. We allow an "Extraordinary Disappointment" exception with limited allocations. This ensures that commemorating a failure carries weight and provides unique insight rather than low-effort complaints.

### 3. Spoiler Governance
**Context / Edge Case:** How do we prevent spoilers from leaking into the global feed or Cartridges?

**Decision:** Spoiler architecture is suggestive, not restrictive.
* **Inheritance:** Cartridges will respect spoiler tags from source content (Journals/Posts) by default.
* **User Agency:** Users maintain "Creative Director" rights over their Cartridges, allowing them to toggle spoiler markings or edit text specifically for the generated "Postcard."

### 4. Content Visibility Hierarchy
**Context / Edge Case:** What content is public vs. private?

**Decision:** The journal is a private workshop.
* **Private by Default:** Journal entries and session notes are hidden from the social feed.
* **Promotion:** Users can "promote" specific, high-value journal entries directly to their feed as Posts.
* **Weighting:** The feed prioritizes quality: Reviews (Highest) > Topics (High) > Cartridges (Medium) > Posts (Low).
