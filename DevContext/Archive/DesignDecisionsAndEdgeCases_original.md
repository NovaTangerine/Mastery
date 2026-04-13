# Project Decisions & Edge Cases

This document serves as a long-term repository for architectural decisions, edge cases, and specific project details. It provides illustrative context for anyone (human or AI) contributing to the project, ensuring consistency in how complex scenarios are handled.

## Data Management & State

### 1. Cartridge Immutability
**Context / Edge Case:** A "Cartridge" is generated using various pieces of user-generated content (Posts, Reviews, Topic answers, Tags). What happens to a Cartridge if a user later edits or deletes a Post or Topic answer that is embedded within it? Are Cartridges "snapshots in time" (immutable) or "live dashboards" (mutable)?

**Decision:** Cartridges function as **immutable snapshots**. 
* They are treated as their own finished products rather than a combination of multiple live elements. 
* If a user edits or deletes a post or topic that was previously embedded in a Cartridge, the Cartridge remains exactly as it was at the time of creation. 
* **Reasoning:** This preserves the Cartridge as a historical artifact of the user's playthrough and prevents massive cascading database update issues (where deleting one post would require querying and updating every cartridge that ever referenced it).
