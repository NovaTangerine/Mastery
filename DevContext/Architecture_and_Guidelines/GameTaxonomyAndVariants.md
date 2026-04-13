# Game Taxonomy & Variant Handling (IGDB Integration)

**Context:** Gaming is filled with complex release structures—ports, remasters, remakes, "Game of the Year" editions, and expanded releases (e.g., *Persona 5* vs. *Persona 5 Royal*, or the many versions of *Resident Evil 4*). 

**The Goal:** Treat these as distinct listings (as IGDB does) while giving users a simple, conversational way to understand how they relate, ensuring community content isn't unnecessarily fragmented.

---

## 1. The IGDB Reality (How the data actually looks)
IGDB is fantastic, but it is highly granular. It uses a `category` field to define what a game is. For example:
* `0`: Main Game (*Persona 5*)
* `8`: Remake (*Resident Evil 4* 2023)
* `9`: Remaster (*The Last of Us Remastered*)
* `10`: Expanded Game (*Persona 5 Royal*)
* `11`: Port (*Resident Evil 4* on Nintendo Switch)

IGDB also provides fields like `version_parent`, `remakes`, and `remasters` which point back to the original game's ID. 

## 2. Architectural Strategy: The "Anchor" Model
To keep things simple for the user but technically accurate under the hood, we should adopt the **"Anchor" Model**.

* **The Anchor (Base Game):** The original "Main Game" release (e.g., *Resident Evil 4* 2005).
* **The Satellites (Variants):** Any remake, remaster, port, or expansion.

In our database, every Satellite game will have a `canonical_anchor_id` pointing back to its Base Game. Even though *Persona 5 Royal* has its own distinct page, reviews, and stats, our system fundamentally knows it "belongs" to the *Persona 5* family.

---

## 3. UX/UI Recommendations (Keeping it Conversational)

How do we expose this complex web to users without overwhelming them? 

### A. The "Unified Feed with Variant Tags" (Solving Fragmentation)
If I write a post about *Persona 5 Royal*, it shouldn't be hidden from fans of the base *Persona 5*. 
* **The Solution:** When a user visits the "Anchor" game page (*Persona 5*), the social feed aggregates posts from **all** its variants. However, each post gets a sleek, auto-generated tag: `Played on: Royal` or `Played on: Switch Port`. 
* **The Vibe:** It feels like one big, conversational community discussing the game universe, rather than 5 isolated communities.

### B. Topic Inheritance (Top-Down, Not Bottom-Up)
Topics (prompts/questions) should utilize the Anchor relationship.
* **Top-Down:** If a user creates a Topic on the Anchor game (*"Who is your favorite party member?"*), that Topic automatically propagates down and is answerable on all Satellite variants.
* **Bottom-Up Restriction:** If a user creates a Topic specifically on *Persona 5 Royal* (*"What did you think of the new third semester?"*), it stays scoped **only** to Royal, because it doesn't make sense for the base game.

### C. The "Other Versions" Drawer
On any game page, we shouldn't clutter the main UI with a massive list of ports. 
* **The Solution:** A simple, conversational UI element near the top: *"You're looking at the 2023 Remake. [See 4 other versions]"*. 
* Clicking it opens a clean drawer or modal showing the Anchor game and the other variants, categorized simply (e.g., "Original", "Remasters", "Expansions").

### D. Cartridge Roll-ups
When a user generates a Cartridge or looks at their "Top 10 Games", we should visually group variants if they add multiple. If they played *RE4 (2005)* and *RE4 Remake (2023)*, the UI can smartly stack them or acknowledge the dedication to the franchise, rather than treating them as two completely unrelated database entries.

---

## 4. Edge Cases to Watch Out For

* **The "Ship of Theseus" Remake:** *Final Fantasy VII* (1997) and *Final Fantasy VII Remake* (2020) share a name, but the remake is a completely different genre, story, and experience. In these rare cases, we may need a manual admin override to sever the "Anchor" relationship so they are treated as entirely separate universes.
* **HD Collections:** Games like *Kingdom Hearts HD 1.5 Remix* contain multiple base games. IGDB handles these as "Bundles". We need to decide if users review the *Bundle* or if we force them to review the individual games inside it. (Recommendation: Force them to review the individual games to keep the data clean).
* **DLC & Content Expansion:** Standalone DLCs are treated as individual listings in IGDB. They should remain distinct but can be linked back to the "Base Game" Cartridge to show a cohesive journey. Users will have limited ability to manually update or add "Notes" to a generated Cartridge to reflect post-launch updates or continued play.

## 5. Summary for the MVP
For Phase 1, we don't need to build the complex Topic Inheritance or Unified Feeds. We just need to ensure that when we ingest a game from IGDB, we **save its `parent_game` or `version_parent` ID** into our database. 

As long as we capture that relationship data on Day 1, we can build all the cool conversational UI and unified feeds in Phase 2 and 3 without having to backfill thousands of records.
